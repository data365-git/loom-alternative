import { getCurrentUser } from "@cap/database/auth/session";
import { redirect } from "next/navigation";
import { CallbackClient } from "./CallbackClient";

export const dynamic = "force-dynamic";

export default async function ExtensionCallbackPage(props: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const user = await getCurrentUser();
	const searchParams = await props.searchParams;

	const extensionId =
		typeof searchParams.extensionId === "string"
			? searchParams.extensionId
			: undefined;

	if (!user) {
		const next = extensionId
			? `/extension/callback?extensionId=${encodeURIComponent(extensionId)}`
			: "/extension/callback";
		redirect(`/login?next=${encodeURIComponent(next)}`);
	}

	return (
		<div className="flex justify-center items-center min-h-screen bg-gray-2">
			<CallbackClient extensionId={extensionId} />
		</div>
	);
}
