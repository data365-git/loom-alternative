import type { ExtensionSettings, ExtensionState } from "../background/state";

interface PopupData {
	state: ExtensionState;
	settings: ExtensionSettings;
	isMeetTab: boolean;
	meetingId: string | null;
	activeTabId: number | undefined;
}

let timerInterval: ReturnType<typeof setInterval> | null = null;

function stopTimer(): void {
	if (timerInterval !== null) {
		clearInterval(timerInterval);
		timerInterval = null;
	}
}

function el<K extends keyof HTMLElementTagNameMap>(
	tag: K,
	attrs: Partial<HTMLElementTagNameMap[K]> & { className?: string } = {},
	...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
	const node = document.createElement(tag);
	for (const [key, value] of Object.entries(attrs)) {
		if (key === "className") {
			node.className = value as string;
		} else {
			(node as unknown as Record<string, unknown>)[key] = value;
		}
	}
	for (const child of children) {
		if (typeof child === "string") {
			node.appendChild(document.createTextNode(child));
		} else {
			node.appendChild(child);
		}
	}
	return node;
}

function formatElapsed(ms: number): string {
	const totalSec = Math.floor(ms / 1000);
	const h = Math.floor(totalSec / 3600);
	const m = Math.floor((totalSec % 3600) / 60);
	const s = totalSec % 60;
	const hh = String(h).padStart(2, "0");
	const mm = String(m).padStart(2, "0");
	const ss = String(s).padStart(2, "0");
	return `${hh}:${mm}:${ss}`;
}

function sendMsg(msg: Record<string, unknown>): void {
	chrome.runtime.sendMessage(msg, () => {
		if (chrome.runtime.lastError) {
		}
	});
}

function renderNotSignedIn(
	root: HTMLElement,
	settings: ExtensionSettings,
): void {
	const logoWrap = el(
		"div",
		{ className: "logo-wrap" },
		el("img", {
			src: "icons/icon-128.png",
			width: 48,
			height: 48,
			alt: "Cap",
		} as unknown as Partial<HTMLImageElement>),
		el("h1", {}, "Cap Recorder"),
	);

	const signInBtn = el(
		"button",
		{ className: "btn btn-primary" },
		"Sign in to Cap",
	);
	signInBtn.addEventListener("click", () => {
		const url = `${settings.apiBaseUrl}/extension/callback?extensionId=${chrome.runtime.id}`;
		chrome.tabs.create({ url });
	});

	const orText = el("p", { className: "footnote" });
	const pasteLink = el("button", { className: "link-btn" }, "Or paste API key");
	pasteLink.addEventListener("click", () => {
		chrome.runtime.openOptionsPage();
	});
	orText.appendChild(pasteLink);

	root.appendChild(logoWrap);
	root.appendChild(signInBtn);
	root.appendChild(orText);
}

function renderIdleMeet(
	root: HTMLElement,
	meetingId: string,
	activeTabId: number | undefined,
	settings: ExtensionSettings,
): void {
	const logo = el("img", {
		src: "icons/icon-128.png",
		width: 32,
		height: 32,
		alt: "Cap",
	} as unknown as Partial<HTMLImageElement>);

	const recordMeetBtn = el(
		"button",
		{ className: "btn btn-primary" },
		"Record this Meeting",
	);
	recordMeetBtn.addEventListener("click", () => {
		const msg: Record<string, unknown> = { type: "START_MEET", meetingId };
		if (activeTabId !== undefined) msg.tabId = activeTabId;
		sendMsg(msg);
		window.close();
	});

	const recordInstructionBtn = el(
		"button",
		{ className: "btn btn-secondary" },
		"Record Instruction",
	);
	recordInstructionBtn.addEventListener("click", () => {
		sendMsg({ type: "START_INSTRUCTION" });
		window.close();
	});

	const autoLabel = settings.autoRecordOnMeet ? "On" : "Off";
	const statusLine = el(
		"p",
		{ className: "status-line" },
		`Auto-record on Meet: ${autoLabel} · `,
	);
	const settingsLink = el("button", { className: "link-btn" }, "Settings");
	settingsLink.addEventListener("click", () => {
		chrome.runtime.openOptionsPage();
	});
	statusLine.appendChild(settingsLink);

	root.appendChild(logo);
	root.appendChild(recordMeetBtn);
	root.appendChild(recordInstructionBtn);
	root.appendChild(statusLine);
}

