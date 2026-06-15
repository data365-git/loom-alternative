"use client";

import { Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type AccentColor = "blue" | "purple" | "green" | "orange";
type SummaryLayout = "cards" | "timeline" | "document";
type TasksLayout = "board" | "checklist";

interface TweaksState {
	accentColor: AccentColor;
	animations: boolean;
	stickyVideo: boolean;
	summaryLayout: SummaryLayout;
	tasksLayout: TasksLayout;
}

const DEFAULTS: TweaksState = {
	accentColor: "blue",
	animations: true,
	stickyVideo: false,
	summaryLayout: "cards",
	tasksLayout: "board",
};

function readStorage(): TweaksState {
	if (typeof window === "undefined") return DEFAULTS;
	return {
		accentColor:
			(localStorage.getItem("shareTweak.accentColor") as AccentColor) ??
			DEFAULTS.accentColor,
		animations:
			(localStorage.getItem("shareTweak.animations") ??
				String(DEFAULTS.animations)) === "true",
		stickyVideo:
			(localStorage.getItem("shareTweak.stickyVideo") ??
				String(DEFAULTS.stickyVideo)) === "true",
		summaryLayout:
			(localStorage.getItem("shareTweak.summaryLayout") as SummaryLayout) ??
			DEFAULTS.summaryLayout,
		tasksLayout:
			(localStorage.getItem("shareTweak.tasksLayout") as TasksLayout) ??
			DEFAULTS.tasksLayout,
	};
}

function applyToDOM(state: TweaksState) {
	const root = document.documentElement;
	root.dataset.accent = state.accentColor;
	root.dataset.animations = String(state.animations);
	root.dataset.sticky = String(state.stickyVideo);
	root.dataset.summary = state.summaryLayout;
	root.dataset.tasks = state.tasksLayout;
}

const ACCENT_COLORS: { value: AccentColor; bg: string; ring: string }[] = [
	{ value: "blue", bg: "bg-blue-500", ring: "ring-blue-500" },
	{ value: "purple", bg: "bg-purple-500", ring: "ring-purple-500" },
	{ value: "green", bg: "bg-green-500", ring: "ring-green-500" },
	{ value: "orange", bg: "bg-orange-500", ring: "ring-orange-500" },
];

export function TweaksPanel() {
	const [open, setOpen] = useState(false);
	const [state, setState] = useState<TweaksState>(DEFAULTS);
	const panelRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		const stored = readStorage();
		setState(stored);
		applyToDOM(stored);
	}, []);

	useEffect(() => {
		if (!open) return;
		function onPointerDown(e: PointerEvent) {
			if (
				panelRef.current &&
				!panelRef.current.contains(e.target as Node) &&
				buttonRef.current &&
				!buttonRef.current.contains(e.target as Node)
			) {
				setOpen(false);
			}
		}
		document.addEventListener("pointerdown", onPointerDown);
		return () => document.removeEventListener("pointerdown", onPointerDown);
	}, [open]);

	function update<K extends keyof TweaksState>(key: K, value: TweaksState[K]) {
		const next = { ...state, [key]: value };
		setState(next);
		localStorage.setItem(`shareTweak.${key}`, String(value));
		applyToDOM(next);
	}

	return (
		<div className="fixed bottom-6 left-6 z-50">
			<button
				ref={buttonRef}
				type="button"
				onClick={() => setOpen((v) => !v)}
				aria-label="Open display tweaks"
				className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white/90 shadow-md backdrop-blur-sm transition-colors hover:bg-white hover:shadow-lg"
			>
				<Settings className="h-4 w-4 text-gray-600" />
			</button>

			<div
				ref={panelRef}
				className="absolute bottom-12 left-0 w-64 rounded-xl border border-gray-200 bg-white shadow-xl transition-all duration-200"
				style={{
					transformOrigin: "bottom left",
					opacity: open ? 1 : 0,
					transform: open
						? "scale(1) translateY(0)"
						: "scale(0.95) translateY(4px)",
					pointerEvents: open ? "auto" : "none",
				}}
			>
				<div className="p-4 space-y-5">
					<div>
						<p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
							Accent color
						</p>
						<div className="flex gap-2">
							{ACCENT_COLORS.map(({ value, bg, ring }) => (
								<button
									key={value}
									type="button"
									onClick={() => update("accentColor", value)}
									aria-label={value}
									className={`h-6 w-6 rounded-full ${bg} transition-all ${
										state.accentColor === value
											? `ring-2 ring-offset-2 ${ring}`
											: "opacity-60 hover:opacity-100"
									}`}
								/>
							))}
						</div>
					</div>

					<div className="flex items-center justify-between">
						<p className="text-sm text-gray-700">Animations</p>
						<button
							type="button"
							role="switch"
							aria-checked={state.animations}
							onClick={() => update("animations", !state.animations)}
							className={`relative h-5 w-9 rounded-full transition-colors ${
								state.animations ? "bg-gray-800" : "bg-gray-300"
							}`}
						>
							<span
								className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
								style={{
									transform: state.animations
										? "translateX(16px)"
										: "translateX(0)",
								}}
							/>
						</button>
					</div>

					<div className="flex items-center justify-between">
						<p className="text-sm text-gray-700">Sticky video</p>
						<button
							type="button"
							role="switch"
							aria-checked={state.stickyVideo}
							onClick={() => update("stickyVideo", !state.stickyVideo)}
							className={`relative h-5 w-9 rounded-full transition-colors ${
								state.stickyVideo ? "bg-gray-800" : "bg-gray-300"
							}`}
						>
							<span
								className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
								style={{
									transform: state.stickyVideo
										? "translateX(16px)"
										: "translateX(0)",
								}}
							/>
						</button>
					</div>

					<div>
						<p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
							Summary layout
						</p>
						<div className="flex gap-1">
							{(["cards", "timeline", "document"] as SummaryLayout[]).map(
								(v) => (
									<button
										key={v}
										type="button"
										onClick={() => update("summaryLayout", v)}
										className={`flex-1 rounded-md px-2 py-1 text-xs font-medium capitalize transition-colors ${
											state.summaryLayout === v
												? "bg-gray-800 text-white"
												: "bg-gray-100 text-gray-600 hover:bg-gray-200"
										}`}
									>
										{v}
									</button>
								),
							)}
						</div>
					</div>

					<div>
						<p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
							Tasks layout
						</p>
						<div className="flex gap-1">
							{(["board", "checklist"] as TasksLayout[]).map((v) => (
								<button
									key={v}
									type="button"
									onClick={() => update("tasksLayout", v)}
									className={`flex-1 rounded-md px-2 py-1 text-xs font-medium capitalize transition-colors ${
										state.tasksLayout === v
											? "bg-gray-800 text-white"
											: "bg-gray-100 text-gray-600 hover:bg-gray-200"
									}`}
								>
									{v}
								</button>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
