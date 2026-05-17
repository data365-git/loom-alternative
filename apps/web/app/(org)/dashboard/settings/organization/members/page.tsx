import { db } from "@cap/database";
import { getCurrentUser } from "@cap/database/auth/session";
import { organizationMembers, users } from "@cap/database/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { InviteMemberForm } from "./InviteMemberForm";

export default async function MembersPage() {
	const me = await getCurrentUser();
	if (!me?.id || !me.activeOrganizationId) redirect("/login");

	const members = await db()
		.select({
			memberId: organizationMembers.id,
			userId: users.id,
			email: users.email,
			name: users.name,
			role: organizationMembers.role,
		})
		.from(organizationMembers)
		.innerJoin(users, eq(organizationMembers.userId, users.id))
		.where(eq(organizationMembers.organizationId, me.activeOrganizationId));

	return (
		<div className="p-6 space-y-6">
			<h1 className="text-2xl font-semibold">Team Members</h1>
			<InviteMemberForm />
			<ul className="divide-y border rounded">
				{members.map((m) => (
					<li key={m.memberId} className="p-3 flex justify-between">
						<div>
							<div className="font-medium">{m.name ?? m.email}</div>
							<div className="text-sm text-gray-500">{m.email}</div>
						</div>
						<span className="text-sm">{m.role}</span>
					</li>
				))}
			</ul>
		</div>
	);
}
