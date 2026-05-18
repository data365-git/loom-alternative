"use client";

import type { getStorageUsage } from "@/actions/organization/get-storage-usage";

function fmtBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	const units = ["KB", "MB", "GB", "TB"];
	let v = bytes / 1024;
	let i = 0;
	while (v >= 1024 && i < units.length - 1) {
		v /= 1024;
		i++;
	}
	return `${v.toFixed(v < 10 ? 1 : 0)} ${units[i]}`;
}

type Data = Awaited<ReturnType<typeof getStorageUsage>>;

export function StorageDetailsClient({ data }: { data: Data }) {
	const pct = data.percentUsed;
	const barColor =
		pct >= 90 ? "bg-red-500" : pct > 75 ? "bg-amber-500" : "bg-blue-500";

	return (
		<div className="p-6 max-w-5xl mx-auto space-y-8">
			<section>
				<h1 className="text-2xl font-semibold mb-2">Storage</h1>
				<p className="text-gray-10 mb-4">
					{fmtBytes(data.usedBytes)} used of {fmtBytes(data.quotaBytes)} (
					{pct.toFixed(1)}%)
				</p>
				<div className="h-3 w-full rounded-full bg-gray-4 overflow-hidden">
					<div
						className={`h-full rounded-full ${barColor}`}
						style={{ width: `${pct}%` }}
					/>
				</div>
			</section>

			<section>
				<h2 className="text-lg font-medium mb-3">By Folder</h2>
				<div className="space-y-2">
					{data.byFolder.map((f) => (
						<div
							key={f.folderId ?? "root"}
							className="flex justify-between items-center p-3 border rounded"
						>
							<span>{f.folderName}</span>
							<span className="text-sm text-gray-10">{fmtBytes(f.bytes)}</span>
						</div>
					))}
				</div>
			</section>

			<section>
				<h2 className="text-lg font-medium mb-3">By User</h2>
				<div className="space-y-2">
					{data.byUser.map((u) => (
						<div
							key={u.userId}
							className="flex justify-between items-center p-3 border rounded"
						>
							<div>
								<div>{u.name ?? u.email}</div>
								<div className="text-xs text-gray-9">{u.email}</div>
							</div>
							<span className="text-sm text-gray-10">{fmtBytes(u.bytes)}</span>
						</div>
					))}
				</div>
			</section>

			<section>
				<h2 className="text-lg font-medium mb-3">Top Videos by Size</h2>
				<div className="space-y-2">
					{data.byVideo.map((v) => (
						<div
							key={v.videoId}
							className="flex justify-between items-center p-3 border rounded"
						>
							<span className="truncate">{v.name}</span>
							<span className="text-sm text-gray-10 shrink-0 ml-3">
								{fmtBytes(v.bytes)}
							</span>
						</div>
					))}
					{data.byVideo.length === 0 && (
						<p className="text-sm text-gray-9">No videos yet.</p>
					)}
				</div>
			</section>
		</div>
	);
}
