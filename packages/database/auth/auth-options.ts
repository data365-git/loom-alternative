import { serverEnv } from "@cap/env";
import { eq } from "drizzle-orm";
import type { NextAuthOptions } from "next-auth";
import { getServerSession as _getServerSession } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import type { Provider } from "next-auth/providers/index";
import WorkOSProvider from "next-auth/providers/workos";
import { db } from "../index.ts";
import { users } from "../schema.ts";
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
				CredentialsProvider({
					id: "email",
					name: "Email",
					credentials: {
						email: { label: "Email", type: "email" },
					},
					async authorize(credentials) {
						const raw = credentials?.email;
						if (!raw || typeof raw !== "string") return null;
						const email = raw.trim().toLowerCase();

						const [user] = await db()
							.select({
								id: users.id,
								email: users.email,
								name: users.name,
								image: users.image,
							})
							.from(users)
							.where(eq(users.email, email))
							.limit(1);

						if (!user) return null;
						return user;
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
			async signIn({ user, account }) {
				if (account?.provider === "workos") return true;

				const email = user?.email?.toLowerCase();
				if (!email) return false;

				const [existing] = await db()
					.select({ id: users.id })
					.from(users)
					.where(eq(users.email, email))
					.limit(1);

				return !!existing;
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
