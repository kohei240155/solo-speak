import { BsFillMicFill } from "react-icons/bs";
import { LuSendHorizontal } from "react-icons/lu";
import { RiDeleteBin6Line } from "react-icons/ri";

export default function SpeechAdd() {
	return (
		<>
			{/* Add Speech見出しとLeft情報 */}
			<div className="flex justify-between items-center mb-2">
				<h2 className="text-xl md:text-2xl font-bold text-gray-900">
					Add Speech
				</h2>
				<div className="text-sm text-gray-600">Left: 1 / 1</div>
			</div>

			{/* Titleセクション */}
			<div className="mb-4">
				<h3 className="text-lg font-semibold text-gray-900 mb-2">Title</h3>
				<input
					type="text"
					placeholder="友達とアメフトを見に行った時の話"
					className="w-full border border-gray-300 rounded-md px-3 py-3 text-sm focus:outline-none text-gray-900 placeholder-gray-300"
				/>
			</div>

			{/* Speech Planセクション */}
			<div className="mb-6">
				<h3 className="text-lg font-semibold text-gray-900 mb-2">
					Speech Plan
				</h3>
				<div className="space-y-2">
					{[1, 2, 3, 4, 5].map((index) => (
						<div
							key={index}
							className="flex items-center gap-2 border border-gray-300 rounded-md px-3 py-3"
						>
							<input
								type="text"
								placeholder="友達とアメフトを見に行った時の話"
								className="flex-1 text-sm focus:outline-none text-gray-900 placeholder-gray-300"
							/>
							<button className="flex-shrink-0 text-gray-600 hover:text-gray-800">
								<RiDeleteBin6Line size={20} />
							</button>
						</div>
					))}
				</div>
			</div>

			{/* Addボタン */}
			<div className="flex justify-end mb-8">
				<button
					className="px-6 py-2 text-white rounded-md font-medium transition-colors"
					style={{ backgroundColor: "#616161" }}
					onMouseEnter={(e) => {
						e.currentTarget.style.backgroundColor = "#525252";
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.backgroundColor = "#616161";
					}}
				>
					Add
				</button>
			</div>

			{/* 録音エリア */}
			<div className="pt-2">
				{/* タイマー表示 */}
				<div className="text-center mb-6">
					<div className="text-2xl font-bold text-gray-900">0:30</div>
				</div>

				{/* コントロールボタン */}
				<div className="flex justify-center items-center gap-8">
					{/* 削除ボタン */}
					<button className="w-14 h-14 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors">
						<RiDeleteBin6Line size={24} />
					</button>

					{/* 録音ボタン（中央・大きめ） */}
					<button
						className="w-20 h-20 rounded-full flex items-center justify-center text-white transition-colors shadow-lg"
						style={{ backgroundColor: "#616161" }}
						onMouseEnter={(e) => {
							e.currentTarget.style.backgroundColor = "#525252";
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.backgroundColor = "#616161";
						}}
					>
						<BsFillMicFill size={32} />
					</button>

					{/* 送信ボタン */}
					<button className="w-14 h-14 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors">
						<LuSendHorizontal size={24} />
					</button>
				</div>
			</div>
		</>
	);
}
