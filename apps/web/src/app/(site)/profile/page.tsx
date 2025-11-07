"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { AvatarChangeButton } from "@/components/AvatarChangeButton";
import EditAvatar from "@/components/EditAvatar";

type ApiUser = {
	id: string;
	username: string | null;
	last_name: string | null;
	email: string;
	role: "user" | "admin";
	verified: boolean;
	created_at: string;
};

type ApiProfile = {
	id: string;
	user_id: string;
	first_name: string | null;
	last_name: string | null;
	phone: string | null;
	bio: string | null;
	country: string | null;
	city: string | null;
	street: string | null;
	apartment: string | null;
	postal_code: string | null;
	avatar_url: string | null;
	created_at: string;
	updated_at: string;
} | null;

export default function ProfilePage() {
	const [showEditAvatar, setShowEditAvatar] = useState(false);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [formSeed, setFormSeed] = useState(0);
	const [user, setUser] = useState<ApiUser | null>(null);
	const [profile, setProfile] = useState<ApiProfile>(null);
	const [avatarBlob, setAvatarBlob] = useState<string | null>(null);
	const [avatarKey, setAvatarKey] = useState(0);

	// Función para cargar el avatar blob
	const loadAvatarBlob = async (userId: string) => {
		try {
			const res = await fetch(`/api/profile/avatar?u=${userId}`);
			if (res.ok) {
				const blob = await res.blob();
				const blobUrl = URL.createObjectURL(blob);
				setAvatarBlob(blobUrl);
			} else {
				setAvatarBlob(null);
			}
		} catch (error) {
			console.error("Error loading avatar blob:", error);
			setAvatarBlob(null);
		}
	};

	const loadProfile = async () => {
		try {
			setLoading(true);
			const res = await fetch("/api/profile", { cache: "no-store" });
			if (!res.ok) throw new Error("Failed to load profile");
			const data = await res.json();
			setUser(data.user);
			setProfile(data.profile);
			
			if (data.user?.id) {
				await loadAvatarBlob(data.user.id);
			}
		} catch (err: any) {
			console.error(err);
			toast.error("Failed to load profile data.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadProfile();
	}, []);

	// Cleanup del blob URL
	useEffect(() => {
		return () => {
			if (avatarBlob) {
				URL.revokeObjectURL(avatarBlob);
			}
		};
	}, [avatarBlob]);

	async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (!isEditing) return;
		try {
			setSaving(true);
			const formData = new FormData(e.currentTarget);
			const body = Object.fromEntries(formData.entries());

			const res = await fetch("/api/profile", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data?.error || "Update failed");

			toast.success("Profile updated successfully.");
			setProfile(data.profile);
			setIsEditing(false);
			setFormSeed((k) => k + 1);
		} catch (err: any) {
			toast.error(err.message || "Failed to update profile.");
		} finally {
			setSaving(false);
		}
	}

	function cancelEdit() {
		setIsEditing(false);
		setFormSeed((k) => k + 1);
	}

	// Función para manejar la actualización del avatar
	const handleAvatarUpdate = async () => {
		if (user?.id) {
			await loadAvatarBlob(user.id);
			setAvatarKey((k) => k + 1);
			setShowEditAvatar(false);
		}
	};

	if (loading) {
		return (
			<div className="rounded border p-6 text-sm text-muted-foreground">
				Loading profile…
			</div>
		);
	}

	if (!user) {
		return (
			<div className="rounded border p-6 text-sm text-muted-foreground">
				No profile data found.
			</div>
		);
	}

	const displayName =
		[profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
		user.username ||
		"Unnamed User";

	const countries = [
		"United States", "Canada", "United Kingdom", "Australia",
		"Argentina", "Brazil", "Chile", "Mexico", "Spain", "France",
		"Germany", "Italy", "Japan",
	];

	return (
		<section className="space-y-8 mt-8">
			{/* Header simple */}
			<div className="flex items-center justify-between px-6">
				<p className="text-muted-foreground">
					Manage your information and preferences.
				</p>
				{!isEditing && (
					<Button 
						variant="secondary" 
						size="sm" 
						onClick={() => setIsEditing(true)}
						className="active:scale-95 active:bg-secondary/70 transition-transform duration-150"
					>
						Edit Profile
					</Button>
				)}
			</div>

			{/* Card */}
			<Card className="overflow-hidden">
				<CardContent className="py-6 px-12">
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
						{/* Left */}
						<div className="space-y-6">
							<div className="flex items-center gap-4">
								<div className="relative h-20 w-20 rounded-full overflow-hidden bg-muted shadow-sm">
									{avatarBlob ? (
										<Image
											key={avatarKey}
											src={avatarBlob}
											alt={displayName}
											fill
											className="object-cover"
										/>
									) : (<div className="h-full w-full grid place-items-center text-xl font-semibold">
											{displayName[0]?.toUpperCase() ?? "U"}
										</div>
									)}
								</div>
								<div className="space-y-1">
									<div className="text-lg font-medium">{displayName}</div>
									<div className="text-sm text-muted-foreground">Role: {user.role}</div>
								</div>
							</div>
							<AvatarChangeButton 
								onAction={() => setShowEditAvatar(true)} 
							/>
						</div>

						{/* Right form */}
						<div className="lg:col-span-2">
							<form
								key={formSeed}
								id="profile-form"
								onSubmit={saveProfile}
								className="space-y-6"
							>
								{/* ... (el resto del formulario permanece igual) ... */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div className="space-y-2">
										<Label htmlFor="username">Username</Label>
										<Input
											id="username"
											name="username"
											value={user.username ?? ""}
											readOnly
											className="bg-muted/40 text-muted-foreground"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="email">Email</Label>
										<Input
											id="email"
											name="email"
											value={user.email ?? ""}
											readOnly
											className="bg-muted/40 text-muted-foreground"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="firstName">First name</Label>
										<Input
											id="firstName"
											name="firstName"
											defaultValue={profile?.first_name ?? ""}
											placeholder=""
											disabled={!isEditing}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="lastName">Last name</Label>
										<Input
											id="lastName"
											name="lastName"
											defaultValue={profile?.last_name ?? ""}
											placeholder=""
											disabled={!isEditing}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="phone">Phone</Label>
										<Input
											id="phone"
											name="phone"
											maxLength={11}
											defaultValue={profile?.phone ?? ""}
											placeholder=""
											disabled={!isEditing}
										/>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="bio">Bio</Label>
									<textarea
										id="bio"
										name="bio"
										defaultValue={profile?.bio ?? ""}
										placeholder="Tell us a little about you…"
										className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
										disabled={!isEditing}
									/>
								</div>

								{/* Address */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div className="space-y-2">
										<Label>Country</Label>
										<Select
											name="country"
											defaultValue={profile?.country || undefined}
											disabled={!isEditing}
										>
											<SelectTrigger aria-label="Country">
												<SelectValue placeholder="Select a country" />
											</SelectTrigger>
											<SelectContent>
												{countries.map((c) => (
													<SelectItem key={c} value={c}>
														{c}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2">
										<Label htmlFor="city">City</Label>
										<Input
											id="city"
											name="city"
											defaultValue={profile?.city ?? ""}
											placeholder="City"
											disabled={!isEditing}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="street">Street</Label>
										<Input
											id="street"
											name="street"
											maxLength={50}
											defaultValue={profile?.street ?? ""}
											placeholder=""
											disabled={!isEditing}
										/>
									</div>
								</div>

								{isEditing && (
									<div className="flex items-center gap-3">
										<Button type="submit" disabled={saving}>
											{saving ? "Saving..." : "Save"}
										</Button>
										<Button
											type="button"
											variant="outline"
											onClick={cancelEdit}
											disabled={saving}
										>
											Cancel
										</Button>
									</div>
								)}
							</form>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* EditAvatar con todos los modales internos */}
			<EditAvatar
				letterUser={displayName[0]?.toUpperCase()}
				open={showEditAvatar}
				onClose={() => setShowEditAvatar(false)}
				initialImage={avatarBlob}
				onFinish={handleAvatarUpdate}
			/>
		</section>
	);
}