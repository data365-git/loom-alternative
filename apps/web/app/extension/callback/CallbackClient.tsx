"use client";

import { useEffect, useState } from "react";
import { mintExtensionToken } from "@/actions/extension/mint-token";

type Status =
	| { kind: "loading" }
	| { kind: "success"; email: string; fallbackToken?: string }
	| { kind: "error"; message: string };

export function CallbackClient({
	extensionId,
}: {
	extensionId: string | undefined;
}) {
	const [status, setStatus] = useState<Status>({ kind: "loading" });
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		let cancelled = false;

		async function run() {
			try {
				const { token, email } = await mintExtensionToken();

				if (cancelled) return;

				const chromeRuntime =
					typeof globalThis !== "undefined" &&
					typeof (globalThis as Record<string, unknown>).chrome === "object" &&
					(globalThis as Record<string, unknown>).chrome !== null
						? (
								(globalThis as Record<string, unknown>).chrome as Record<
									string,
									unknown
								>
							).runtime
						: undefined;

				if (
					chromeRuntime &&
					typeof (chromeRuntime as Record<string, unknown>).sendMessage ===
						"function" &&
					extensionId
				) {
					await new Promise<void>((resolve) => {
						(
							chromeRuntime as {
								sendMessage: (
									extensionId: string,
									message: Record<string, unknown>,
									callback: (response: unknown) => void,
								) => void;
								lastError?: { message: string };
							}
						).sendMessage(
							extensionId,
							{
								type: "CAP_EXTENSION_TOKEN",
								token,
								apiBaseUrl: window.location.origin,
							},
							(_response: unknown) => {
								resolve();
							},
						);
					});
					setStatus({ kind: "success", email });
					return;
				}

				setStatus({ kind: "success", email, fallbackToken: token });
			} catch (err) {
				if (cancelled) return;
				setStatus({
					kind: "error",
					message: err instanceof Error ? err.message : "Something went wrong",
				});
			}
		}

		run();
		return () => {
			cancelled = true;
		};
	}, [extensionId]);

	if (status.kind === "loading") {
		return (
			<div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center">
				<h1 className="text-xl font-semibold text-gray-12 mb-2">
					Signing in to Cap extension...
				</h1>
				<p className="text-gray-11 text-sm">Please wait</p>
			</div>
		);
	}

	if (status.kind === "error") {
		return (
			<div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center">
				<h1 className="text-xl font-semibold text-red-600 mb-2">
					Sign-in failed
				</h1>
				<p className="text-gray-11 text-sm mb-4">{status.message}</p>
				<button
					type="button"
					onClick={() => {
						setStatus({ kind: "loading" });
						mintExtensionToken()
							.then(({ token, email }) => {
								setStatus({ kind: "success", email, fallbackToken: token });
							})
							.catch((err) => {
								setStatus({
									kind: "error",
									message:
										err instanceof Error ? err.message : "Something went wrong",
								});
							});
					}}
					className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
				>
					Retry
				</button>
			</div>
		);
	}

	return (
		<div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center">
			<h1 className="text-xl font-semibold text-gray-12 mb-2">
				{status.fallbackToken ? "API key created" : "Signed in"}
			</h1>
			<p className="text-gray-11 text-sm mb-4">
				{status.fallbackToken
					? `Copy the key below and paste it into the Cap extension options page.`
					: `Cap extension signed in as ${status.email}. You can close this tab.`}
			</p>

			{status.fallbackToken && (
				<div className="mb-4">
					<code className="block bg-gray-3 rounded-lg px-4 py-3 text-sm font-mono text-gray-12 break-all select-all mb-2">
						{status.fallbackToken}
					</code>
					<button
						type="button"
						onClick={() => {
							const key = status.fallbackToken;
							if (!key) return;
							navigator.clipboard.writeText(key).then(() => {
								setCopied(true);
								setTimeout(() => setCopied(false), 2000);
							});
						}}
						className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
					>
						{copied ? "Copied!" : "Copy key"}
					</button>
				</div>
			)}

			<p className="text-gray-10 text-xs">
				This key has the same permissions as your account.{" "}
				<a
					href="/dashboard/settings"
					className="underline hover:text-gray-12 transition-colors"
				>
					Manage keys in Settings
				</a>
			</p>
		</div>
	);
}
