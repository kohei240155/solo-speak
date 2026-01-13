# API仕様

## 共通仕様

### 認証

```typescript
// すべてのAPIでauthorizeRequest()を使用
import { authenticateRequest } from "@/utils/api-helpers";

const authResult = await authenticateRequest(request);
if ("error" in authResult) {
  return authResult.error;  // 401 Unauthorized
}
const userId = authResult.user.id;
```

### リクエストヘッダー

```
Authorization: Bearer <jwt_token>
Accept-Language: ja  # エラーメッセージのローカライズ
Content-Type: application/json
```

### レスポンス型

**ファイル**: `src/types/api.ts`

```typescript
export interface ApiErrorResponse {
  error: string;
  details?: unknown;
}
```

---

## APIドキュメント一覧

### Languages API

| エンドポイント | メソッド | ドキュメント |
|---------------|---------|-------------|
| `/api/languages` | GET | [get-languages.md](languages/get-languages.md) |

### Phrase API

| エンドポイント | メソッド | ドキュメント |
|---------------|---------|-------------|
| `/api/phrase` | GET | [get-phrases.md](phrase/get-phrases.md) |
| `/api/phrase` | POST | [post-phrase.md](phrase/post-phrase.md) |
| `/api/phrase/[id]` | PUT | [put-phrase-id.md](phrase/put-phrase-id.md) |
| `/api/phrase/[id]` | DELETE | [delete-phrase-id.md](phrase/delete-phrase-id.md) |
| `/api/phrase/generate` | POST | [post-phrase-generate.md](phrase/post-phrase-generate.md) |
| `/api/phrase/remaining` | GET | [get-phrase-remaining.md](phrase/get-phrase-remaining.md) |
| `/api/phrase/[id]/speak` | GET | [get-phrase-id-speak.md](phrase/get-phrase-id-speak.md) |
| `/api/phrase/[id]/count` | POST | [post-phrase-id-count.md](phrase/post-phrase-id-count.md) |
| `/api/phrase/speak` | GET | [get-phrase-speak.md](phrase/get-phrase-speak.md) |
| `/api/phrase/speak/count` | GET | [get-phrase-speak-count.md](phrase/get-phrase-speak-count.md) |
| `/api/phrase/quiz` | GET | [get-phrase-quiz.md](phrase/get-phrase-quiz.md) |
| `/api/phrase/quiz/answer` | POST | [post-phrase-quiz-answer.md](phrase/post-phrase-quiz-answer.md) |
| `/api/phrases/reset-session` | POST | [post-phrases-reset-session.md](phrase/post-phrases-reset-session.md) |

### Speech API

| エンドポイント | メソッド | ドキュメント |
|---------------|---------|-------------|
| `/api/speech` | GET | [get-speeches.md](speech/get-speeches.md) |
| `/api/speech/[id]` | GET | [get-speech-id.md](speech/get-speech-id.md) |
| `/api/speech/[id]` | PUT | [put-speech-id.md](speech/put-speech-id.md) |
| `/api/speech/[id]` | DELETE | [delete-speech-id.md](speech/delete-speech-id.md) |
| `/api/speech/save` | POST | [post-speech-save.md](speech/post-speech-save.md) |
| `/api/speech/correct` | POST | [post-speech-correct.md](speech/post-speech-correct.md) |
| `/api/speech/transcribe` | POST | [post-speech-transcribe.md](speech/post-speech-transcribe.md) |
| `/api/speech/remaining` | GET | [get-speech-remaining.md](speech/get-speech-remaining.md) |
| `/api/speech/review` | GET | [get-speech-review.md](speech/get-speech-review.md) |
| `/api/speech/review/count` | GET | [get-speech-review-count.md](speech/get-speech-review-count.md) |
| `/api/speech/statuses` | GET | [get-speech-statuses.md](speech/get-speech-statuses.md) |
| `/api/speech/[id]/status` | PUT | [put-speech-id-status.md](speech/put-speech-id-status.md) |
| `/api/speech/[id]/notes` | PUT | [put-speech-id-notes.md](speech/put-speech-id-notes.md) |
| `/api/speech/[id]/practice` | POST | [post-speech-id-practice.md](speech/post-speech-id-practice.md) |

### TTS API

