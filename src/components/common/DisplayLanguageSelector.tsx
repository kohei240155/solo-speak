"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { IoChevronDown } from "react-icons/io5";
import { useLanguage } from "@/contexts/LanguageContext";
import CustomSelect, { type SelectOption } from "./CustomSelect";

interface DisplayLanguageSelectorProps {
	className?: string;
}

const LANGUAGE_NAMES: Record<string, string> = {
	ja: "Japanese",
	en: "English",
	ko: "Korean",
	zh: "Chinese",
	fr: "French",
	es: "Spanish",
	pt: "Portuguese",
	de: "German",
	th: "Thai",
};

// 省略表示名（モバイル用）
const SHORT_NAMES: Record<string, string> = {
	ja: "JA",
	en: "EN",
	ko: "KO",
	zh: "ZH",
	fr: "FR",
	es: "ES",
	pt: "PT",
	de: "DE",
	th: "TH",
};

export const DisplayLanguageSelector: React.FC<
	DisplayLanguageSelectorProps
> = ({ className = "" }) => {
	const { locale, setLocale, availableLocales } = useLanguage();

	// 省略表示かどうか
	const isCompact = className.includes("text-xs");

	// CustomSelect用のオプションを生成（ドロップダウンは常にフル表示）
	const options = availableLocales.map((lang) => ({
		value: lang,
		label: LANGUAGE_NAMES[lang] || lang,
	}));

	if (isCompact) {
		// モバイル用：省略表示だがドロップダウンはCustomSelect
		return (
			<CustomSelectCompact
				value={locale}
				options={options}
				onChange={setLocale}
				shortNames={SHORT_NAMES}
			/>
		);
	}

	return (
		<CustomSelect
			value={locale}
			options={options}
			onChange={setLocale}
			size="header"
		/>
	);
};

// モバイル用のコンパクト版CustomSelect

interface CustomSelectCompactProps {
	value: string;
	options: SelectOption[];
	onChange: (value: string) => void;
	shortNames: Record<string, string>;
}

function CustomSelectCompact({
	value,
	options,
	onChange,
	shortNames,
}: CustomSelectCompactProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
	const buttonRef = useRef<HTMLButtonElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const dropdownWidth = 160;

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
	}, []);

	useEffect(() => {
		if (isOpen) {
			updatePosition();
		}
	}, [isOpen, updatePosition]);

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

	const handleSelect = (optionValue: string) => {
		onChange(optionValue);
		setIsOpen(false);
	};

	return (
		<div className="relative">
			<button
				ref={buttonRef}
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className={`flex items-center justify-between gap-1 px-2 h-[40px] text-xs border rounded-lg bg-white text-gray-900 transition-all duration-200 min-w-[50px] ${
					isOpen
						? "border-gray-400 ring-2 ring-gray-200"
						: "border-gray-200 hover:border-gray-300"
				}`}
			>
				<span className="whitespace-nowrap font-medium">
					{shortNames[value] || value.toUpperCase()}
				</span>
				<IoChevronDown
					className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${
						isOpen ? "rotate-180" : ""
					}`}
				/>
			</button>

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
