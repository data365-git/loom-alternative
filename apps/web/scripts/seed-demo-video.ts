import { db } from "@cap/database";
import { nanoId } from "@cap/database/helpers";
import {
	organizationMembers,
	organizations,
	users,
	videos,
} from "@cap/database/schema";
import { type Organisation, type User, Video } from "@cap/web-domain";
import { and, eq, or, sql } from "drizzle-orm";

async function main() {
	const emailArgIndex = process.argv.indexOf("--user");
	if (emailArgIndex === -1 || !process.argv[emailArgIndex + 1]) {
		console.error("Usage: tsx scripts/seed-demo-video.ts --user <email>");
		process.exit(1);
	}

	const email = process.argv[emailArgIndex + 1] ?? "";

	const [user] = await db()
		.select()
		.from(users)
		.where(eq(users.email, email))
		.limit(1);

	if (!user) {
		console.error(`No user found with email: ${email}`);
		process.exit(1);
	}

	const userOrganizations = await db()
		.select({ id: organizations.id })
		.from(organizations)
		.leftJoin(
			organizationMembers,
			eq(organizations.id, organizationMembers.organizationId),
		)
		.where(
			or(
				eq(organizations.ownerId, user.id),
				eq(organizationMembers.userId, user.id),
			),
		)
		.groupBy(organizations.id)
		.orderBy(organizations.createdAt);

	const orgId = userOrganizations[0]?.id;
	if (!orgId) {
		console.error(`User ${email} has no organizations`);
		process.exit(1);
	}

	await db()
		.delete(videos)
		.where(
			and(
				eq(videos.ownerId, user.id as User.UserId),
				sql`JSON_EXTRACT(${videos.metadata}, '$.isDemo') = true`,
			),
		);

	const videoId = Video.VideoId.make(nanoId());

	await db()
		.insert(videos)
		.values({
			id: videoId,
			name: "Sample meeting — Q3 planning",
			ownerId: user.id as User.UserId,
			orgId: orgId as Organisation.OrganisationId,
			duration: 30,
			source: { type: "local" as const },
			metadata: {
				isDemo: true,
				aiTitle: "Sample meeting — Q3 planning",
				summary:
					"Q3 planning meeting covering product roadmap, engineering milestones (browser extension shipped), growth targets (50% increase in active recordings, mobile app launch), and action items for PM and design team.",
				aiGenerationStatus: "COMPLETE" as const,
			},
			transcriptionStatus: "COMPLETE",
			public: true,
			skipProcessing: true,
		});

	console.log(`Demo video seeded: ${videoId} for user ${email}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