| エンドポイント | メソッド | ドキュメント |
|---------------|---------|-------------|
| `/api/tts` | POST | [post-tts.md](tts/post-tts.md) |

### Situations API

| エンドポイント | メソッド | ドキュメント |
|---------------|---------|-------------|
| `/api/situations` | GET | [get-situations.md](situations/get-situations.md) |
| `/api/situations` | POST | [post-situations.md](situations/post-situations.md) |
| `/api/situations/[id]` | DELETE | [delete-situation-id.md](situations/delete-situation-id.md) |

### Dashboard API

| エンドポイント | メソッド | ドキュメント |
|---------------|---------|-------------|
| `/api/dashboard` | GET | [get-dashboard.md](dashboard/get-dashboard.md) |

### Ranking API

| エンドポイント | メソッド | ドキュメント |
|---------------|---------|-------------|
| `/api/ranking/quiz` | GET | [get-ranking-quiz.md](ranking/get-ranking-quiz.md) |
| `/api/ranking/quiz/streak` | GET | [get-ranking-quiz-streak.md](ranking/get-ranking-quiz-streak.md) |
| `/api/ranking/speak` | GET | [get-ranking-speak.md](ranking/get-ranking-speak.md) |
| `/api/ranking/speak/streak` | GET | [get-ranking-speak-streak.md](ranking/get-ranking-speak-streak.md) |
| `/api/ranking/phrase` | GET | [get-ranking-phrase.md](ranking/get-ranking-phrase.md) |
| `/api/ranking/phrase/streak` | GET | [get-ranking-phrase-streak.md](ranking/get-ranking-phrase-streak.md) |
| `/api/ranking/speech` | GET | [get-ranking-speech.md](ranking/get-ranking-speech.md) |
| `/api/ranking/speech/streak` | GET | [get-ranking-speech-streak.md](ranking/get-ranking-speech-streak.md) |
| `/api/ranking/speech/add` | GET | [get-ranking-speech-add.md](ranking/get-ranking-speech-add.md) |
| `/api/ranking/speech/add/streak` | GET | [get-ranking-speech-add-streak.md](ranking/get-ranking-speech-add-streak.md) |

### User API

| エンドポイント | メソッド | ドキュメント |
|---------------|---------|-------------|
| `/api/user/settings` | GET | [get-user-settings.md](user/get-user-settings.md) |
| `/api/user/settings` | POST | [post-user-settings.md](user/post-user-settings.md) |
| `/api/user/settings` | PUT | [put-user-settings.md](user/put-user-settings.md) |
| `/api/user/icon` | POST | [post-user-icon.md](user/post-user-icon.md) |
| `/api/user/icon` | DELETE | [delete-user-icon.md](user/delete-user-icon.md) |
| `/api/user/icon/google` | POST | [post-user-icon-google.md](user/post-user-icon-google.md) |
| `/api/user/reset-daily-speak-count` | POST | [post-user-reset-daily-speak-count.md](user/post-user-reset-daily-speak-count.md) |
| `/api/user/withdrawal` | DELETE | [delete-user-withdrawal.md](user/delete-user-withdrawal.md) |

### Stripe API

| エンドポイント | メソッド | ドキュメント |
|---------------|---------|-------------|
| `/api/stripe/checkout` | POST | [post-stripe-checkout.md](stripe/post-stripe-checkout.md) |
| `/api/stripe/subscription` | GET | [get-stripe-subscription.md](stripe/get-stripe-subscription.md) |
| `/api/stripe/cancel` | POST | [post-stripe-cancel.md](stripe/post-stripe-cancel.md) |
| `/api/stripe/webhook` | POST | [post-stripe-webhook.md](stripe/post-stripe-webhook.md) |

---

## 関連ファイル

新規APIルートの作成方法は [backend/api-routes.md](../backend/api-routes.md) を参照。

| ファイル | 説明 |
|----------|------|
| `src/utils/api-helpers.ts` | `authenticateRequest()`, `validateUsername()` 等 |
| `src/utils/api-i18n.ts` | `getLocaleFromRequest()`, `getTranslation()` |
| `src/types/api.ts` | `ApiErrorResponse` 等 |
| `src/types/phrase.ts` | フレーズ関連の型 |
| `src/types/speech.ts` | スピーチ関連の型 |
| `src/prompts/` | AIプロンプト |
