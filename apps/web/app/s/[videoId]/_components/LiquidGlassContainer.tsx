"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { GlassSettings } from "@/lib/liquid-glass/types";

export interface LiquidGlassHandle {
	applyGlassSettings: (settings: GlassSettings) => void;
}

interface LiquidGlassContainerProps {
	hostRef: React.RefObject<HTMLElement | null>;
	initialSettings?: Partial<GlassSettings>;
}

declare global {
	interface Window {
		Container: {
			new (options: {
				borderRadius?: number;
				type?: string;
				tintOpacity?: number;
			}): {
				element: HTMLElement;
				gl_refs: {
					gl: WebGLRenderingContext;
					blurRadiusLoc: WebGLUniformLocation;
					edgeIntensityLoc: WebGLUniformLocation;
					rimIntensityLoc: WebGLUniformLocation;
					baseIntensityLoc: WebGLUniformLocation;
					edgeDistanceLoc: WebGLUniformLocation;
					rimDistanceLoc: WebGLUniformLocation;
					baseDistanceLoc: WebGLUniformLocation;
					cornerBoostLoc: WebGLUniformLocation;
					rippleEffectLoc: WebGLUniformLocation;
					tintOpacityLoc: WebGLUniformLocation;
				};
				render?: () => void;
			};
			instances: Array<{
				gl_refs: {
					gl: WebGLRenderingContext;
					blurRadiusLoc: WebGLUniformLocation;
					edgeIntensityLoc: WebGLUniformLocation;
					rimIntensityLoc: WebGLUniformLocation;
					baseIntensityLoc: WebGLUniformLocation;
					edgeDistanceLoc: WebGLUniformLocation;
					rimDistanceLoc: WebGLUniformLocation;
					baseDistanceLoc: WebGLUniformLocation;
					cornerBoostLoc: WebGLUniformLocation;
					rippleEffectLoc: WebGLUniformLocation;
					tintOpacityLoc: WebGLUniformLocation;
				};
				render?: () => void;
			}>;
		};
	}
}

const APPLE_DEFAULTS: GlassSettings = {
	edgeIntensity: 0.018,
	rimIntensity: 0.08,
	baseIntensity: 0.012,
	edgeDistance: 0.15,
	rimDistance: 0.8,
	baseDistance: 0.1,
	cornerBoost: 0.03,
	rippleEffect: 0.12,
	blurRadius: 7.0,
	tintOpacity: 0.25,
};

const MOBILE_MAX_BLUR = 4;

function isMobile(): boolean {
	return typeof window !== "undefined" && window.innerWidth < 600;
}

function applySettingsToInstances(settings: GlassSettings): void {
	if (typeof window === "undefined" || !window.Container) return;

	const effectiveBlur = isMobile()
		? Math.min(settings.blurRadius, MOBILE_MAX_BLUR)
		: settings.blurRadius;

	for (const inst of window.Container.instances) {
		const gl = inst.gl_refs.gl;
		const r = inst.gl_refs;
		gl.uniform1f(r.blurRadiusLoc, effectiveBlur);
		gl.uniform1f(r.edgeIntensityLoc, settings.edgeIntensity);
		gl.uniform1f(r.rimIntensityLoc, settings.rimIntensity);
		gl.uniform1f(r.baseIntensityLoc, settings.baseIntensity);
		gl.uniform1f(r.edgeDistanceLoc, settings.edgeDistance);
		gl.uniform1f(r.rimDistanceLoc, settings.rimDistance);
		gl.uniform1f(r.baseDistanceLoc, settings.baseDistance);
		gl.uniform1f(r.cornerBoostLoc, settings.cornerBoost);
		gl.uniform1f(r.rippleEffectLoc, settings.rippleEffect);
		gl.uniform1f(r.tintOpacityLoc, settings.tintOpacity);
		if (inst.render) inst.render();
	}
}

export const LiquidGlassContainer = forwardRef<
	LiquidGlassHandle,
	LiquidGlassContainerProps
>(function LiquidGlassContainer({ hostRef, initialSettings }, ref) {
	const glassInstanceRef = useRef<InstanceType<Window["Container"]> | null>(
		null,
	);
	const scriptLoadedRef = useRef(false);

	useImperativeHandle(ref, () => ({
		applyGlassSettings(settings: GlassSettings) {
			applySettingsToInstances(settings);
		},
	}));

	useEffect(() => {
		if (scriptLoadedRef.current) return;

		const settings: GlassSettings = { ...APPLE_DEFAULTS, ...initialSettings };

		function initGlass() {
			const host = hostRef.current;
			if (!host || !window.Container) return;

			const glass = new window.Container({
				borderRadius: 26,
				type: "rounded",
				tintOpacity: settings.tintOpacity,
			});

			host.appendChild(glass.element);
			glassInstanceRef.current = glass;

			applySettingsToInstances(settings);
		}

		if (window.Container) {
			scriptLoadedRef.current = true;
			initGlass();
			return;
		}

		const cssIds = [
			{ id: "liquid-glass-styles", href: "/lib/liquid-glass/styles.css" },
			{ id: "liquid-glass-glass", href: "/lib/liquid-glass/glass.css" },
		];

		for (const { id, href } of cssIds) {
			if (!document.getElementById(id)) {
				const link = document.createElement("link");
				link.id = id;
				link.rel = "stylesheet";
				link.href = href;
				document.head.appendChild(link);
			}
		}

		const scriptId = "liquid-glass-container-js";
		if (!document.getElementById(scriptId)) {
			const script = document.createElement("script");
			script.id = scriptId;
			script.src = "/lib/liquid-glass/container.js";
			script.onload = () => {
				scriptLoadedRef.current = true;
				initGlass();
			};
			document.head.appendChild(script);
		}

		return () => {
			const inst = glassInstanceRef.current;
			if (!inst) return;

			const gl = inst.gl_refs?.gl;
			if (gl) {
				const ext = gl.getExtension("WEBGL_lose_context");
				if (ext) ext.loseContext();
			}

			if (inst.element?.parentNode) {
				inst.element.parentNode.removeChild(inst.element);
			}

			if (window.Container) {
				const idx = window.Container.instances.indexOf(
					inst as unknown as (typeof window.Container.instances)[number],
				);
				if (idx > -1) window.Container.instances.splice(idx, 1);
			}

			glassInstanceRef.current = null;
		};
	}, [hostRef, initialSettings]);

	return null;
});
