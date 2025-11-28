# Solo Speak アプリのuseEffect内データフェッチ箇所ドキュメント

## 概要

このドキュメントは、Solo Speakアプリケーション内でuseEffect hook内でデータフェッチを行っている箇所を特定し、整理したものです。

## useEffect内でデータフェッチを行っている箇所一覧

### 1. AuthContext.tsx

**ファイルパス:** `src/contexts/AuthContext.tsx`

#### 1.1 初期セッション取得と認証状態監視

```typescript
// 行: 47-110
useEffect(() => {
	// タイムアウト設定（5秒後に強制的にローディング解除）
	const loadingTimeout = setTimeout(() => {
		setLoading(false);
		// ... 状態リセット処理
	}, 5000);

	// 現在のセッションを取得
	const getSession = async () => {
		const {
			data: { session },
			error,
		} = await supabase.auth.getSession();
		// セッション状態の更新処理
	};

	getSession();

	// 認証状態の変更を監視
	const {
		data: { subscription },
	} = supabase.auth.onAuthStateChange(async (event, session) => {
		// 認証状態変更時の処理
	});
});
```

**目的:** アプリケーション初期化時のユーザー認証状態取得と監視

#### 1.2 ユーザー設定取得とリフレッシュ

```typescript
// 行: 227-240
useEffect(() => {
	if (user?.id && session && !loading) {
		// Googleアバターを即座に設定
		const googleAvatarUrl =
			user.user_metadata?.avatar_url || user.user_metadata?.picture;
		if (googleAvatarUrl) {
			setUserIconUrl(googleAvatarUrl);
		}

		// ユーザー設定を取得（初回セットアップの確認）
		refreshUserSettings(); // APIリクエストを含む
	}
}, [user?.id, session, loading, refreshUserSettings]);
```

**目的:** ログイン後のユーザー設定データの取得とアイコン設定

### 2. QuizModeModal.tsx

**ファイルパス:** `src/components/modals/QuizModeModal.tsx`

#### 2.1 フレーズ数調整

```typescript
// 行: 28-32
useEffect(() => {
	// デフォルトは10、フレーズ数が10未満の場合でも10に設定
	setQuestionCount(10);
}, [availablePhraseCount]);
```

**目的:** 利用可能なフレーズ数に基づく問題数の調整（直接的なAPIフェッチはなし）

#### 2.2 モーダル状態初期化

```typescript
// 行: 34-40
useEffect(() => {
	if (isOpen) {
		setQuestionCount(10);
		setSpeakCountFilter(50); // 音読回数フィルターも初期化
	}
}, [isOpen]);
```

**目的:** モーダル開閉時の状態初期化

#### 2.3 Quiz API呼び出し（handleStart関数内）

```typescript
// 行: 79-91
const data = await api.get<{
	success: boolean;
	phrases?: unknown[];
	message?: string;
}>(`/api/phrase/quiz?${params.toString()}`);
```

**目的:** クイズ開始前のフレーズ可用性確認

### 3. useQuizPhrase.ts

**ファイルパス:** `src/hooks/quiz/useQuizPhrase.ts`

#### 3.1 URLパラメータ更新

```typescript
// 行: 29-36
useEffect(() => {
	if (session && session.currentIndex > 0) {
		const params = new URLSearchParams(window.location.search);
		params.set("currentIndex", session.currentIndex.toString());
		const newUrl = `${window.location.pathname}?${params.toString()}`;
		window.history.replaceState({}, "", newUrl);
	}
}, [session]);
```

**目的:** クイズセッション進行状況のURL同期（データフェッチなし）

#### 3.2 Quiz API フェッチ（fetchQuizSession関数内）

```typescript
// 行: 54
const data = await api.get<{ success: boolean, phrases?: QuizPhrase[], ... }>(`/api/phrase/quiz?${params.toString()}`)
```

**目的:** クイズセッション用フレーズの取得

### 4. useSpeakPhrase.ts

**ファイルパス:** `src/hooks/speak/useSpeakPhrase.ts`

#### 4.1 URLパラメータから設定復元

```typescript
// 行: 19-32
useEffect(() => {
	const params = new URLSearchParams(window.location.search);
	const language = params.get("language");
	const excludeIfSpeakCountGTE = params.get("excludeIfSpeakCountGTE");
	const excludeTodayPracticed = params.get("excludeTodayPracticed");

	if (language) {
		const restoredConfig: SpeakConfig = {
			language,
			excludeIfSpeakCountGTE:
				excludeIfSpeakCountGTE && excludeIfSpeakCountGTE !== ""
					? parseInt(excludeIfSpeakCountGTE, 10)
					: undefined,
			excludeTodayPracticed: excludeTodayPracticed === "true",
		};
		setSavedConfig(restoredConfig);
	}
}, []);
```

**目的:** ページリロード時の設定状態復元

#### 4.2 日付変更検出とフレーズ再取得

