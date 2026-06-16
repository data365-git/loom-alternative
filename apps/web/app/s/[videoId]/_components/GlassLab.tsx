"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
	APPLE_PRESET,
	DEFAULT_SETTINGS,
	type GlassSettings,
	HEAVY_PRESET,
	SUBTLE_PRESET,
} from "@/lib/liquid-glass/types";
import "./glass-lab.css";

export type { GlassSettings };

interface GlassLabProps {
	onApply: (settings: GlassSettings) => void;
	initial?: Partial<GlassSettings>;
	onClose?: () => void;
}

interface SliderConfig {
	key: keyof GlassSettings;
	label: string;
	min: number;
	max: number;
	step: number;
}

const SLIDERS: SliderConfig[] = [
	{ key: "blurRadius", label: "Blur Radius", min: 1.0, max: 15.0, step: 0.1 },
	{ key: "tintOpacity", label: "Tint Opacity", min: 0.0, max: 1.0, step: 0.01 },
	{
		key: "edgeIntensity",
		label: "Edge Intensity",
		min: 0.0,
		max: 0.1,
		step: 0.001,
	},
	{
		key: "rimIntensity",
		label: "Rim Intensity",
		min: 0.0,
		max: 0.2,
		step: 0.001,
	},
	{
		key: "baseIntensity",
		label: "Base Intensity",
		min: 0.0,
		max: 0.05,
		step: 0.001,
	},
	{
		key: "edgeDistance",
		label: "Edge Distance",
		min: 0.05,
		max: 0.5,
		step: 0.01,
	},
	{ key: "rimDistance", label: "Rim Distance", min: 0.1, max: 2.0, step: 0.01 },
	{
		key: "baseDistance",
		label: "Base Distance",
		min: 0.05,
		max: 0.3,
		step: 0.01,
	},
	{
		key: "cornerBoost",
		label: "Corner Boost",
		min: 0.0,
		max: 0.1,
		step: 0.001,
	},
	{
		key: "rippleEffect",
		label: "Ripple Effect",
		min: 0.0,
		max: 0.5,
		step: 0.01,
	},
];

const PRESETS: Array<{ label: string; settings: GlassSettings }> = [
	{ label: "Apple", settings: APPLE_PRESET },
	{ label: "Subtle", settings: SUBTLE_PRESET },
	{ label: "Heavy", settings: HEAVY_PRESET },
];

const LS_KEY = "capGlassLabSettings";

function loadFromStorage(initial: Partial<GlassSettings>): GlassSettings {
	if (typeof window === "undefined") return { ...DEFAULT_SETTINGS, ...initial };
	try {
		const raw = window.localStorage.getItem(LS_KEY);
		if (raw) {
			const parsed = JSON.parse(raw) as GlassSettings;
			return parsed;
		}
	} catch {
		// ignore
	}
	return { ...DEFAULT_SETTINGS, ...initial };
}

function fmt(value: number, step: number): string {
	const decimals = step < 0.01 ? 3 : step < 0.1 ? 2 : 1;
	return value.toFixed(decimals);
}

export function GlassLab({ onApply, initial = {}, onClose }: GlassLabProps) {
	const [settings, setSettings] = useState<GlassSettings>(() =>
		loadFromStorage(initial),
	);
	const [showToast, setShowToast] = useState(false);
	const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const mountedRef = useRef(false);

	useEffect(() => {
		if (mountedRef.current) return;
		mountedRef.current = true;
		onApply(settings);
	}, [onApply, settings]);

	const applyAndPersist = useCallback(
		(next: GlassSettings) => {
			setSettings(next);
			onApply(next);
			try {
				window.localStorage.setItem(LS_KEY, JSON.stringify(next));
			} catch {
				// ignore
			}
		},
		[onApply],
	);

	const handleSlider = (key: keyof GlassSettings, value: number) => {
		applyAndPersist({ ...settings, [key]: value });
	};

	const handlePreset = (preset: GlassSettings) => {
		applyAndPersist(preset);
	};

	const handleReset = () => {
		applyAndPersist(DEFAULT_SETTINGS);
	};

	const handleCopyJson = () => {
		navigator.clipboard
			.writeText(JSON.stringify(settings, null, 2))
			.then(() => {
				setShowToast(true);
				if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
				toastTimerRef.current = setTimeout(() => setShowToast(false), 1600);
			})
			.catch(() => {
				// ignore
			});
	};

	return (
		<>
			<aside className="glass-lab" aria-label="Glass Lab controls">
				<div className="glass-lab-hd">
					<h2 className="glass-lab-title">Glass Controls</h2>
					{onClose && (
						<button
							type="button"
							className="glass-lab-close"
							onClick={onClose}
							aria-label="Close Glass Lab"
						>
							✕
						</button>
					)}
				</div>

				<div className="glass-lab-presets">
					{PRESETS.map(({ label, settings: preset }) => (
						<button
							key={label}
							type="button"
							className="glass-lab-preset"
							onClick={() => handlePreset(preset)}
						>
							{label}
						</button>
					))}
				</div>

				<div className="glass-lab-sliders">
					{SLIDERS.map(({ key, label, min, max, step }) => (
						<div key={key} className="glass-lab-ctrl">
							<div className="glass-lab-ctrl-row">
								<span className="glass-lab-label">{label}</span>
								<span className="glass-lab-value">
									{fmt(settings[key], step)}
								</span>
							</div>
							<input
								type="range"
								min={min}
								max={max}
								step={step}
								value={settings[key]}
								onChange={(e) => handleSlider(key, parseFloat(e.target.value))}
							/>
						</div>
					))}
				</div>

				<div className="glass-lab-actions">
					<button type="button" className="glass-lab-btn" onClick={handleReset}>
						Reset
					</button>
					<button
						type="button"
						className="glass-lab-btn glass-lab-btn-primary"
						onClick={handleCopyJson}
					>
						Copy JSON
					</button>
				</div>

				<pre className="glass-lab-json">
					{JSON.stringify(settings, null, 2)}
				</pre>
			</aside>

			<div
				className={`glass-lab-toast${showToast ? " show" : ""}`}
				aria-live="polite"
			>
				Copied to clipboard
			</div>
		</>
	);
}
