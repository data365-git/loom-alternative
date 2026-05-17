import type { Metadata } from "next";
import { ImportPage } from "./ImportPage";

export const metadata: Metadata = {
	title: "Import — data365",
};

export default function Page() {
	return <ImportPage />;
}