```typescript
// 行: 210-226
useEffect(() => {
	let currentUTCDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD形式

	const checkDateChange = () => {
		const newUTCDate = new Date().toISOString().split("T")[0];
		if (newUTCDate !== currentUTCDate) {
			currentUTCDate = newUTCDate;
			// 日付が変わったら現在のフレーズの情報を再取得
			if (currentPhrase && savedConfig) {
				fetchSpeakPhrase(savedConfig); // APIフェッチ
			}
		}
	};

	// 1分ごとに日付変更をチェック
	const interval = setInterval(checkDateChange, 60 * 1000);

	return () => clearInterval(interval);
}, [currentPhrase, savedConfig, fetchSpeakPhrase]);
```

**目的:** 日付変更時の自動フレーズ再取得

#### 4.3 Speak API フェッチ（fetchSpeakPhrase関数内）

```typescript
// 行: 87
const data = await api.get<{ success: boolean, phrase?: SpeakPhrase, ... }>(`/api/phrase/speak?${params.toString()}`)
```

**目的:** 音読練習用フレーズの取得

### 5. useUserSettings.ts

**ファイルパス:** `src/hooks/data/useUserSettings.ts`

#### 5.1 並列データ初期化

```typescript
// 行: 86-98
useEffect(() => {
	if (user) {
		Promise.all([
			fetchUserSettings(), // APIフェッチ
			fetchLanguages(), // APIフェッチ
		])
			.then(() => {
				setDataLoading(false);
			})
			.catch((error) => {
				console.error("Error loading initial data:", error);
				setDataLoading(false);
			});
	}
}, [user, fetchUserSettings, fetchLanguages]);
```

**目的:** ユーザーログイン後の初期データ取得

#### 5.2 fetchUserSettings関数内のAPIフェッチ

```typescript
// 行: 17
const userData = await api.get<UserSettingsResponse>(
	`/api/user/settings?t=${Date.now()}`,
	{
		headers: {
			"Cache-Control": "no-cache, no-store, must-revalidate",
			Pragma: "no-cache",
			Expires: "0",
		},
		showErrorToast: false,
	},
);
```

**目的:** ユーザー設定データの取得

#### 5.3 fetchLanguages関数内のAPIフェッチ

```typescript
// 行: 67
const data = await api.get<Language[]>(`/api/languages?t=${Date.now()}`, {
	headers: {
		"Cache-Control": "no-cache, no-store, must-revalidate",
		Pragma: "no-cache",
		Expires: "0",
	},
});
```

**目的:** 利用可能言語リストの取得

### 6. Dashboard page.tsx

**ファイルパス:** `src/app/dashboard/page.tsx`

#### 6.1 ユーザー設定完了状態チェック

```typescript
// 行: 20-25
useEffect(() => {
	if (user && userSettings !== undefined) {
		checkUserSetupComplete(); // 内部でリダイレクト判定
	}
}, [user, userSettings, checkUserSetupComplete]);
```

**目的:** ユーザー設定の完了状態確認とリダイレクト処理

#### 6.2 言語設定の初期化

```typescript
// 行: 27-31
useEffect(() => {
	if (userSettings?.defaultLearningLanguage?.code && !selectedLanguage) {
		setSelectedLanguage(userSettings.defaultLearningLanguage.code);
	}
}, [userSettings, selectedLanguage]);
```

**目的:** デフォルト学習言語の設定

### 7. usePhraseManager.ts

**ファイルパス:** `src/hooks/phrase/usePhraseManager.ts`

#### 7.1 ユーザーログアウト時の状態クリア

```typescript
// 行: 42-51
useEffect(() => {
	if (!user) {
		// ログアウト時に状態をクリア
		setRemainingGenerations(0);
		setSavedPhrases([]);
		setSituations([]);
		setUserSettingsInitialized(false);
		setLearningLanguage("en");
		setIsInitializing(true);
	}
}, [user]);
```

**目的:** ユーザーログアウト時の状態初期化

#### 7.2 ユーザー設定適用

```typescript
// 行: 64-73
useEffect(() => {
	if (userSettings && !userSettingsInitialized) {
		// ユーザー設定を適用
		if (userSettings.nativeLanguage?.code) {
			setNativeLanguage(userSettings.nativeLanguage.code);
		}
		if (userSettings.defaultLearningLanguage?.code) {
			setLearningLanguage(userSettings.defaultLearningLanguage.code);
		}
		setUserSettingsInitialized(true);
	}
}, [userSettings, userSettingsInitialized]);
```

**目的:** 取得したユーザー設定の適用

#### 7.3 初期データ並列取得

```typescript
// 行: 275-286
useEffect(() => {
	// ユーザーの初期データを並列取得
	if (user) {
		setIsInitializing(true);
		Promise.all([
			fetchSituations(), // APIフェッチ
			fetchUserRemainingGenerations(), // APIフェッチ
			fetchSavedPhrases(1, false), // APIフェッチ
		])
			.then(() => {
				setIsInitializing(false);
			})
			.catch((error) => {
				console.error("初期データ取得エラー:", error);
				setIsInitializing(false);
			});
	}
}, [user, fetchSavedPhrases, fetchUserRemainingGenerations, fetchSituations]);
```