function renderIdleNonMeet(root: HTMLElement): void {
	const logo = el("img", {
		src: "icons/icon-128.png",
		width: 32,
		height: 32,
		alt: "Cap",
	} as unknown as Partial<HTMLImageElement>);

	const recordBtn = el(
		"button",
		{ className: "btn btn-primary" },
		"Record Instruction",
	);
	recordBtn.addEventListener("click", () => {
		sendMsg({ type: "START_INSTRUCTION" });
		window.close();
	});

	const footnote = el(
		"p",
		{ className: "footnote" },
		"On Google Meet pages, you can also record meetings.",
	);

	root.appendChild(logo);
	root.appendChild(recordBtn);
	root.appendChild(footnote);
}

function renderRecording(
	root: HTMLElement,
	state: Extract<ExtensionState, { kind: "recording" }>,
): void {
	stopTimer();

	const header = el(
		"div",
		{ className: "recording-header" },
		el("span", { className: "rec-dot" }),
		el("span", { className: "rec-label" }, "Recording"),
	);

	const timerEl = el(
		"div",
		{ className: "timer" },
		formatElapsed(Date.now() - state.startedAt),
	);

	const modeEl = el(
		"p",
		{ className: "mode-label" },
		state.mode === "meeting" ? "Meeting" : "Instruction",
	);

	const pauseLabel = state.paused ? "Resume" : "Pause";
	const pauseBtn = el("button", { className: "btn btn-secondary" }, pauseLabel);
	pauseBtn.addEventListener("click", () => {
		sendMsg({ type: state.paused ? "RESUME" : "PAUSE" });
	});

	const stopBtn = el("button", { className: "btn btn-danger" }, "Stop");
	stopBtn.addEventListener("click", () => {
		sendMsg({ type: "STOP" });
	});

	const btnRow = el("div", { className: "btn-row" }, pauseBtn, stopBtn);

	root.appendChild(header);
	root.appendChild(timerEl);
	root.appendChild(modeEl);
	root.appendChild(btnRow);

	const startedAt = state.startedAt;
	timerInterval = setInterval(() => {
		timerEl.textContent = formatElapsed(Date.now() - startedAt);
	}, 1000);
}

function renderUploading(
	root: HTMLElement,
	state: Extract<ExtensionState, { kind: "uploading" }>,
): void {
	const wrap = el("div", { className: "uploading-wrap" });

	const title = el("p", { className: "uploading-title" }, "Uploading...");
	const spinner = el("div", { className: "spinner" });
	const partsEl = el(
		"p",
		{ className: "parts-count" },
		`${state.parts.length} parts uploaded`,
	);

	const cancelLink = el("button", { className: "link-btn" }, "Cancel upload");
	cancelLink.addEventListener("click", () => {
		sendMsg({ type: "CANCEL" });
	});

	wrap.appendChild(title);
	wrap.appendChild(spinner);
	wrap.appendChild(partsEl);
	wrap.appendChild(cancelLink);
	root.appendChild(wrap);
}

function renderError(
	root: HTMLElement,
	state: Extract<ExtensionState, { kind: "error" }>,
): void {
	const wrap = el("div", { className: "error-wrap" });

	const icon = el("div", { className: "error-icon" }, "⚠️");
	const msg = el("p", { className: "error-msg" }, state.reason);

	wrap.appendChild(icon);
	wrap.appendChild(msg);

	if (state.recoverable) {
		const retryBtn = el("button", { className: "btn btn-primary" }, "Retry");
		retryBtn.addEventListener("click", () => {
			sendMsg({ type: "RETRY" });
		});
		wrap.appendChild(retryBtn);
	}

	const dismissBtn = el(
		"button",
		{ className: "btn btn-secondary" },
		"Dismiss",
	);
	dismissBtn.addEventListener("click", () => {
		sendMsg({ type: "CANCEL" });
	});
	wrap.appendChild(dismissBtn);

	root.appendChild(wrap);
}

function renderArming(root: HTMLElement): void {
	const msg = el("p", { className: "footnote" }, "Starting recording...");
	root.appendChild(msg);
}

