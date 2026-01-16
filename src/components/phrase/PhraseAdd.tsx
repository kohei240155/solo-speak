import { PhraseVariation } from "@/types/phrase";
import { SituationResponse } from "@/types/situation";
import dynamic from "next/dynamic";
import { BsPlusSquare } from "react-icons/bs";
import { AiOutlineClose, AiOutlineQuestionCircle } from "react-icons/ai";
import { IoLocationOutline, IoFlash, IoChatbubbleOutline } from "react-icons/io5";
import { useState } from "react";
import AddContextModal from "@/components/modals/AddContextModal";
import BaseModal from "@/components/common/BaseModal";
import PhraseGenerationHelpModal from "@/components/modals/PhraseGenerationHelpModal";
import { useScrollPreservation } from "@/hooks/ui/useScrollPreservation";
import ScrollableContainer from "@/components/common/ScrollableContainer";
import { useTranslation } from "@/hooks/ui/useTranslation";

// GeneratedVariationsコンポーネントを動的インポート
const GeneratedVariations = dynamic(() => import("./GeneratedVariations"), {
	ssr: false,
});

// RandomGeneratedVariationsコンポーネントを動的インポート
const RandomGeneratedVariations = dynamic(
	() => import("./RandomGeneratedVariations"),
	{
		ssr: false,
	},
);

interface PhraseAddProps {
	remainingGenerations: number;
	hasActiveSubscription?: boolean;
	desiredPhrase: string;
	phraseValidationError: string;
	isLoading: boolean;
	isSaving: boolean;
	generatedVariations: PhraseVariation[];
	editingVariations: { [key: number]: string };
	editingTranslations: { [key: number]: string };
	savingVariationIndex: number | null;
	error: string;
	selectedContext: "friend" | "sns" | string | null;
	situations: SituationResponse[];
	onPhraseChange: (value: string) => void;
	onGeneratePhrase: () => void;
	onEditVariation: (index: number, newText: string) => void;
	onEditTranslation: (index: number, newText: string) => void;
	onSelectVariation: (variation: PhraseVariation, index: number) => void;
	onContextChange?: (context: string | null) => void;
	addSituation: (name: string) => Promise<void>;
	deleteSituation: (id: string) => Promise<void>;
	// Random Mode props
	isRandomMode: boolean;
	randomGeneratedVariations: PhraseVariation[];
	isRandomSaving: boolean;
	onToggleRandomMode: (enabled: boolean) => void;
	onRandomGenerate: () => void;
	onSaveRandomPhrase: () => void;
}

