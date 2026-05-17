"use client";

import { Button, Input } from "@cap/ui";
import { useId, useState } from "react";
import { toast } from "sonner";
import { inviteMember } from "@/actions/organization/invite-member";

export function InviteMemberForm() {
	const [email, setEmail] = useState("");
	const [name, setName] = useState("");
	const [role, setRole] = useState<"admin" | "member">("member");
	const [loading, setLoading] = useState(false);
	const uid = useId();

	return (
		<form
			onSubmit={async (e) => {
				e.preventDefault();
				if (!email) return;
				setLoading(true);
				try {
					await inviteMember({ email, name, role });
					toast.success(`${email} added. They can sign in now.`);
					setEmail("");
					setName("");
				} catch (err) {
					toast.error((err as Error).message);
				} finally {
					setLoading(false);
				}
			}}
			className="flex gap-2 items-end"
		>
			<div className="flex-1">
				<label htmlFor={`${uid}-email`} className="text-sm">
					Email
				</label>
				<Input
					id={`${uid}-email`}
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					type="email"
					required
				/>
			</div>
			<div className="flex-1">
				<label htmlFor={`${uid}-name`} className="text-sm">
					Name (optional)
				</label>
				<Input
					id={`${uid}-name`}
					value={name}
					onChange={(e) => setName(e.target.value)}
				/>
			</div>
			<div>
				<label htmlFor={`${uid}-role`} className="text-sm">
					Role
				</label>
				<select
					id={`${uid}-role`}
					className="block border rounded px-2 py-1"
					value={role}
					onChange={(e) => setRole(e.target.value as "admin" | "member")}
				>
					<option value="member">Member</option>
					<option value="admin">Admin</option>
				</select>
			</div>
			<Button type="submit" disabled={loading} variant="dark">
				{loading ? "Adding..." : "Add member"}
			</Button>
		</form>
	);
}
