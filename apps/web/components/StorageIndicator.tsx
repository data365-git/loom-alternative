"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { getStorageUsage } from "@/actions/organization/get-storage-usage";

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

export function StorageIndicator() {
	const { data } = useQuery({
		queryKey: ["storage-usage"],
		queryFn: () => getStorageUsage(),
		staleTime: 60_000,
	});

	if (!data) return <div className="h-10 animate-pulse bg-gray-3 rounded" />;

	const pct = Math.min(100, data.percentUsed);
	const barColor =
		pct >= 90 ? "bg-red-500" : pct > 75 ? "bg-amber-500" : "bg-blue-500";

	return (
		<Link
			href="/dashboard/settings/storage"
			className="block p-3 rounded-lg border border-gray-4 hover:border-gray-5 hover:bg-gray-3 transition-colors"
		>
			<div className="flex justify-between items-baseline mb-1.5">
				<span className="text-sm font-medium text-gray-12">Storage</span>
				<span className="text-xs text-gray-10">
					{fmtBytes(data.usedBytes)} / {fmtBytes(data.quotaBytes)}
				</span>
			</div>
			<div className="h-1.5 w-full rounded-full bg-gray-4 overflow-hidden">
				<div
					className={`h-full rounded-full transition-all ${barColor}`}
					style={{ width: `${pct}%` }}
				/>
			</div>
			<p className="mt-1.5 text-[11px] text-gray-9">
				{pct >= 99 ? "Quota full" : `${(100 - pct).toFixed(1)}% free`}
			</p>
		</Link>
	);
}
