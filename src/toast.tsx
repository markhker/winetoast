import {
	type CSSProperties,
	type MouseEventHandler,
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	AUTO_COLLAPSE_DELAY,
	AUTO_EXPAND_DELAY,
	DEFAULT_TOAST_DURATION,
	EXIT_DURATION,
} from "./constants";
import { Winetoast } from "./winetoast";
import type { WinetoastOptions, WinetoastPosition, WinetoastState } from "./types";

const pillAlign = (pos: WinetoastPosition) =>
	pos.includes("right") ? "right" : pos.includes("center") ? "center" : "left";
const expandDir = (pos: WinetoastPosition) =>
	pos.startsWith("top") ? ("bottom" as const) : ("top" as const);

/* ---------------------------------- Types --------------------------------- */

interface InternalWinetoastOptions extends WinetoastOptions {
	id?: string;
	state?: WinetoastState;
}

interface WinetoastItem extends InternalWinetoastOptions {
	id: string;
	instanceId: string;
	exiting?: boolean;
	autoExpandDelayMs?: number;
	autoCollapseDelayMs?: number;
}

type WinetoastOffsetValue = number | string;
type WinetoastOffsetConfig = Partial<
	Record<"top" | "right" | "bottom" | "left", WinetoastOffsetValue>
>;

export interface WinetoastToasterProps {
	children?: ReactNode;
	position?: WinetoastPosition;
	offset?: WinetoastOffsetValue | WinetoastOffsetConfig;
	options?: Partial<WinetoastOptions>;
	theme?: "light" | "dark" | "system";
}

/* ------------------------------ Global State ------------------------------ */

type WinetoastListener = (toasts: WinetoastItem[]) => void;

const store = {
	toasts: [] as WinetoastItem[],
	listeners: new Set<WinetoastListener>(),
	position: "top-right" as WinetoastPosition,
	options: undefined as Partial<WinetoastOptions> | undefined,

	emit() {
		for (const fn of this.listeners) fn(this.toasts);
	},

	update(fn: (prev: WinetoastItem[]) => WinetoastItem[]) {
		this.toasts = fn(this.toasts);
		this.emit();
	},
};

