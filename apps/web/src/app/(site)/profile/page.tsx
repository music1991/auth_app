"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { Loader2, User, Mail, Shield, Calendar } from "lucide-react";

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
      const res = await fetch("/api/profile", { 
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache"
        }
      });
      if (!res.ok) throw new Error("Failed to load profile");
      const data = await res.json();
      setUser(data.user);
      setProfile(data.profile);
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

  const handleAvatarUpdate = async () => {
    if (user?.id) {
      await loadAvatarBlob(user.id);
      setAvatarKey((k) => k + 1);
      setShowEditAvatar(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 blur-lg opacity-20 animate-pulse rounded-full" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-gray-900">Loading your profile</p>
          <p className="text-sm text-gray-500">Getting everything ready for you...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <User className="w-16 h-16 text-gray-400" />
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-gray-900">No profile found</p>
          <p className="text-sm text-gray-500">We couldn't load your profile data</p>
          <Button 
            onClick={loadProfile}
            variant="outline"
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <section className="space-y-8 mt-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between px-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your personal information and preferences
          </p>
        </div>
        {!isEditing && (
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => setIsEditing(true)}
            className="active:scale-95 transition-transform duration-150 shadow-sm"
          >
            Edit Profile
          </Button>
        )}
      </div>

      <Card className="overflow-hidden border shadow-sm">
        <CardContent className="py-8 px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="relative h-24 w-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 shadow-md border">
                  {avatarBlob ? (
                    <Image
                      key={avatarKey}
                      src={avatarBlob}
                      alt={displayName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full grid place-items-center text-2xl font-semibold bg-gradient-to-br from-blue-100 to-purple-100 text-blue-800">
                      {displayName[0]?.toUpperCase() ?? "U"}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="text-xl font-semibold text-gray-900">{displayName}</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="w-4 h-4" />
                    <span className="capitalize">{user.role}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {formatDate(user.created_at)}</span>
                  </div>
                </div>
              </div>
              
              <AvatarChangeButton 
                onAction={() => setShowEditAvatar(true)} 
              />
            </div>

            <div className="lg:col-span-2">
              <form
                key={formSeed}
                id="profile-form"
                onSubmit={saveProfile}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Username
                    </Label>
                    <Input
                      id="username"
                      name="username"
                      value={user.username ?? ""}
                      readOnly
                      className="bg-muted/40 text-muted-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </Label>
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
                      placeholder="Your first name"
                      disabled={!isEditing}
                      className={isEditing ? "border-blue-200 focus:border-blue-500" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      defaultValue={profile?.last_name ?? ""}
                      placeholder="Your last name"
                      disabled={!isEditing}
                      className={isEditing ? "border-blue-200 focus:border-blue-500" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      maxLength={11}
                      defaultValue={profile?.phone ?? ""}
                      placeholder="Your phone number"
                      disabled={!isEditing}
                      className={isEditing ? "border-blue-200 focus:border-blue-500" : ""}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <textarea
                    id="bio"
                    name="bio"
                    defaultValue={profile?.bio ?? ""}
                    placeholder="Tell us a little about yourself..."
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!isEditing}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Select
                      name="country"
                      defaultValue={profile?.country || undefined}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className={isEditing ? "border-blue-200 focus:border-blue-500" : ""}>
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
                      placeholder="Your city"
                      disabled={!isEditing}
                      className={isEditing ? "border-blue-200 focus:border-blue-500" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="street">Street</Label>
                    <Input
                      id="street"
                      name="street"
                      maxLength={50}
                      defaultValue={profile?.street ?? ""}
                      placeholder="Your street address"
                      disabled={!isEditing}
                      className={isEditing ? "border-blue-200 focus:border-blue-500" : ""}
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex items-center gap-3 pt-4 border-t">
                    <Button 
                      type="submit" 
                      disabled={saving}
                      className="gap-2"
                    >
                      {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                      {saving ? "Saving..." : "Save Changes"}
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