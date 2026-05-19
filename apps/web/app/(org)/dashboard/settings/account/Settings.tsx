"use client";

import {
	Button,
	Card,
	CardDescription,
	CardTitle,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Select,
	Switch,
} from "@cap/ui";
import { type ImageUpload, Organisation } from "@cap/web-domain";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Effect, Option } from "effect";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { deleteAccount } from "@/actions/account/delete-account";
import { updatePreferences } from "@/actions/notifications/update-preferences";
import { SignedImageUrl } from "@/components/SignedImageUrl";
import { useEffectMutation, useRpcClient } from "@/lib/EffectRuntime";
import { useDashboardContext } from "../../Contexts";
import { ProfileImage } from "./components/ProfileImage";
import { patchAccountSettings } from "./server";

type NotificationPrefs = {
	pauseComments: boolean;
	pauseReplies: boolean;
	pauseViews: boolean;
	pauseReactions: boolean;
	pauseAnonViews?: boolean;
};

type NotificationPreferencesProps = {
	preferences: NotificationPrefs | null;
	className?: string;
};

const notificationToggles: Array<{
	label: string;
	key: keyof NotificationPrefs;
}> = [
	{ label: "Comments", key: "pauseComments" },
	{ label: "Replies", key: "pauseReplies" },
	{ label: "Reactions", key: "pauseReactions" },
	{ label: "Views", key: "pauseViews" },
];

const defaultNotificationPrefs: NotificationPrefs = {
	pauseComments: false,
	pauseReplies: false,
	pauseViews: false,
	pauseReactions: false,
	pauseAnonViews: false,
};

const NotificationPreferences = ({
	preferences,
	className,
}: NotificationPreferencesProps) => {
	const queryClient = useQueryClient();
	const current = preferences ?? defaultNotificationPrefs;

	const { mutate, isPending } = useMutation({
		mutationFn: (updated: NotificationPrefs) =>
			updatePreferences({ notifications: updated }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
		},
		onError: () => {
			toast.error("Failed to update notification preferences");
		},
	});

	const toggle = (key: keyof NotificationPrefs) => {
		mutate({ ...current, [key]: !current[key] });
	};

	return (
		<Card className={`flex flex-col gap-4 ${className ?? ""}`}>
			<div className="space-y-1">
				<CardTitle>Notification preferences</CardTitle>
				<CardDescription>
					Choose which activity triggers a notification for you.
				</CardDescription>
			</div>
			<div className="grid gap-3 sm:grid-cols-2">
				{notificationToggles.map(({ label, key }) => (
					<div key={key} className="flex justify-between items-center">
						<span className="text-[13px] text-gray-12">{label}</span>
						<Switch
							checked={!current[key]}
							onCheckedChange={() => toggle(key)}
							disabled={isPending}
						/>
					</div>
				))}
			</div>
		</Card>
	);
};

