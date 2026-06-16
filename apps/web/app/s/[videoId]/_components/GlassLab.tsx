"use client";

import { useState } from "react";
import {
	APPLE_PRESET,
	DEFAULT_SETTINGS,
	type GlassSettings,
	HEAVY_PRESET,
	SUBTLE_PRESET,
} from "@/lib/liquid-glass/types";

interface GlassLabProps {
	currentSettings: GlassSettings;
	onSettingsChange: (settings: GlassSettings) => void;
	onClose: () => void;
}

interface SliderConfig {
	key: keyof GlassSettings;
	label: string;
	min: number;
	max: number;
	step: number;
}

const SLIDERS: SliderConfig[] = [
	{ key: "blurRadius", label: "Blur Radius", min: 1, max: 15, step: 0.1 },
	{ key: "tintOpacity", label: "Tint Opacity", min: 0, max: 1, step: 0.01 },
	{
		key: "edgeIntensity",
		label: "Edge Intensity",
		min: 0,
		max: 0.1,
		step: 0.001,
	},
	{
		key: "rimIntensity",
		label: "Rim Intensity",
		min: 0,
		max: 0.2,
		step: 0.001,
	},
	{
		key: "baseIntensity",
		label: "Base Intensity",
		min: 0,
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
	{ key: "cornerBoost", label: "Corner Boost", min: 0, max: 0.1, step: 0.001 },
	{ key: "rippleEffect", label: "Ripple Effect", min: 0, max: 0.5, step: 0.01 },
];

const PRESETS: Array<{ label: string; settings: GlassSettings }> = [
	{ label: "Apple", settings: APPLE_PRESET },
	{ label: "Subtle", settings: SUBTLE_PRESET },
	{ label: "Heavy", settings: HEAVY_PRESET },
];

export const GlassLab = ({
	currentSettings,
	onSettingsChange,
	onClose,
}: GlassLabProps) => {
	const [settings, setSettings] = useState<GlassSettings>(currentSettings);

	const update = (key: keyof GlassSettings, value: number) => {
		const next = { ...settings, [key]: value };
		setSettings(next);
		onSettingsChange(next);
	};

	const applyPreset = (preset: GlassSettings) => {
		setSettings(preset);
		onSettingsChange(preset);
	};

	const reset = () => {
		setSettings(DEFAULT_SETTINGS);
		onSettingsChange(DEFAULT_SETTINGS);
	};

	const copyJson = () => {
		navigator.clipboard.writeText(JSON.stringify(settings, null, 2));
	};

	return (
		<div
			style={{
				position: "fixed",
				top: "1rem",
				right: "1rem",
				zIndex: 9999,
				width: "300px",
				background: "rgba(10, 10, 15, 0.88)",
				backdropFilter: "blur(12px)",
				WebkitBackdropFilter: "blur(12px)",
				border: "1px solid rgba(255,255,255,0.12)",
				borderRadius: "12px",
				padding: "16px",
				color: "#f0f0f5",
				fontFamily: "system-ui, sans-serif",
				fontSize: "12px",
				overflowY: "auto",
				maxHeight: "90vh",
			}}
		>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: "12px",
				}}
			>
				<span style={{ fontWeight: 600, fontSize: "13px" }}>Glass Lab</span>
				<button
					type="button"
					onClick={onClose}
					style={{
						background: "none",
						border: "none",
						color: "#a0a0b0",
						cursor: "pointer",
						fontSize: "16px",
						lineHeight: 1,
						padding: "2px 6px",
					}}
					aria-label="Close Glass Lab"
				>
					✕
				</button>
			</div>

			<div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
				{PRESETS.map(({ label, settings: preset }) => (
					<button
						key={label}
						type="button"
						onClick={() => applyPreset(preset)}
						style={{
							flex: 1,
							padding: "5px 0",
							background: "rgba(255,255,255,0.08)",
							border: "1px solid rgba(255,255,255,0.15)",
							borderRadius: "6px",
							color: "#e0e0f0",
							cursor: "pointer",
							fontSize: "11px",
							fontWeight: 500,
						}}
					>
						{label}
					</button>
				))}
			</div>

			<div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
				{SLIDERS.map(({ key, label, min, max, step }) => (
					<div key={key}>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								marginBottom: "3px",
							}}
						>
							<span style={{ color: "#b0b0c8" }}>{label}</span>
							<span
								style={{ color: "#e0e0f0", fontVariantNumeric: "tabular-nums" }}
							>
								{settings[key].toFixed(step < 0.01 ? 3 : step < 0.1 ? 2 : 1)}
							</span>
						</div>
						<input
							type="range"
							min={min}
							max={max}
							step={step}
							value={settings[key]}
							onChange={(e) => update(key, parseFloat(e.target.value))}
							style={{ width: "100%", accentColor: "#818cf8" }}
						/>
					</div>
				))}
			</div>

			<div
				style={{
					display: "flex",
					gap: "6px",
					marginTop: "14px",
					marginBottom: "12px",
				}}
			>
				<button
					type="button"
					onClick={reset}
					style={{
						flex: 1,
						padding: "6px 0",
						background: "rgba(255,255,255,0.06)",
						border: "1px solid rgba(255,255,255,0.12)",
						borderRadius: "6px",
						color: "#c0c0d8",
						cursor: "pointer",
						fontSize: "11px",
					}}
				>
					Reset
				</button>
				<button
					type="button"
					onClick={copyJson}
					style={{
						flex: 1,
						padding: "6px 0",
						background: "rgba(129,140,248,0.18)",
						border: "1px solid rgba(129,140,248,0.35)",
						borderRadius: "6px",
						color: "#a5b4fc",
						cursor: "pointer",
						fontSize: "11px",
						fontWeight: 500,
					}}
				>
					Copy JSON
				</button>
			</div>

			<pre
				style={{
					background: "rgba(0,0,0,0.4)",
					border: "1px solid rgba(255,255,255,0.08)",
					borderRadius: "6px",
					padding: "8px",
					fontSize: "10px",
					color: "#8888aa",
					overflowX: "auto",
					margin: 0,
					lineHeight: 1.5,
				}}
			>
				{JSON.stringify(settings, null, 2)}
			</pre>
		</div>
	);
};
