export interface CompletedPart {
	ETag: string;
	PartNumber: number;
}

export interface ExtensionSettings {
	apiBaseUrl: string;
	apiKey: string;
	autoRecordOnMeet: boolean;
	autoRecordCountdownSec: number;
	micDeviceId: string;
	captureMode: "picker" | "silent-tab";
	soundEnabled: boolean;
	cameraOverlay: boolean;
}

interface IdleState {
	kind: "idle";
}

interface ArmingState {
	kind: "arming";
	mode: "instruction" | "meeting";
	meetingId?: string;
	tabId?: number;
}

interface RecordingState {
	kind: "recording";
	mode: "instruction" | "meeting";
	videoId: string;
	uploadId: string;
	startedAt: number;
	parts: CompletedPart[];
	nextPartNumber: number;
	totalBytes: number;
	meetingId?: string;
	tabId?: number;
	mime: string;
	paused: boolean;
}

interface UploadingState {
	kind: "uploading";
	videoId: string;
	uploadId: string;
	parts: CompletedPart[];
	totalBytes: number;
}

interface ErrorState {
	kind: "error";
	reason: string;
	recoverable: boolean;
	previousVideoId?: string;
}

export type ExtensionState =
	| IdleState
	| ArmingState
	| RecordingState
	| UploadingState
	| ErrorState;

const STATE_KEY = "capExtState";
const SETTINGS_KEY = "capExtSettings";

const DEFAULT_SETTINGS: ExtensionSettings = {
	apiBaseUrl: "https://cap-web-production-4817.up.railway.app",
	apiKey: "",
	autoRecordOnMeet: false,
	autoRecordCountdownSec: 5,
	micDeviceId: "",
	captureMode: "picker",
	soundEnabled: true,
	cameraOverlay: false,
};

export async function getState(): Promise<ExtensionState> {
	const result = await chrome.storage.local.get(STATE_KEY);
	return (result[STATE_KEY] as ExtensionState | undefined) ?? { kind: "idle" };
}

export async function setState(state: ExtensionState): Promise<void> {
	await chrome.storage.local.set({ [STATE_KEY]: state });
}

export async function getSettings(): Promise<ExtensionSettings> {
	const result = await chrome.storage.local.get(SETTINGS_KEY);
	const stored =
		(result[SETTINGS_KEY] as Partial<ExtensionSettings> | undefined) ?? {};
	return { ...DEFAULT_SETTINGS, ...stored };
}

export async function setSettings(
	settings: Partial<ExtensionSettings>,
): Promise<void> {
	const current = await getSettings();
	await chrome.storage.local.set({
		[SETTINGS_KEY]: { ...current, ...settings },
	});
}
