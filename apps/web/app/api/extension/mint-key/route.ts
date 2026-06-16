import { db } from "@cap/database";
import { getCurrentUser } from "@cap/database/auth/session";
import { authApiKeys } from "@cap/database/schema";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST() {
	const user = await getCurrentUser();
	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const [row] = await db()
		.select({ count: sql<number>`count(*)` })
		.from(authApiKeys)
		.where(eq(authApiKeys.userId, user.id));

	if (row && row.count >= 5) {
		return NextResponse.json(
			{ error: "Limit of 5 extension keys reached." },
			{ status: 429 },
		);
	}

	const id = crypto.randomUUID();
	await db().insert(authApiKeys).values({ id, userId: user.id });

	return NextResponse.json({ token: id, email: user.email });
}
