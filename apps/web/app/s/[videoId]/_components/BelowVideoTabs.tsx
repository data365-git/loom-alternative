"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type TabId = "summary" | "tasks" | "transcript" | "refined" | "cost";

const TABS: { id: TabId; label: string }[] = [
	{ id: "summary", label: "Summary" },
	{ id: "tasks", label: "Tasks" },
	{ id: "transcript", label: "Transcript" },
	{ id: "refined", label: "Refined" },
	{ id: "cost", label: "Cost" },
];

interface BelowVideoTabsProps {
	summary?: React.ReactNode;
	tasks?: React.ReactNode;
	transcript?: React.ReactNode;
	refined?: React.ReactNode;
	cost?: React.ReactNode;
}

export function BelowVideoTabs({
	summary,
	tasks,
	transcript,
	refined,
	cost,
}: BelowVideoTabsProps) {
	const searchParams = useSearchParams();
	const router = useRouter();

	const rawParam = searchParams.get("tab");
	const activeTab: TabId =
		rawParam === "tasks" ||
		rawParam === "transcript" ||
		rawParam === "refined" ||
		rawParam === "summary" ||
		rawParam === "cost"
			? rawParam
			: "summary";

	const handleTabChange = useCallback(
		(id: TabId) => {
			const params = new URLSearchParams(searchParams.toString());
			params.set("tab", id);
			router.push(`?${params.toString()}`, { scroll: false });
		},
		[router, searchParams],
	);

	const panels: Record<TabId, React.ReactNode> = {
		summary,
		tasks,
		transcript,
		refined,
		cost,
	};

	return (
		<div className="flex flex-col w-full">
			<div className="flex items-center gap-1 p-1 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200">
				{TABS.map((tab) => (
					<button
						key={tab.id}
						type="button"
						onClick={() => handleTabChange(tab.id)}
						className="relative flex-1 py-2 text-sm font-medium rounded-lg transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
					>
						{activeTab === tab.id && (
							<motion.span
								layoutId="bvt-pill"
								className="absolute inset-0 rounded-lg bg-white shadow-sm border border-gray-200"
								transition={{ ease: "easeOut", duration: 0.18 }}
							/>
						)}
						<span
							className={`relative z-10 ${
								activeTab === tab.id ? "text-gray-900" : "text-gray-500"
							}`}
						>
							{tab.label}
						</span>
					</button>
				))}
			</div>

			<AnimatePresence mode="wait" initial={false}>
				<motion.div
					key={activeTab}
					className="bv-panel mt-3"
					initial={{ opacity: 0, y: 6 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -4 }}
					transition={{ duration: 0.2, ease: "easeOut" }}
				>
					{panels[activeTab]}
				</motion.div>
			</AnimatePresence>
		</div>
	);
}