function render(data: PopupData): void {
	stopTimer();

	const root = document.getElementById("root");
	if (!root) return;

	root.innerHTML = "";

	const popup = el("div", { className: "popup" });

	const { state, settings, isMeetTab, meetingId, activeTabId } = data;
	const signedIn = settings.apiKey.length > 0;

	if (!signedIn) {
		renderNotSignedIn(popup, settings);
	} else if (state.kind === "recording") {
		renderRecording(popup, state);
	} else if (state.kind === "uploading") {
		renderUploading(popup, state);
	} else if (state.kind === "error") {
		renderError(popup, state);
	} else if (state.kind === "arming") {
		renderArming(popup);
	} else if (isMeetTab && meetingId !== null) {
		renderIdleMeet(popup, meetingId, activeTabId, settings);
	} else {
		renderIdleNonMeet(popup);
	}

	root.appendChild(popup);
}

function getMeetingId(url: string): string | null {
	try {
		const parsed = new URL(url);
		if (!parsed.hostname.endsWith("meet.google.com")) return null;
		const match = /^\/([a-z]+-[a-z]+-[a-z]+)$/i.exec(parsed.pathname);
		return match ? match[1] : null;
	} catch {
		return null;
	}
}

async function getSettingsFromSW(): Promise<ExtensionSettings> {
	return new Promise((resolve) => {
		chrome.runtime.sendMessage(
			{ type: "GET_ALL_SETTINGS" },
			(response: unknown) => {
				if (
					chrome.runtime.lastError ||
					!response ||
					typeof response !== "object"
				) {
					resolve({
						apiBaseUrl: "https://cap-web-production-4817.up.railway.app",
						apiKey: "",
						autoRecordOnMeet: false,
						autoRecordCountdownSec: 5,
						micDeviceId: "",
						captureMode: "picker",
						soundEnabled: true,
						cameraOverlay: false,
					});
					return;
				}
				resolve(response as ExtensionSettings);
			},
		);
	});
}

async function getStateFromSW(): Promise<ExtensionState> {
	return new Promise((resolve) => {
		chrome.runtime.sendMessage({ type: "GET_STATE" }, (response: unknown) => {
			if (
				chrome.runtime.lastError ||
				!response ||
				typeof response !== "object"
			) {
				resolve({ kind: "idle" });
				return;
			}
			resolve(response as ExtensionState);
		});
	});
}

function renderOnboarding(root: HTMLElement, onDone: () => void): void {
	const wrap = el("div", { className: "onboarding" });

	const logo = el("img", {
		src: "icons/icon-128.png",
		width: 48,
		height: 48,
		alt: "Cap",
	} as unknown as Partial<HTMLImageElement>);
	const heading = el("h1", {}, "Welcome to Cap");

	const list = el(
		"ul",
		{ className: "onboarding-list" },
		el("li", {}, "Cap records what you choose — screen, window, or tab"),
		el(
			"li",
			{},
			"We never start recording without showing a visible countdown",
		),
		el("li", {}, "Auto-record on Google Meet is off by default"),
	);

	const gotItBtn = el("button", { className: "btn btn-primary" }, "Got it");
	gotItBtn.addEventListener("click", () => {
		chrome.storage.local.set({ capExtFirstRun: false }, () => {
			onDone();
		});
	});

	wrap.appendChild(logo);
	wrap.appendChild(heading);
	wrap.appendChild(list);
	wrap.appendChild(gotItBtn);
	root.appendChild(wrap);
}

async function init(): Promise<void> {
	const [tabs, state, settings] = await Promise.all([
		chrome.tabs.query({ active: true, currentWindow: true }),
		getStateFromSW(),
		getSettingsFromSW(),
	]);

	const activeTab = tabs[0];
	const tabUrl = activeTab?.url ?? "";
	const meetingId = getMeetingId(tabUrl);
	const isMeetTab = meetingId !== null;

	let currentData: PopupData = {
		state,
		settings,
		isMeetTab,
		meetingId,
		activeTabId: activeTab?.id,
	};

	const root = document.getElementById("root");
	if (!root) return;

	const firstRunResult = await chrome.storage.local.get("capExtFirstRun");
	if (firstRunResult.capExtFirstRun !== false) {
		renderOnboarding(root, () => {
			while (root.firstChild) root.removeChild(root.firstChild);
			render(currentData);
		});
	} else {
		render(currentData);
	}

	chrome.runtime.onMessage.addListener((message: unknown) => {
		if (
			typeof message === "object" &&
			message !== null &&
			(message as Record<string, unknown>).type === "STATE_CHANGED"
		) {
			const newState = (message as Record<string, unknown>)
				.state as ExtensionState;
			currentData = { ...currentData, state: newState };
			render(currentData);
		}
	});
}

window.addEventListener("unload", () => {
	stopTimer();
});

init().catch(() => {});