const DangerZone = ({ userEmail }: { userEmail: string }) => {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [confirmEmail, setConfirmEmail] = useState("");
	const inputId = useId();

	const {
		mutate: doDelete,
		isPending,
		error: deleteError,
	} = useMutation({
		mutationFn: deleteAccount,
		onSuccess: (result) => {
			if (!result.ok) {
				toast.error(result.error);
				return;
			}
			router.push("/");
		},
		onError: () => {
			toast.error("Failed to delete account. Please try again.");
		},
	});

	const handleOpenChange = (next: boolean) => {
		if (!isPending) {
			setOpen(next);
			if (!next) setConfirmEmail("");
		}
	};

	return (
		<>
			<div className="mt-10 border border-red-200 rounded-xl p-6 space-y-4">
				<div className="space-y-1">
					<h3 className="text-base font-semibold text-red-600">Danger Zone</h3>
					<p className="text-sm text-gray-11">
						Permanently delete your account and all associated data. This cannot
						be undone.
					</p>
				</div>
				<div className="flex items-center justify-between">
					<div className="space-y-0.5">
						<p className="text-sm font-medium text-gray-12">Delete Account</p>
						<p className="text-xs text-gray-10">
							Once deleted, your account cannot be recovered.
						</p>
					</div>
					<Button
						size="sm"
						variant="destructive"
						type="button"
						onClick={() => setOpen(true)}
					>
						Delete my account
					</Button>
				</div>
			</div>

			<Dialog open={open} onOpenChange={handleOpenChange}>
				<DialogContent>
					<DialogHeader
						description={`Type your email address (${userEmail}) to confirm deletion. This action is permanent and cannot be undone.`}
					>
						<DialogTitle>Delete Account</DialogTitle>
					</DialogHeader>
					<div className="p-5 space-y-3">
						<Input
							id={inputId}
							type="email"
							value={confirmEmail}
							onChange={(e) => setConfirmEmail(e.target.value)}
							placeholder={userEmail}
							autoComplete="off"
						/>
						{deleteError && (
							<p className="text-sm text-red-600">{deleteError.message}</p>
						)}
					</div>
					<DialogFooter>
						<Button
							size="sm"
							variant="gray"
							type="button"
							onClick={() => handleOpenChange(false)}
							disabled={isPending}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							variant="destructive"
							type="button"
							spinner={isPending}
							disabled={confirmEmail !== userEmail || isPending}
							onClick={() => doDelete()}
						>
							{isPending ? "Deleting..." : "Confirm delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
};

export const Settings = () => {
	const router = useRouter();
	const { organizationData, user, userPreferences } = useDashboardContext();
	const [firstName, setFirstName] = useState(user?.name || "");
	const [lastName, setLastName] = useState(user?.lastName || "");
	const [defaultOrgId, setDefaultOrgId] = useState<
		Organisation.OrganisationId | undefined
	>(user?.defaultOrgId || undefined);
	const firstNameId = useId();
	const lastNameId = useId();
	const contactEmailId = useId();
	const initialProfileImage = user?.imageUrl ?? null;
	const [profileImageOverride, setProfileImageOverride] = useState<
		ImageUpload.ImageUrl | null | undefined
	>(undefined);
	const profileImagePreviewUrl =
		profileImageOverride !== undefined
			? profileImageOverride
			: initialProfileImage;

	useEffect(() => {
		if (
			profileImageOverride !== undefined &&
			profileImageOverride === initialProfileImage
		) {
			setProfileImageOverride(undefined);
		}
	}, [initialProfileImage, profileImageOverride]);

	// Track if form has unsaved changes
	const hasChanges =
		firstName !== (user?.name || "") ||
		lastName !== (user?.lastName || "") ||
		defaultOrgId !== user?.defaultOrgId;

	const { mutate: updateName, isPending: updateNamePending } = useMutation({
		mutationFn: async () => {
			await patchAccountSettings(
				firstName.trim(),
				lastName.trim() ? lastName.trim() : undefined,
				defaultOrgId,
			);
		},
		onSuccess: () => {
			toast.success("Name updated successfully");
			router.refresh();
		},
		onError: () => {
			toast.error("Failed to update name");
		},
	});

	// Prevent navigation when there are unsaved changes
	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (hasChanges) {
				e.preventDefault();
				e.returnValue = "";
			}
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [hasChanges]);

	const rpc = useRpcClient();

	const uploadProfileImageMutation = useEffectMutation({
		mutationFn: Effect.fn(function* (file: File) {
			const arrayBuffer = yield* Effect.promise(() => file.arrayBuffer());
			yield* rpc.UserUpdate({
				id: user.id,
				image: Option.some({
					data: new Uint8Array(arrayBuffer),
					contentType: file.type,
					fileName: file.name,
				}),
			});
		}),
		onSuccess: () => {
			setProfileImageOverride(undefined);
			toast.success("Profile image updated successfully");
			router.refresh();
		},
		onError: (error) => {
			console.error("Error uploading profile image:", error);
			setProfileImageOverride(undefined);
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to upload profile image",
			);
		},
	});

	const removeProfileImageMutation = useEffectMutation({
		mutationFn: () => rpc.UserUpdate({ id: user.id, image: Option.none() }),
		onSuccess: () => {
			setProfileImageOverride(null);
			toast.success("Profile image removed");
			router.refresh();
		},
		onError: (error) => {
			console.error("Error removing profile image:", error);
			setProfileImageOverride(initialProfileImage);
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to remove profile image",
			);
		},
	});

	const isProfileImageMutating =
		uploadProfileImageMutation.isPending ||
		removeProfileImageMutation.isPending;

	const handleProfileImageChange = (file: File | null) => {
		if (!file || isProfileImageMutating) {
			return;
		}
		uploadProfileImageMutation.mutate(file);
	};

	const handleProfileImageRemove = () => {
		if (isProfileImageMutating) {
			return;
		}
		setProfileImageOverride(null);
		removeProfileImageMutation.mutate();
	};

	return (
		<>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					updateName();
				}}
			>
				<div className="grid gap-6 w-full md:grid-cols-2">
					<Card className="space-y-4">
						<div className="space-y-1">
							<CardTitle>Profile image</CardTitle>
							<CardDescription>
								This image appears in your profile, comments, and shared caps.
							</CardDescription>
						</div>
						<ProfileImage
							initialPreviewUrl={profileImagePreviewUrl}
							onChange={handleProfileImageChange}
							onRemove={handleProfileImageRemove}
							disabled={isProfileImageMutating}
							isUploading={uploadProfileImageMutation.isPending}
							isRemoving={removeProfileImageMutation.isPending}
							userName={user?.name}
						/>
					</Card>
					<Card className="space-y-4">
						<div className="space-y-1">
							<CardTitle>Your name</CardTitle>
							<CardDescription>
								Changing your name below will update how your name appears when
								sharing a Cap, and in your profile.
							</CardDescription>
						</div>
						<div className="flex flex-col flex-wrap gap-3 w-full">
							<div className="flex-1">
								<Input
									type="text"
									placeholder="First name"
									onChange={(e) => setFirstName(e.target.value)}
									defaultValue={firstName as string}
									id={firstNameId}
									name="firstName"
								/>
							</div>
							<div className="flex-1 space-y-2">
								<Input
									type="text"
									placeholder="Last name"
									onChange={(e) => setLastName(e.target.value)}
									defaultValue={lastName as string}
									id={lastNameId}
									name="lastName"
								/>
							</div>
						</div>
					</Card>
					<Card className="flex flex-col gap-4">
						<div className="space-y-1">
							<CardTitle>Contact email address</CardTitle>
							<CardDescription>
								This is the email address you used to sign up to Cap with.
							</CardDescription>
						</div>
						<Input
							type="email"
							value={user?.email as string}
							id={contactEmailId}
							name="contactEmail"
							disabled
						/>
					</Card>
					<Card className="flex flex-col gap-4">
						<div className="space-y-1">
							<CardTitle>Default organization</CardTitle>
							<CardDescription>
								This is the default organization
							</CardDescription>
						</div>

						<Select
							placeholder="Default organization"
							value={
								defaultOrgId ??
								user?.defaultOrgId ??
								organizationData?.[0]?.organization.id ??
								""
							}
							onValueChange={(value) =>
								setDefaultOrgId(Organisation.OrganisationId.make(value))
							}
							options={(organizationData || []).map((org) => ({
								value: org.organization.id,
								label: org.organization.name,
								image: (
									<SignedImageUrl
										className="size-5"
										image={org.organization.iconUrl}
										name={org.organization.name}
									/>
								),
							}))}
						/>
					</Card>
					<NotificationPreferences
						preferences={userPreferences?.notifications ?? null}
						className="md:col-span-2"
					/>
				</div>
				<Button
					disabled={!firstName || updateNamePending || !hasChanges}
					className="mt-6"
					type="submit"
					size="sm"
					variant="dark"
					spinner={updateNamePending}
				>
					{updateNamePending ? "Saving..." : "Save"}
				</Button>
			</form>
			<DangerZone userEmail={user?.email as string} />
		</>
	);
};
