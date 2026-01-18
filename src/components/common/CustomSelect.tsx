"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { IoChevronDown } from "react-icons/io5";

export interface SelectOption {
	value: string;
	label: string;
	subLabel?: string;
}

interface CustomSelectProps {
	value: string;
	options: SelectOption[];
	onChange: (value: string) => void;
	placeholder?: string;
	size?: "sm" | "lg" | "header";
}

export default function CustomSelect({
	value,
	options,
	onChange,
	placeholder = "選択してください",
	size = "sm",
}: CustomSelectProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
	const buttonRef = useRef<HTMLButtonElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// サイズに応じたドロップダウン幅
	const dropdownWidth = size === "lg" ? 180 : 160;

	// ドロップダウンの位置を計算
	const updatePosition = useCallback(() => {
		if (buttonRef.current) {
			const rect = buttonRef.current.getBoundingClientRect();
			setDropdownStyle({
				position: "fixed",
				top: rect.bottom + 4,
				left: rect.right - dropdownWidth,
				width: dropdownWidth,
			});
		}
	}, [dropdownWidth]);

	useEffect(() => {
		if (isOpen) {
			updatePosition();
		}
	}, [isOpen, updatePosition]);

	// 外側クリックで閉じる
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Node;
			if (
				buttonRef.current &&
				!buttonRef.current.contains(target) &&
				dropdownRef.current &&
				!dropdownRef.current.contains(target)
			) {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen]);

	// スクロール・リサイズ時に閉じる
	useEffect(() => {
		const handleScrollOrResize = () => {
			if (isOpen) {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			window.addEventListener("scroll", handleScrollOrResize, true);
			window.addEventListener("resize", handleScrollOrResize);
		}

		return () => {
			window.removeEventListener("scroll", handleScrollOrResize, true);
			window.removeEventListener("resize", handleScrollOrResize);
		};
	}, [isOpen]);

	// 選択中のオプションを取得
	const selectedOption = options.find((opt) => opt.value === value);

	const handleSelect = (optionValue: string) => {
		onChange(optionValue);
		setIsOpen(false);
	};

	// サイズに応じたスタイル
	const buttonSizeStyles =
		size === "lg"
			? "px-4 py-1 text-base md:text-lg min-w-[140px] md:min-w-[160px]"
			: size === "header"
				? "px-3 h-[40px] text-sm min-w-[120px]"
				: "px-3 py-2 text-sm";

	const iconSizeStyles = size === "lg" ? "w-5 h-5" : "w-4 h-4";

	return (
		<div className="relative">
			{/* トリガーボタン */}
			<button
				ref={buttonRef}
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className={`flex items-center justify-between gap-2 border rounded-lg bg-white text-gray-900 transition-all duration-200 ${buttonSizeStyles} ${
					isOpen
						? "border-gray-400 ring-2 ring-gray-200"
						: "border-gray-200 hover:border-gray-300"
				}`}
			>
				<span className="whitespace-nowrap">
					{selectedOption?.label || placeholder}
				</span>
				<IoChevronDown
					className={`${iconSizeStyles} text-gray-500 transition-transform duration-200 ${
						isOpen ? "rotate-180" : ""
					}`}
				/>
			</button>

			{/* ドロップダウンメニュー（Portalでbody直下にレンダリング） */}
			{isOpen &&
				createPortal(
					<div
						ref={dropdownRef}
						className="bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-[9999]"
						style={dropdownStyle}
					>
						{options.map((option) => {
							const isSelected = option.value === value;
							return (
								<button
									key={option.value}
									type="button"
									onClick={() => handleSelect(option.value)}
									className={`w-full text-left px-3 py-2 transition-colors duration-150 relative ${
										isSelected ? "bg-gray-50" : "hover:bg-gray-50"
									}`}
								>
									{/* 選択状態のアクセントバー */}
									{isSelected && (
										<div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-gray-800 rounded-r-full" />
									)}

									<div
										className={`text-sm ${
											isSelected
												? "font-semibold text-gray-900"
												: "font-medium text-gray-700"
										}`}
									>
										{option.label}
									</div>
								</button>
							);
						})}
					</div>,
					document.body
				)}
		</div>
	);
}
