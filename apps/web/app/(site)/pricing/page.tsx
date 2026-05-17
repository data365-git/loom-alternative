import { buildEnv } from "@cap/env";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PricingPage } from "@/components/pages/PricingPage";

export const metadata: Metadata = {
	title: "Pricing — Cap",
};

export default function App() {
	if (!buildEnv.NEXT_PUBLIC_IS_CAP) notFound();
	return <PricingPage />;
}