export default function PhraseAdd({
	remainingGenerations,
	// SUBSCRIPTION_DISABLED: hasActiveSubscription パラメータを一時的に無効化（未使用）
	// hasActiveSubscription = false,
	desiredPhrase,
	phraseValidationError,
	isLoading,
	isSaving,
	generatedVariations,
	editingVariations,
	editingTranslations,
	savingVariationIndex,
	error,
	selectedContext,
	situations,
	onPhraseChange,
	onGeneratePhrase,
	onEditVariation,
	onEditTranslation,
	onSelectVariation,
	onContextChange,
	addSituation,
	deleteSituation,
	// Random Mode
	isRandomMode,
	randomGeneratedVariations,
	isRandomSaving,
	onToggleRandomMode,
	onRandomGenerate,
	onSaveRandomPhrase,
}: PhraseAddProps) {
	const { t } = useTranslation("app");

	// モーダルの状態管理
	const [isAddContextModalOpen, setIsAddContextModalOpen] = useState(false);
	const [deletingSituationId, setDeletingSituationId] = useState<string | null>(
		null,
	);
	const [isDeleting, setIsDeleting] = useState(false);
	const [showHelpModal, setShowHelpModal] = useState(false);

	// スクロール位置保持機能
	const scrollPreservation = useScrollPreservation();

	// ボタンが有効かどうかを判定する関数
	const isGenerateButtonEnabled = () => {
		return (
			!isLoading &&
			!isSaving &&
			desiredPhrase.trim() &&
			remainingGenerations > 0 &&
			desiredPhrase.length <= 100 &&
			generatedVariations.length === 0
		);
	};

	// ランダム生成ボタンが有効かどうかを判定する関数
	const isRandomGenerateButtonEnabled = () => {
		return (
			!isLoading &&
			!isRandomSaving &&
			remainingGenerations > 0 &&
			randomGeneratedVariations.length === 0
		);
	};

	// 生成結果が表示中かどうか
	const hasGeneratedResults = isRandomMode
		? randomGeneratedVariations.length > 0
		: generatedVariations.length > 0;

	// シチュエーション追加のハンドラー
	const handleAddContext = async (contextName: string) => {
		try {
			await addSituation(contextName);
		} catch {
			// エラーは addSituation 内で適切に処理される
		}
	};

	// シチュエーション削除のハンドラー
	const handleDeleteSituation = (situationId: string) => {
		setDeletingSituationId(situationId);
	};

	const handleConfirmDelete = async () => {
		if (!deletingSituationId) return;

		setIsDeleting(true);
		try {
			await deleteSituation(deletingSituationId);
			setDeletingSituationId(null);

			// 削除したシチュエーションが選択されていた場合、選択を解除
			if (
				selectedContext &&
				situations.find((s: SituationResponse) => s.id === deletingSituationId)
					?.name === selectedContext
			) {
				onContextChange?.(null);
			}
		} catch {
			// エラーは deleteSituation 内で適切に処理される
		} finally {
			setIsDeleting(false);
		}
	};

	const handleCancelDelete = () => {
		setDeletingSituationId(null);
	};
	return (
		<>
			{/* Add Phrase見出しとLeft情報 */}
			<div className="flex justify-between items-center mb-2">
				<div className="flex items-center gap-2">
					<h2 className="text-xl sm:text-2xl font-bold text-gray-900">
						{t("phrase.add.title")}
					</h2>
					<button
						onClick={() => setShowHelpModal(true)}
						className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
					>
						<AiOutlineQuestionCircle size={20} />
					</button>
				</div>
				<div
					className={`text-sm ${remainingGenerations === 0 ? "text-red-500 font-medium" : "text-gray-600"}`}
				>
					{remainingGenerations === 0
						? t("phrase.add.dailyLimitReached")
						: t("phrase.add.remainingCount", { count: remainingGenerations })}
				</div>
			</div>
			<p className="text-xs sm:text-sm text-gray-500 mb-6">
				{t("phrase.add.description")}
			</p>

			{/* SUBSCRIPTION_DISABLED: サブスクリプション状態の表示を一時的に無効化 */}
			{/* <div className="mb-4">
        {!hasActiveSubscription && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-gray-700 font-medium text-sm mb-2">
              {t('subscription.subscriptionRequired')}
            </p>
            <a
              href="/settings?tab=subscription"
              className="inline-block px-4 py-2 text-white text-sm rounded-md transition-colors"
              style={{ backgroundColor: '#616161' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#525252'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#616161'
              }}
            >
              {t('subscription.subscribeToBasicPlan')}
            </a>
          </div>
        )}
      </div> */}

			{/* Random Mode Toggle - ピル型セグメントボタン */}
			<div className="mb-4">
				<div className="flex items-center gap-2 mb-2">
					<IoFlash className="w-5 h-5 text-gray-600" />
					<h3 className="text-lg font-semibold text-gray-900">{t("phrase.add.generationMethod")}</h3>
				</div>
				<div className="relative inline-flex self-start rounded-full p-1 bg-gray-100">
					{/* スライディング背景 */}
					<div
						className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full shadow-sm transition-all duration-300 ease-out"
						style={{
							left: isRandomMode ? "calc(50% + 2px)" : "4px",
						}}
					/>
					<button
						onClick={() => !hasGeneratedResults && onToggleRandomMode(false)}
						disabled={hasGeneratedResults}
						className={`relative z-10 w-28 py-1.5 text-sm font-semibold rounded-full transition-colors duration-300 text-center ${
							!isRandomMode
								? "text-gray-900"
								: hasGeneratedResults
									? "text-gray-400 cursor-not-allowed"
									: "text-gray-500"
						}`}
					>
						{t("phrase.add.manualInput")}
					</button>
					<button
						onClick={() => !hasGeneratedResults && onToggleRandomMode(true)}
						disabled={hasGeneratedResults}
						className={`relative z-10 w-28 py-1.5 text-sm font-semibold rounded-full transition-colors duration-300 text-center ${
							isRandomMode
								? "text-gray-900"
								: hasGeneratedResults
									? "text-gray-400 cursor-not-allowed"
									: "text-gray-500"
						}`}
					>
						{t("phrase.add.autoGenerate")}
					</button>
				</div>
			</div>

			{/* Options section */}
			<div className={isRandomMode ? "mb-8" : "mb-4"}>
				<div className="flex flex-col gap-3">
					<div className="flex items-center gap-2">
						<IoLocationOutline className="w-5 h-5 text-gray-600" />
						<h3 className="text-lg font-semibold text-gray-900">{t("phrase.add.situationTitle")}</h3>
					</div>

					{/* シチュエーション表示エリア全体を囲む */}
					<div className="flex items-center gap-3">
						<button
							onClick={() => setIsAddContextModalOpen(true)}
							disabled={hasGeneratedResults}
							className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
								hasGeneratedResults
									? "text-gray-400 cursor-not-allowed"
									: "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
							}`}
						>
							<BsPlusSquare size={16} />
						</button>

						<ScrollableContainer className="flex gap-1.5 overflow-x-auto overflow-y-hidden min-w-0 flex-1 pl-1">
							{situations.map((situation: SituationResponse) => (
								<button
									key={situation.id}
									onClick={() => {
										if (!hasGeneratedResults && onContextChange) {
											onContextChange(
												selectedContext === situation.name
													? null
													: situation.name,
											);
										}
									}}
									disabled={hasGeneratedResults}
									className={`px-3 py-1.5 rounded-full text-sm font-medium border flex items-center gap-1.5 flex-shrink-0 transition-all duration-300 ease-out ${
										selectedContext === situation.name
											? "text-white border-transparent shadow-md scale-105 bg-[#616161]"
											: hasGeneratedResults
												? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
												: "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-sm active:scale-95"
									}`}
								>
									<span className="whitespace-nowrap">{situation.name}</span>
									<AiOutlineClose
										size={14}
										className={`flex-shrink-0 font-bold transition-colors duration-300 ${
											selectedContext === situation.name
												? "text-white"
												: "text-gray-700"
										}`}
										onClick={(e) => {
											e.stopPropagation();
											if (!hasGeneratedResults) {
												handleDeleteSituation(situation.id);
											}
										}}
									/>
								</button>
							))}
						</ScrollableContainer>
					</div>
				</div>
			</div>

			{/* フレーズ入力エリア（通常モードのみ表示） */}
			{!isRandomMode && (
				<div className="mb-6">
					<div className="flex items-center gap-2 mb-2">
						<IoChatbubbleOutline className="w-5 h-5 text-gray-600" />
						<h3 className="text-lg font-semibold text-gray-900">{t("phrase.add.desiredPhraseTitle")}</h3>
					</div>
					<textarea
						value={desiredPhrase}
						onChange={(e) => onPhraseChange(e.target.value)}
						onFocus={scrollPreservation.onFocus}
						onBlur={scrollPreservation.onBlur}
						placeholder={t("phrase.placeholders.phraseInput")}
						className={`w-full border rounded-xl px-3 py-3 text-sm resize-none focus:outline-none text-gray-900 placeholder-gray-400 transition-all duration-200 focus:ring-2 focus:ring-gray-400 ${
							phraseValidationError && desiredPhrase.trim().length > 0
								? "border-gray-400"
								: "border-gray-300"
						} ${generatedVariations.length > 0 ? "bg-gray-50 text-gray-500" : ""}`}
						rows={3}
						disabled={isSaving || generatedVariations.length > 0}
					/>

					{/* 100文字を超えた場合のバリデーションメッセージ */}
					{desiredPhrase.length > 100 && (
						<div className="mt-2 p-3 border border-gray-300 rounded-md bg-gray-50">
							<p className="text-sm text-gray-600">
								{t("phrase.validation.maxLength100", {
									count: desiredPhrase.length,
								})}
							</p>
						</div>
					)}
				</div>
			)}

			{/* AI Suggest / Random Generate ボタン */}
			{isRandomMode ? (
				<button
					disabled={!isRandomGenerateButtonEnabled() || isLoading}
					className={`w-full mt-4 py-3 sm:py-4 px-6 rounded-xl font-medium transition-all duration-300 border ${
						isLoading
							? "bg-[#8a8a8a] text-white border-transparent cursor-wait"
							: !isRandomGenerateButtonEnabled()
								? "bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200"
								: "bg-[#616161] text-white border-transparent hover:bg-[#525252] hover:shadow-lg active:scale-[0.98]"
					}`}
					onClick={onRandomGenerate}
				>
					{isLoading ? (
						<div className="flex items-center justify-center gap-3">
							<span>{t("phrase.add.generating")}</span>
							<span className="flex gap-1">
								<span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
								<span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
								<span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
							</span>
						</div>
					) : (
						t("phrase.add.generateButton")
					)}
				</button>
			) : (
				<button
					disabled={!isGenerateButtonEnabled() || isLoading}
					className={`w-full py-3 sm:py-4 px-6 rounded-xl font-medium transition-all duration-300 border ${
						isLoading
							? "bg-[#8a8a8a] text-white border-transparent cursor-wait"
							: !isGenerateButtonEnabled()
								? "bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200"
								: "bg-[#616161] text-white border-transparent hover:bg-[#525252] hover:shadow-lg active:scale-[0.98]"
					}`}
					onClick={onGeneratePhrase}
				>
					{isLoading ? (
						<div className="flex items-center justify-center gap-3">
							<span>{t("phrase.add.generating")}</span>
							<span className="flex gap-1">
								<span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
								<span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
								<span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
							</span>
						</div>
					) : (
						t("phrase.add.generateButton")
					)}
				</button>
			)}

			{/* エラー表示 */}
			{error && !isLoading && (
				<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
					<p className="text-sm text-red-600">{error}</p>
					{/* SUBSCRIPTION_DISABLED: Basicプラン関連のエラーメッセージを一時的に無効化 */}
					{/* {error.includes('Basicプラン') && (
            <div className="mt-2">
              <a
                href="/settings?tab=subscription"
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                {t('subscription.manageSubscription')}
              </a>
            </div>
          )} */}
				</div>
			)}

			{/* 生成結果（通常モード） */}
			{!isRandomMode && (
				<GeneratedVariations
					generatedVariations={generatedVariations}
					editingVariations={editingVariations}
					editingTranslations={editingTranslations}
					isSaving={isSaving}
					savingVariationIndex={savingVariationIndex}
					desiredPhrase={desiredPhrase}
					onEditVariation={onEditVariation}
					onEditTranslation={onEditTranslation}
					onSelectVariation={onSelectVariation}
					error={error}
				/>
			)}

			{/* 生成結果（ランダムモード） */}
			{isRandomMode && (
				<RandomGeneratedVariations
					randomGeneratedVariations={randomGeneratedVariations}
					isRandomSaving={isRandomSaving}
					error={error}
					onSave={onSaveRandomPhrase}
				/>
			)}

			{/* シチュエーション追加モーダル */}
			<AddContextModal
				isOpen={isAddContextModalOpen}
				onClose={() => setIsAddContextModalOpen(false)}
				onAdd={handleAddContext}
			/>

			{/* シチュエーション削除確認モーダル */}
			<BaseModal
				isOpen={!!deletingSituationId}
				onClose={handleCancelDelete}
				variant="gray"
				width="480px"
			>
				<div className="bg-white rounded-[20px] p-5 -m-5">
					{/* タイトル */}
					<div className="flex items-center mb-4">
						<IoLocationOutline className="w-6 h-6 text-gray-600 mr-2" />
						<h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t("situation.deleteModal.title")}</h2>
					</div>

					{/* 確認メッセージ */}
					<p className="text-sm text-gray-500 mb-7">
						{t("situation.delete.confirmMessage")}
						{t("situation.delete.warningMessage")}
					</p>

					{/* ボタン */}
					<div className="flex gap-3">
						<button
							onClick={handleCancelDelete}
							disabled={isDeleting}
							className="flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-sm sm:text-base font-medium transition-all duration-200 bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
						>
							{t("common.cancel")}
						</button>
						<button
							onClick={handleConfirmDelete}
							disabled={isDeleting}
							className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-sm sm:text-base font-medium transition-all duration-200 text-white active:scale-[0.98] disabled:cursor-not-allowed ${
								isDeleting
									? "bg-gray-400"
									: "bg-red-500 hover:bg-red-600"
							}`}
						>
							{isDeleting ? (
								<div className="flex items-center justify-center gap-2">
									<div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
									<span>{t("situation.deleteModal.deleting")}</span>
								</div>
							) : (
								t("situation.deleteModal.deleteButton")
							)}
						</button>
					</div>
				</div>
			</BaseModal>

			{/* フレーズ生成ヘルプモーダル */}
			<PhraseGenerationHelpModal
				isOpen={showHelpModal}
				onClose={() => setShowHelpModal(false)}
			/>
		</>
	);
}
