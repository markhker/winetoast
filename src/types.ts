import type { ReactNode } from "react";

export type WinetoastState =
	| "success"
	| "loading"
	| "error"
	| "warning"
	| "info"
	| "action";

export interface WinetoastStyles {
	title?: string;
	description?: string;
	badge?: string;
	button?: string;
}

export interface WinetoastButton {
	title: string;
	onClick: () => void;
}

export const WINETOAST_POSITIONS = [
	"top-left",
	"top-center",
	"top-right",
	"bottom-left",
	"bottom-center",
	"bottom-right",
] as const;

export type WinetoastPosition = (typeof WINETOAST_POSITIONS)[number];

export interface WinetoastOptions {
	title?: string;
	description?: ReactNode | string;
	type?: WinetoastState;
	position?: WinetoastPosition;
	duration?: number | null;
	icon?: ReactNode | null;
	styles?: WinetoastStyles;
	fill?: string;
	roundness?: number;
	autopilot?: boolean | { expand?: number; collapse?: number };
	button?: WinetoastButton;
}