let idCounter = 0;
const generateId = () =>
	`${++idCounter}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const timeoutKey = (t: WinetoastItem) => `${t.id}:${t.instanceId}`;

/* ------------------------------- Toast API -------------------------------- */

const dismissToast = (id: string, instanceId?: string) => {
	const item = store.toasts.find(
		(t) => t.id === id && (instanceId === undefined || t.instanceId === instanceId),
	);
	if (!item || item.exiting) return;
	const { instanceId: targetInstanceId } = item;

	store.update((prev) =>
		prev.map((t) =>
			t.id === id && t.instanceId === targetInstanceId
				? { ...t, exiting: true }
				: t,
		),
	);

	setTimeout(
		() =>
			store.update((prev) =>
				prev.filter(
					(t) => !(t.id === id && t.instanceId === targetInstanceId),
				),
			),
		EXIT_DURATION,
	);
};

const resolveAutopilot = (
	opts: InternalWinetoastOptions,
	duration: number | null,
): { expandDelayMs?: number; collapseDelayMs?: number } => {
	if (opts.autopilot === false || !duration || duration <= 0) return {};
	const cfg = typeof opts.autopilot === "object" ? opts.autopilot : undefined;
	const clamp = (v: number) => Math.min(duration, Math.max(0, v));
	return {
		expandDelayMs: clamp(cfg?.expand ?? AUTO_EXPAND_DELAY),
		collapseDelayMs: clamp(cfg?.collapse ?? AUTO_COLLAPSE_DELAY),
	};
};

const mergeOptions = (options: InternalWinetoastOptions) => ({
	...store.options,
	...options,
	styles: { ...store.options?.styles, ...options.styles },
});

const buildWinetoastItem = (
	merged: InternalWinetoastOptions,
	id: string,
	fallbackPosition?: WinetoastPosition,
): WinetoastItem => {
	const duration = merged.duration ?? DEFAULT_TOAST_DURATION;
	const auto = resolveAutopilot(merged, duration);
	return {
		...merged,
		id,
		instanceId: generateId(),
		position: merged.position ?? fallbackPosition ?? store.position,
		autoExpandDelayMs: auto.expandDelayMs,
		autoCollapseDelayMs: auto.collapseDelayMs,
	};
};

const createToast = (options: InternalWinetoastOptions) => {
	const live = store.toasts.filter((t) => !t.exiting);
	const merged = mergeOptions(options);

	const id = merged.id ?? generateId();
	const prev = live.find((t) => t.id === id);
	const item = buildWinetoastItem(merged, id, prev?.position);

	if (prev) {
		store.update((p) => p.map((t) => (t.id === id ? item : t)));
	} else {
		store.update((p) => [...p.filter((t) => t.id !== id), item]);
	}
	return { id, duration: merged.duration ?? DEFAULT_TOAST_DURATION };
};

const updateToast = (id: string, options: InternalWinetoastOptions) => {
	const existing = store.toasts.find((t) => t.id === id);
	if (!existing) return;

	const item = buildWinetoastItem(mergeOptions(options), id, existing.position);
	store.update((prev) => prev.map((t) => (t.id === id ? item : t)));
};

export interface WinetoastPromiseOptions<T = unknown> {
	loading: WinetoastOptions;
	success: WinetoastOptions | ((data: T) => WinetoastOptions);
	error: WinetoastOptions | ((err: unknown) => WinetoastOptions);
	action?: WinetoastOptions | ((data: T) => WinetoastOptions);
	position?: WinetoastPosition;
}

export const winetoast = {
	show: (opts: WinetoastOptions) => createToast({ ...opts, state: opts.type }).id,
	success: (opts: WinetoastOptions) =>
		createToast({ ...opts, state: "success" }).id,
	error: (opts: WinetoastOptions) => createToast({ ...opts, state: "error" }).id,
	warning: (opts: WinetoastOptions) =>
		createToast({ ...opts, state: "warning" }).id,
	info: (opts: WinetoastOptions) => createToast({ ...opts, state: "info" }).id,
	action: (opts: WinetoastOptions) => createToast({ ...opts, state: "action" }).id,

	promise: <T,>(
		promise: Promise<T> | (() => Promise<T>),
		opts: WinetoastPromiseOptions<T>,
	): Promise<T> => {
		const { id } = createToast({
			...opts.loading,
			state: "loading",
			duration: null,
			position: opts.position,
		});

		const p = typeof promise === "function" ? promise() : promise;

		p.then((data) => {
			if (opts.action) {
				const actionOpts =
					typeof opts.action === "function" ? opts.action(data) : opts.action;
				updateToast(id, { ...actionOpts, state: "action", id });
			} else {
				const successOpts =
					typeof opts.success === "function"
						? opts.success(data)
						: opts.success;
				updateToast(id, { ...successOpts, state: "success", id });
			}
		}).catch((err) => {
			const errorOpts =
				typeof opts.error === "function" ? opts.error(err) : opts.error;
			updateToast(id, { ...errorOpts, state: "error", id });
		});

		return p;
	},

	dismiss: dismissToast,

	clear: (position?: WinetoastPosition) =>
		store.update((prev) =>
			position ? prev.filter((t) => t.position !== position) : [],
		),
};

/* ------------------------------ Toaster Component ------------------------- */

const THEME_FILLS = {
	light: "#1a1a1a",
	dark: "#f2f2f2",
} as const;

function useResolvedTheme(
	theme: "light" | "dark" | "system" | undefined,
): "light" | "dark" {
	const [resolved, setResolved] = useState<"light" | "dark">(() => {
		if (theme === "light" || theme === "dark") return theme;
		if (typeof window === "undefined") return "light";
		return window.matchMedia("(prefers-color-scheme: dark)").matches
			? "dark"
			: "light";
	});

	useEffect(() => {
		if (theme === "light" || theme === "dark") {
			setResolved(theme);
			return;
		}
		const mq = window.matchMedia("(prefers-color-scheme: dark)");
		const handler = (e: MediaQueryListEvent) =>
			setResolved(e.matches ? "dark" : "light");
		setResolved(mq.matches ? "dark" : "light");
		mq.addEventListener("change", handler);
		return () => mq.removeEventListener("change", handler);
	}, [theme]);

	return resolved;
}

export function Toaster({
	children,
	position = "top-right",
	offset,
	options,
	theme,
}: WinetoastToasterProps) {
	const resolvedTheme = useResolvedTheme(theme);
	const [toasts, setToasts] = useState<WinetoastItem[]>(store.toasts);
	const [activeId, setActiveId] = useState<string>();

	const hoverRef = useRef(false);
	const timersRef = useRef(new Map<string, number>());
	const listRef = useRef(toasts);
	const latestRef = useRef<string | undefined>(undefined);
	const handlersCache = useRef(
		new Map<
			string,
			{
				enter: MouseEventHandler<HTMLButtonElement>;
				leave: MouseEventHandler<HTMLButtonElement>;
				dismiss: () => void;
			}
		>(),
	);

	useEffect(() => {
		store.position = position;
		store.options = options;
	}, [position, options]);

	const clearAllTimers = useCallback(() => {
		for (const t of timersRef.current.values()) clearTimeout(t);
		timersRef.current.clear();
	}, []);

	const schedule = useCallback((items: WinetoastItem[]) => {
		if (hoverRef.current) return;

		for (const item of items) {
			if (item.exiting) continue;
			const key = timeoutKey(item);
			if (timersRef.current.has(key)) continue;

			if (item.duration === null) continue;
			const dur = item.duration ?? DEFAULT_TOAST_DURATION;
			if (dur <= 0) continue;

			timersRef.current.set(
				key,
				window.setTimeout(() => dismissToast(item.id, item.instanceId), dur),
			);
		}
	}, []);

	useEffect(() => {
		const listener: WinetoastListener = (next) => setToasts(next);
		store.listeners.add(listener);
		return () => {
			store.listeners.delete(listener);
			clearAllTimers();
		};
	}, [clearAllTimers]);

	useEffect(() => {
		listRef.current = toasts;

		const toastKeys = new Set(toasts.map(timeoutKey));
		for (const [key, timer] of timersRef.current) {
			if (!toastKeys.has(key)) {
				clearTimeout(timer);
				timersRef.current.delete(key);
			}
		}
		for (const key of handlersCache.current.keys()) {
			if (!toastKeys.has(key)) handlersCache.current.delete(key);
		}

		schedule(toasts);
	}, [toasts, schedule]);

	const handleMouseEnterRef =
		useRef<MouseEventHandler<HTMLButtonElement>>(null);
	const handleMouseLeaveRef =
		useRef<MouseEventHandler<HTMLButtonElement>>(null);

	handleMouseEnterRef.current = useCallback<
		MouseEventHandler<HTMLButtonElement>
	>(() => {
		if (hoverRef.current) return;
		hoverRef.current = true;
		clearAllTimers();
	}, [clearAllTimers]);

	handleMouseLeaveRef.current = useCallback<
		MouseEventHandler<HTMLButtonElement>
	>(() => {
		if (!hoverRef.current) return;
		hoverRef.current = false;
		schedule(listRef.current);
	}, [schedule]);

	const latest = useMemo(() => {
		for (let i = toasts.length - 1; i >= 0; i--) {
			if (!toasts[i].exiting) return toasts[i].id;
		}
		return undefined;
	}, [toasts]);

	useEffect(() => {
		latestRef.current = latest;
		setActiveId(latest);
	}, [latest]);

	const getHandlers = useCallback((toastId: string, instanceId: string) => {
		const key = `${toastId}:${instanceId}`;
		let cached = handlersCache.current.get(key);
		if (cached) return cached;

		cached = {
			enter: ((e) => {
				setActiveId((prev) => (prev === toastId ? prev : toastId));
				handleMouseEnterRef.current?.(e);
			}) as MouseEventHandler<HTMLButtonElement>,
			leave: ((e) => {
				setActiveId((prev) =>
					prev === latestRef.current ? prev : latestRef.current,
				);
				handleMouseLeaveRef.current?.(e);
			}) as MouseEventHandler<HTMLButtonElement>,
			dismiss: () => dismissToast(toastId, instanceId),
		};

		handlersCache.current.set(key, cached);
		return cached;
	}, []);

	const getViewportStyle = useCallback(
		(pos: WinetoastPosition): CSSProperties | undefined => {
			if (offset === undefined) return undefined;

			const o =
				typeof offset === "object"
					? offset
					: { top: offset, right: offset, bottom: offset, left: offset };

			const s: CSSProperties = {};
			const px = (v: WinetoastOffsetValue) =>
				typeof v === "number" ? `${v}px` : v;

			if (pos.startsWith("top") && o.top) s.top = px(o.top);
			if (pos.startsWith("bottom") && o.bottom) s.bottom = px(o.bottom);
			if (pos.endsWith("left") && o.left) s.left = px(o.left);
			if (pos.endsWith("right") && o.right) s.right = px(o.right);

			return s;
		},
		[offset],
	);

	const activePositions = useMemo(() => {
		const map = new Map<WinetoastPosition, WinetoastItem[]>();
		for (const t of toasts) {
			const pos = t.position ?? position;
			const arr = map.get(pos);
			if (arr) {
				arr.push(t);
			} else {
				map.set(pos, [t]);
			}
		}
		return map;
	}, [toasts, position]);

	return (
		<>
			{children}
			{Array.from(activePositions, ([pos, items]) => {
				const pill = pillAlign(pos);
				const expand = expandDir(pos);

				return (
					<section
						key={pos}
						data-winetoast-viewport
						data-position={pos}
						data-theme={theme ? resolvedTheme : undefined}
						aria-live="polite"
						style={getViewportStyle(pos)}
					>
						{items.map((item) => {
							const h = getHandlers(item.id, item.instanceId);
							return (
								<Winetoast
									key={item.id}
									id={item.id}
									state={item.state}
									title={item.title}
									description={item.description}
									position={pill}
									expand={expand}
									icon={item.icon}
									fill={item.fill ?? (theme ? THEME_FILLS[resolvedTheme] : undefined)}
									styles={item.styles}
									button={item.button}
									roundness={item.roundness}
									exiting={item.exiting}
									autoExpandDelayMs={item.autoExpandDelayMs}
									autoCollapseDelayMs={item.autoCollapseDelayMs}
									refreshKey={item.instanceId}
									canExpand={activeId === undefined || activeId === item.id}
									onMouseEnter={h.enter}
									onMouseLeave={h.leave}
									onDismiss={h.dismiss}
								/>
							);
						})}
					</section>
				);
			})}
		</>
	);
}
