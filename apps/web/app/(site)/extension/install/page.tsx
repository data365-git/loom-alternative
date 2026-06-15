import { Button, Card, CardDescription, CardTitle } from "@cap/ui";
import {
	faComments,
	faDesktop,
	faMicrophone,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Install Cap Extension — Cap",
	description:
		"Install the Cap browser extension to record any tab, capture Google Meet calls, and share instantly.",
};

export default function ExtensionInstallPage() {
	return (
		<div className="min-h-screen bg-gradient-to-b from-gray-1 to-gray-2">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
				<div className="text-center mb-16">
					<h1 className="text-5xl sm:text-6xl font-bold text-gray-12 mb-4">
						Cap for Browsers
					</h1>
					<p className="text-xl text-gray-10 max-w-2xl mx-auto">
						Record any tab, capture every Meet — share instantly.
					</p>
				</div>

				<div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
					<Button
						disabled
						variant="primary"
						size="lg"
						className="min-w-[200px]"
					>
						Add to Chrome
					</Button>
					<Button
						disabled
						variant="outline"
						size="lg"
						className="min-w-[200px]"
					>
						Download ZIP
					</Button>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
					<Card className="flex flex-col h-full">
						<div className="flex-1">
							<div className="mb-4 text-gray-10">
								<FontAwesomeIcon icon={faMicrophone} className="w-8 h-8" />
							</div>
							<CardTitle className="mb-2">Record Instructions</CardTitle>
							<CardDescription>
								Loom-style screen recording with mic and optional camera
								overlay. Pick any screen, window, or tab.
							</CardDescription>
						</div>
					</Card>

					<Card className="flex flex-col h-full">
						<div className="flex-1">
							<div className="mb-4 text-gray-10">
								<FontAwesomeIcon icon={faDesktop} className="w-8 h-8" />
							</div>
							<CardTitle className="mb-2">Capture Meetings</CardTitle>
							<CardDescription>
								Auto-detect Google Meet calls. One click to record — or let Cap
								start automatically when you join.
							</CardDescription>
						</div>
					</Card>

					<Card className="flex flex-col h-full">
						<div className="flex-1">
							<div className="mb-4 text-gray-10">
								<FontAwesomeIcon icon={faComments} className="w-8 h-8" />
							</div>
							<CardTitle className="mb-2">Instant Sharing</CardTitle>
							<CardDescription>
								Recordings land in your Cap library instantly. Share a link, get
								comments, generate captions.
							</CardDescription>
						</div>
					</Card>
				</div>

				<div className="max-w-3xl mx-auto">
					<h2 className="text-3xl font-bold text-gray-12 mb-8 text-center">
						Getting Started
					</h2>

					<div className="space-y-6">
						<div className="flex gap-4">
							<div className="flex-shrink-0">
								<div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-lg">
									1
								</div>
							</div>
							<div className="flex-1">
								<h3 className="text-lg font-semibold text-gray-12 mb-1">
									Install the Extension
								</h3>
								<p className="text-gray-10">
									Download the Cap browser extension from the Chrome Web Store
									or manually using the ZIP file above.
								</p>
							</div>
						</div>

						<div className="flex gap-4">
							<div className="flex-shrink-0">
								<div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-lg">
									2
								</div>
							</div>
							<div className="flex-1">
								<h3 className="text-lg font-semibold text-gray-12 mb-1">
									Create an API Key
								</h3>
								<p className="text-gray-10">
									Go to{" "}
									<Link
										href="/dashboard/developers"
										className="text-blue-600 hover:underline font-medium"
									>
										dashboard/developers
									</Link>{" "}
									and create a new API key for the extension.
								</p>
							</div>
						</div>

						<div className="flex gap-4">
							<div className="flex-shrink-0">
								<div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-lg">
									3
								</div>
							</div>
							<div className="flex-1">
								<h3 className="text-lg font-semibold text-gray-12 mb-1">
									Paste the Key in Extension Settings
								</h3>
								<p className="text-gray-10">
									Open the extension settings, paste your API key, and
									authenticate with your Cap account.
								</p>
							</div>
						</div>

						<div className="flex gap-4">
							<div className="flex-shrink-0">
								<div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-lg">
									4
								</div>
							</div>
							<div className="flex-1">
								<h3 className="text-lg font-semibold text-gray-12 mb-1">
									Start Recording
								</h3>
								<p className="text-gray-10">
									Click the Cap icon in your browser toolbar, choose what to
									record, and start sharing instantly.
								</p>
							</div>
						</div>
					</div>
				</div>

				<div className="mt-20">
					<h2 className="text-3xl font-bold text-gray-12 mb-8 text-center">
						Privacy & Permissions
					</h2>

					<div className="space-y-10">
						<div>
							<h3 className="text-xl font-semibold text-gray-12 mb-4">
								Permissions the extension requests
							</h3>
							<div className="space-y-3">
								<div className="flex gap-3">
									<span className="font-semibold text-gray-12 whitespace-nowrap">
										Storage
									</span>
									<span className="text-gray-10">
										— saves your settings and recording state locally
									</span>
								</div>
								<div className="flex gap-3">
									<span className="font-semibold text-gray-12 whitespace-nowrap">
										Screen capture
									</span>
									<span className="text-gray-10">
										— records what you choose to share (you pick via
										Chrome&apos;s system dialog)
									</span>
								</div>
								<div className="flex gap-3">
									<span className="font-semibold text-gray-12 whitespace-nowrap">
										Microphone
									</span>
									<span className="text-gray-10">
										— captures your voice during recording (optional)
									</span>
								</div>
								<div className="flex gap-3">
									<span className="font-semibold text-gray-12 whitespace-nowrap">
										Notifications
									</span>
									<span className="text-gray-10">
										— alerts you about recording status and upload progress
									</span>
								</div>
								<div className="flex gap-3">
									<span className="font-semibold text-gray-12 whitespace-nowrap">
										Active tab
									</span>
									<span className="text-gray-10">
										— detects Google Meet calls for the meeting recording
										feature
									</span>
								</div>
							</div>
						</div>

						<div>
							<h3 className="text-xl font-semibold text-gray-12 mb-4">
								What data leaves your device
							</h3>
							<ul className="space-y-2 text-gray-10">
								<li>
									Recorded video/audio is uploaded to your Cap server
									(self-hosted or cap.so)
								</li>
								<li>No data is sent to third parties</li>
								<li>
									No browsing history, passwords, or other personal data is
									collected
								</li>
							</ul>
						</div>

						<div>
							<h3 className="text-xl font-semibold text-gray-12 mb-4">
								How to delete recordings
							</h3>
							<ul className="space-y-2 text-gray-10">
								<li>Delete any recording from your Cap dashboard</li>
								<li>
									Revoke the extension&apos;s API key from Settings &rarr; API
									Keys
								</li>
								<li>Uninstall the extension to remove all local data</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
