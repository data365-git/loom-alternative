"use server";

import { db } from "@cap/database";
import { getCurrentUser } from "@cap/database/auth/session";
import { folders, users, videos, videoUploads } from "@cap/database/schema";
import { eq, sql } from "drizzle-orm";

const DEFAULT_QUOTA = 50 * 1024 * 1024 * 1024;

export async function getStorageUsage() {
	const me = await getCurrentUser();
	if (!me?.id || !me.activeOrganizationId) throw new Error("Unauthorized");

	const orgId = me.activeOrganizationId;
	const quotaBytes = Number(
		process.env.STORAGE_QUOTA_BYTES_PER_ORG ?? DEFAULT_QUOTA,
	);

	const [usedRow] = await db()
		.select({
			usedBytes: sql<number>`COALESCE(SUM(${videoUploads.total}), 0)`,
		})
		.from(videoUploads)
		.innerJoin(videos, eq(videos.id, videoUploads.videoId))
		.where(eq(videos.orgId, orgId));

	const usedBytes = Number(usedRow?.usedBytes ?? 0);

	const byVideo = await db()
		.select({
			videoId: videos.id,
			name: videos.name,
			folderId: videos.folderId,
			ownerId: videos.ownerId,
			bytes: sql<number>`COALESCE(SUM(${videoUploads.total}), 0)`.as("bytes"),
		})
		.from(videoUploads)
		.innerJoin(videos, eq(videos.id, videoUploads.videoId))
		.where(eq(videos.orgId, orgId))
		.groupBy(videos.id)
		.orderBy(sql`bytes desc`)
		.limit(50);

	const byUser = await db()
		.select({
			userId: users.id,
			email: users.email,
			name: users.name,
			bytes: sql<number>`COALESCE(SUM(${videoUploads.total}), 0)`.as("bytes"),
		})
		.from(videoUploads)
		.innerJoin(videos, eq(videos.id, videoUploads.videoId))
		.innerJoin(users, eq(videos.ownerId, users.id))
		.where(eq(videos.orgId, orgId))
		.groupBy(users.id)
		.orderBy(sql`bytes desc`);

	const byFolder = await db()
		.select({
			folderId: folders.id,
			folderName: folders.name,
			bytes: sql<number>`COALESCE(SUM(${videoUploads.total}), 0)`.as("bytes"),
		})
		.from(videoUploads)
		.innerJoin(videos, eq(videos.id, videoUploads.videoId))
		.innerJoin(folders, eq(folders.id, videos.folderId))
		.where(eq(videos.orgId, orgId))
		.groupBy(folders.id)
		.orderBy(sql`bytes desc`);

	const folderedBytes = byFolder.reduce((acc, f) => acc + Number(f.bytes), 0);
	const unfolderedBytes = Math.max(0, usedBytes - folderedBytes);

	return {
		usedBytes,
		quotaBytes,
		percentUsed: Math.min(100, (usedBytes / quotaBytes) * 100),
		byVideo: byVideo.map((v) => ({ ...v, bytes: Number(v.bytes) })),
		byUser: byUser.map((u) => ({ ...u, bytes: Number(u.bytes) })),
		byFolder: [
			...byFolder.map((f) => ({ ...f, bytes: Number(f.bytes) })),
			{
				folderId: null,
				folderName: "(Root — no folder)",
				bytes: unfolderedBytes,
			},
		],
	};
}
