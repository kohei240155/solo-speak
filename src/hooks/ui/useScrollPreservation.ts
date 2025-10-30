import { useCallback, useRef } from "react";

/**
 * フォーム要素のフォーカス/ブラー時にスクロール位置を保持するフック
 */
export function useScrollPreservation() {
	const scrollPositionRef = useRef<number>(0);

	const handleFocus = useCallback(() => {
		// フォーカス時にスクロール位置を保存
		scrollPositionRef.current =
			window.pageYOffset || document.documentElement.scrollTop;
	}, []);

	const handleBlur = useCallback(() => {
		// ブラー時にスクロール位置を復元（少し遅延して実行）
		setTimeout(() => {
			const savedPosition = scrollPositionRef.current;
			const currentPosition =
				window.pageYOffset || document.documentElement.scrollTop;

			// 現在位置と保存位置が大きく異なる場合のみ復元
			if (Math.abs(currentPosition - savedPosition) > 100) {
				window.scrollTo({
					top: savedPosition,
					behavior: "instant" as ScrollBehavior,
				});
			}
		}, 100);
	}, []);

	return {
		onFocus: handleFocus,
		onBlur: handleBlur,
	};
}
