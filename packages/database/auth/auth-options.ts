import crypto from "node:crypto";
import { serverEnv } from "@cap/env";
import { and, eq, gt, isNull, or } from "drizzle-orm";
import type { NextAuthOptions } from "next-auth";
import { getServerSession as _getServerSession } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import type { Provider } from "next-auth/providers/index";
import WorkOSProvider from "next-auth/providers/workos";
import { sendEmail } from "../emails/config.ts";
import { nanoId } from "../helpers.ts";
import { db } from "../index.ts";
import {
	organizationInvites,
	organizationMembers,
	users,
} from "../schema.ts";
import { isEmailAllowedForSignup } from "./domain-utils.ts";
import { DrizzleAdapter } from "./drizzle-adapter.ts";

export const maxDuration = 120;

export const authOptions = (): NextAuthOptions => {
	let _adapter: Adapter | undefined;
	let _providers: Provider[] | undefined;

	return {
		get adapter() {
			if (_adapter) return _adapter;
			_adapter = DrizzleAdapter(db());
			return _adapter;
		},
		debug: true,
		session: {
			strategy: "jwt",
		},
		get secret() {
			return serverEnv().NEXTAUTH_SECRET;
		},
		pages: {
			signIn: "/login",
		},
		get providers() {
			if (_providers) return _providers;
			_providers = [
				GoogleProvider({
					clientId: serverEnv().GOOGLE_CLIENT_ID!,
					clientSecret: serverEnv().GOOGLE_CLIENT_SECRET!,
					authorization: {
						params: {
							scope: [
								"https://www.googleapis.com/auth/userinfo.email",
								"https://www.googleapis.com/auth/userinfo.profile",
							].join(" "),
							prompt: "select_account",
						},
					},
				}),
				WorkOSProvider({
					clientId: serverEnv().WORKOS_CLIENT_ID as string,
					clientSecret: serverEnv().WORKOS_API_KEY as string,
					profile(profile) {
						return {
							id: profile.id,
							name: profile.first_name
								? `${profile.first_name} ${profile.last_name || ""}`
								: profile.email?.split("@")[0] || profile.id,
							email: profile.email,
							image: profile.profile_picture_url,
						};
					},
				}),
				EmailProvider({
					async generateVerificationToken() {
						return crypto.randomInt(100000, 1000000).toString();
					},
					async sendVerificationRequest({ identifier, token }) {
						console.log("sendVerificationRequest");

						if (!serverEnv().RESEND_API_KEY) {
							console.log("\n");
							console.log(
								"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
							);
							console.log("🔐 VERIFICATION CODE (Development Mode)");
							console.log(
								"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
							);
							console.log(`📧 Email: ${identifier}`);
							console.log(`🔢 Code: ${token}`);
							console.log(`⏱  Expires in: 10 minutes`);
							console.log(
								"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
							);
							console.log("\n");
						} else {
							console.log({ identifier, token });
							const { OTPEmail } = await import("../emails/otp-email");
							const email = OTPEmail({ code: token, email: identifier });
							console.log({ email });
							await sendEmail({
								email: identifier,
								subject: `Your Cap Verification Code`,
								react: email,
							});
						}
					},
				}),
			];

			return _providers;
		},
		cookies: {
			sessionToken: {
				name: `next-auth.session-token`,
				options: {
					httpOnly: true,
					sameSite: "none",
					path: "/",
					secure: true,
				},
			},
		},
		callbacks: {
			async signIn({ user, email, credentials }) {
				const allowedDomains = serverEnv().CAP_ALLOWED_SIGNUP_DOMAINS;
				if (!allowedDomains) return true;

				const rawEmail =
					user?.email ||
					(typeof email === "string"
						? email
						: typeof credentials?.email === "string"
							? credentials.email
							: null);
				if (!rawEmail || typeof rawEmail !== "string") return true;
				const userEmail = rawEmail.toLowerCase();

				const [existingUser] = await db()
					.select()
					.from(users)
					.where(eq(users.email, userEmail))
					.limit(1);

				// Only apply domain restrictions for new users, existing ones can always sign in
				if (
					!existingUser &&
					!isEmailAllowedForSignup(userEmail, allowedDomains)
				) {
					console.warn(`Signup blocked for email domain: ${userEmail}`);
					return false;
				}

				return true;
			},
			async session({ token, session }) {
				if (!session.user) return session;

				if (token?.id && typeof token.id === "string") {
					(session.user as { id: string }).id = token.id;
					session.user.name = token.name ?? null;
					session.user.email = token.email ?? null;
					session.user.image = token.picture ?? null;
				}

				return session;
			},
			async jwt({ token, user }) {
				if (user || !token.id) {
					const [dbUser] = await db()
						.select({
							id: users.id,
							name: users.name,
							lastName: users.lastName,
							email: users.email,
							image: users.image,
						})
						.from(users)
						.where(eq(users.email, (token.email || "").toLowerCase()))
						.limit(1);

					if (!dbUser) {
						if (user) {
							token.id = user?.id;
						}
						return token;
					}

					// data365 patch: auto-accept any pending invites for this user's email
					// on every signin. Lets admins invite people without needing to share
					// the /invite/[id] URL — invitee just signs in and lands in the org.
					try {
						const email = (dbUser.email || "").toLowerCase();
						if (email) {
							const pending = await db()
								.select({
									id: organizationInvites.id,
									organizationId: organizationInvites.organizationId,
									role: organizationInvites.role,
									expiresAt: organizationInvites.expiresAt,
								})
								.from(organizationInvites)
								.where(
									and(
										eq(organizationInvites.invitedEmail, email),
										or(
											isNull(organizationInvites.expiresAt),
											gt(organizationInvites.expiresAt, new Date()),
										),
									),
								);
							for (const invite of pending) {
								const [already] = await db()
									.select({ id: organizationMembers.id })
									.from(organizationMembers)
									.where(
										and(
											eq(organizationMembers.userId, dbUser.id),
											eq(
												organizationMembers.organizationId,
												invite.organizationId,
											),
										),
									)
									.limit(1);
								if (!already) {
									await db()
										.insert(organizationMembers)
										.values({
											id: nanoId(),
											userId: dbUser.id,
											organizationId: invite.organizationId,
											role: invite.role ?? "member",
										});
								}
								await db()
									.delete(organizationInvites)
									.where(eq(organizationInvites.id, invite.id));
							}
						}
					} catch (e) {
						console.error("auto-accept invites failed", e);
					}

					return {
						id: dbUser.id,
						name: dbUser.name,
						lastName: dbUser.lastName,
						email: dbUser.email,
						picture: dbUser.image,
					};
				}

				return token;
			},
		},
	};
};

export const getServerSession = () => _getServerSession(authOptions());
