"use server";

import { db } from "@cap/database";
import { getCurrentUser } from "@cap/database/auth/session";
import {
	folders,
	storageIntegrations,
	storageObjects,
	users,
	videos,
} from "@cap/database/schema";
import { and, desc, eq, sql } from "drizzle-orm";

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
			usedBytes: sql<number>`COALESCE(SUM(${storageObjects.contentLength}), 0)`,
		})
		.from(storageObjects)
		.innerJoin(
			storageIntegrations,
			eq(storageObjects.integrationId, storageIntegrations.id),
		)
		.where(
			and(
				eq(storageIntegrations.organizationId, orgId),
				eq(storageObjects.uploadStatus, "complete"),
			),
		);

	const usedBytes = Number(usedRow?.usedBytes ?? 0);

	const byVideo = await db()
		.select({
			videoId: videos.id,
			name: videos.name,
			folderId: videos.folderId,
			ownerId: videos.ownerId,
			bytes: sql<number>`COALESCE(SUM(${storageObjects.contentLength}), 0)`,
		})
		.from(storageObjects)
		.innerJoin(videos, eq(storageObjects.videoId, videos.id))
		.where(
			and(eq(videos.orgId, orgId), eq(storageObjects.uploadStatus, "complete")),
		)
		.groupBy(videos.id)
		.orderBy(desc(sql`bytes`))
		.limit(50);

	const byUser = await db()
		.select({
			userId: users.id,
			email: users.email,
			name: users.name,
			bytes: sql<number>`COALESCE(SUM(${storageObjects.contentLength}), 0)`,
		})
		.from(storageObjects)
		.innerJoin(videos, eq(storageObjects.videoId, videos.id))
		.innerJoin(users, eq(videos.ownerId, users.id))
		.where(
			and(eq(videos.orgId, orgId), eq(storageObjects.uploadStatus, "complete")),
		)
		.groupBy(users.id)
		.orderBy(desc(sql`bytes`));

	const byFolder = await db()
		.select({
			folderId: folders.id,
			folderName: folders.name,
			bytes: sql<number>`COALESCE(SUM(${storageObjects.contentLength}), 0)`,
		})
		.from(storageObjects)
		.innerJoin(videos, eq(storageObjects.videoId, videos.id))
		.innerJoin(folders, eq(videos.folderId, folders.id))
		.where(
			and(eq(videos.orgId, orgId), eq(storageObjects.uploadStatus, "complete")),
		)
		.groupBy(folders.id)
		.orderBy(desc(sql`bytes`));

	const folderedBytes = byFolder.reduce((acc, f) => acc + Number(f.bytes), 0);
	const unfolderedBytes = usedBytes - folderedBytes;

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