**目的:** フレーズ管理に必要な初期データの並列取得

#### 7.4 学習言語変更時のフレーズ再取得

```typescript
// 行: 288-292
useEffect(() => {
	if (user) {
		fetchSavedPhrases(1, false); // APIフェッチ
	}
}, [learningLanguage, user, fetchSavedPhrases]);
```

**目的:** 学習言語変更時の保存済みフレーズ再取得

#### 7.5 各種APIフェッチ関数

- **fetchSituations()**: `/api/situations` - 状況リスト取得
- **fetchUserRemainingGenerations()**: `/api/user/phrase-generations` - 残り生成回数取得
- **fetchSavedPhrases()**: `/api/phrase?userId=${user.id}&languageCode=${learningLanguage}&page=${page}&limit=10` - 保存済みフレーズ取得

### 8. useSinglePhraseSpeak.ts

**ファイルパス:** `src/hooks/speak/useSinglePhraseSpeak.ts`

#### 8.1 フレーズIDリセット時の初期化

```typescript
// 行: 36-40
useEffect(() => {
	if (!phraseId) {
		setLocalPhrase(null);
		setLocalLoading(false);
	}
}, [phraseId]);
```

#### 8.2 フレーズデータ更新時の同期

```typescript
// 行: 57-82
useEffect(() => {
	if (singlePhraseFromAPI && !localLoading && phraseId) {
		// APIのデータでローカル状態を更新
		setLocalPhrase(singlePhraseFromAPI);
		// dailySpeakCount も更新
		if (
			singlePhraseData &&
			typeof singlePhraseData.dailySpeakCount === "number"
		) {
			setLocalDailySpeakCount(singlePhraseData.dailySpeakCount);
		}
	}
}, [singlePhraseFromAPI, singlePhraseData, localLoading, phraseId]);
```

#### 8.3 強制リフレッシュ処理

```typescript
// 行: 113-133
useEffect(() => {
	if (shouldForceRefresh && phraseId) {
		const timer = setTimeout(() => {
			if (refetchPhrase) {
				refetchPhrase(); // データ再フェッチ
			}
			setShouldForceRefresh(false);
		}, 100);

		return () => clearTimeout(timer);
	}
}, [phraseId, refetchPhrase]);
```

**目的:** 単一フレーズデータの強制リフレッシュ

## データフェッチング機能

### APIフック (src/hooks/api/)

**ファイルパス:** `src/hooks/api/`

このディレクトリには以下のデータフェッチングフックが定義されています：

1. **useUserSettings()** - `/api/user/settings`
2. **useLanguages()** - `/api/languages`
3. **useDashboardData()** - `/api/dashboard?language=${language}`
4. **usePhraseList()** - `/api/phrase?languageCode=${language}&page=${page}&limit=10&minimal=true`
5. **usePhraseById()** - `/api/phrase/${phraseId}`
6. **useSpeakPhrase()** - `/api/phrase/speak?language=${language}`
7. **useSpeakPhraseById()** - `/api/phrase/${phraseId}/speak`
8. **usePhraseInfinite()** - フレーズの無限スクロール対応
9. **useRankingData()** - `/api/ranking/${type}?language=${language}&period=${validPeriod}`

これらのフックは内部的にデータフェッチを行い、キャッシュ、再検証、エラーハンドリングを自動的に処理します。

## データフェッチの特徴とパターン

### 1. 認証依存フェッチ

多くのデータフェッチは`user`の存在に依存しており、ログイン状態でのみ実行されます。

### 2. 並列データ取得

初期化時には複数のAPIを並列で呼び出してパフォーマンスを向上させています。

### 3. キャッシュ無効化

重要なデータ（ユーザー設定、言語データ）についてはタイムスタンプやキャッシュ無効化ヘッダーを使用してフレッシュなデータを取得しています。

### 4. エラーハンドリング

LP画面などでは`showErrorToast: false`を使用してエラートーストを無効化し、サイレントにエラーを処理しています。

### 5. 状態同期

5. URLパラメータやローカルストレージと状態を同期させるパターンが多用されています。

### 6. 自動再検証

多くのデータフェッチがキャッシュ機能を持つフックに移行されており、自動的な再検証とキャッシュ管理が行われています。

## 改善提案

1. **一貫性の向上**: 一部のフェッチはまだ手動でuseEffectを使用しているため、キャッシュ機能を持つフックへの移行を検討
2. **エラーハンドリングの統一**: エラー処理パターンの統一化
3. **ローディング状態の最適化**: 複数のローディング状態の統合と最適化
4. **依存関係の整理**: useEffectの依存配列の最適化

このドキュメントは2025年8月11日時点での分析結果です。
