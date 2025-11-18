import { supabase } from "./spabase";
import { createServerSupabaseClient } from "./supabase-server";

export async function uploadUserIcon(
	file: File,
	userId: string,
	serverMode: boolean = false,
): Promise<string> {
	try {
		let supabaseClient = supabase;

		// サーバーサイドモードの場合は、サーバーサイドクライアントを使用
		if (serverMode) {
			const { createServerSupabaseClient } = await import(
				"@/utils/supabase-server"
			);
			supabaseClient = createServerSupabaseClient();
		} else {
			// 認証状態を確認（クライアントサイドのみ）
			const {
				data: { session },
			} = await supabase.auth.getSession();
			if (!session) {
				throw new Error("認証が必要です");
			}
		}

		// バケットの存在確認とアップロード前の準備
		await ensureStorageBucket();

		// ファイル名を生成（重複回避のためタイムスタンプを含む）
		const fileExt = file.name.split(".").pop();
		const fileName = `${userId}_${Date.now()}.${fileExt}`;
		const filePath = `user-icons/${fileName}`;

		// Supabase Storageにアップロード
		const { error } = await supabaseClient.storage
			.from("images")
			.upload(filePath, file, {
				cacheControl: "3600",
				upsert: true, // 同じファイル名の場合は上書き
			});

		if (error) {
			// RLSエラーの場合はより詳細なエラーメッセージを提供
			if (
				error.message.includes("row-level security") ||
				error.message.includes("policy")
			) {
				throw new Error(
					`画像のアップロード権限がありません。RLSポリシーを確認してください。\n詳細: ${error.message}`,
				);
			}

			throw new Error(`画像のアップロードに失敗しました: ${error.message}`);
		}

		// 公開URLを取得
		const { data: publicUrlData } = supabaseClient.storage
			.from("images")
			.getPublicUrl(filePath);

		// URL の有効性をテスト（オプション）
		try {
			const testResponse = await fetch(publicUrlData.publicUrl, {
				method: "HEAD",
			});
			// 公開URLでアクセスできない場合は、認証付きURLを試す
			if (!testResponse.ok) {
				const { data: signedUrlData, error: signedUrlError } =
					await supabaseClient.storage
						.from("images")
						.createSignedUrl(filePath, 365 * 24 * 60 * 60); // 1年間有効

				if (signedUrlError) {
					// Error creating signed URL
				} else {
					return signedUrlData.signedUrl;
				}
			}
		} catch {
			// URL accessibility test failed
		}

		return publicUrlData.publicUrl;
	} catch (error) {
		throw error;
	}
}

export async function deleteUserIcon(iconUrl: string): Promise<void> {
	try {
		// ローカルのBlob URLの場合は削除処理をスキップ
		if (iconUrl.startsWith("blob:")) {
			return;
		}

		// Google URLの場合はスキップ
		if (
			iconUrl.includes("googleusercontent.com") ||
			iconUrl.includes("googleapis.com") ||
			iconUrl.includes("google.com")
		) {
			return;
		}

		// サーバーサイドクライアントを使用（より強い権限で削除操作）
		const serverSupabase = createServerSupabaseClient();

		// URLからファイルパスを抽出
		let url: URL;
		try {
			url = new URL(iconUrl);
		} catch {
			throw new Error("無効なURL形式です");
		}

		const pathSegments = url.pathname.split("/");

		// Supabaseストレージの公開URLの構造: /storage/v1/object/public/images/user-icons/filename
		const imagesIndex = pathSegments.findIndex(
			(segment) => segment === "images",
		);
		if (imagesIndex === -1) {
			throw new Error("無効なストレージURL構造です");
		}

		// images以降のパスを取得
		const filePath = pathSegments.slice(imagesIndex + 1).join("/");

		if (!filePath) {
			throw new Error("ファイルパスが空です");
		}

		// ファイルの削除を実行
		const deleteResult = await serverSupabase.storage
			.from("images")
			.remove([filePath]);

		if (deleteResult.error) {
			throw new Error(
				`画像の削除に失敗しました: ${deleteResult.error.message}`,
			);
		}
	} catch (error) {
		throw error;
	}
}

/**
 * Storage bucketの存在確認・作成
 */
export async function ensureStorageBucket(): Promise<boolean> {
	try {
		// 既存buckets一覧を取得
		const { data: buckets, error: listError } =
			await supabase.storage.listBuckets();
		if (listError) {
			return false;
		}

		// imagesバケットの存在確認
		const imagesBucket = buckets?.find((bucket) => bucket.name === "images");
		if (imagesBucket) {
			return true;
		}

		// バケットが存在しない場合は作成
		const { error } = await supabase.storage.createBucket("images", {
			public: true,
			allowedMimeTypes: [
				"image/png",
				"image/jpeg",
				"image/jpg",
				"image/gif",
				"image/webp",
			],
			fileSizeLimit: 10 * 1024 * 1024, // 10MB
		});

		if (error) {
			// Bucket already exists error は無視
			if (error.message?.includes("already exists")) {
				return true;
			}
			return false;
		}

		return true;
	} catch {
		return false;
	}
}

// Googleアバターをダウンロードしてアップロード
export async function downloadAndUploadGoogleAvatar(
	googleAvatarUrl: string,
	userId: string,
): Promise<string> {
	try {
		// Google画像をダウンロード
		const response = await fetch(googleAvatarUrl, {
			headers: {
				"User-Agent": "Mozilla/5.0 (compatible; Solo-Speak-Bot/1.0)",
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to download image: ${response.status}`);
		}

		const arrayBuffer = await response.arrayBuffer();
		const file = new File([arrayBuffer], `google-avatar-${userId}.jpg`, {
			type: "image/jpeg",
		});

		// Supabase Storageにアップロード
		return await uploadUserIcon(file, userId, true);
	} catch (error) {
		throw error;
	}
}
