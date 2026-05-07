"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { Loader2, User, Mail, Shield, Calendar } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AvatarChangeButton } from "@/components/profile/AvatarChangeButton";
import EditAvatar from "@/components/profile/EditAvatar";

type ApiUser = {
  id: string;
  username: string | null;
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

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  user: "Usuario",
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("es-AR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

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
        setAvatarBlob(URL.createObjectURL(blob));
      } else {
        setAvatarBlob(null);
      }
    } catch {
      setAvatarBlob(null);
    }
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/profile", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!res.ok) throw new Error("Error al obtener el perfil");
      const data = await res.json();
      setUser(data.user);
      setProfile(data.profile);
    } catch {
      toast.error("Error al cargar el perfil.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    return () => {
      if (avatarBlob) URL.revokeObjectURL(avatarBlob);
    };
  }, [avatarBlob]);

  useEffect(() => {
    if (user?.id) loadAvatarBlob(user.id);
  }, [user?.id]);

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
      if (!res.ok) throw new Error(data?.error || "Error al actualizar");

      toast.success("Perfil actualizado correctamente.");
      setProfile(data.profile);
      setIsEditing(false);
      setFormSeed((k) => k + 1);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar el perfil.");
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
        <div className="text-center space-y-1">
          <p className="text-lg font-medium text-gray-900">Cargando tu perfil</p>
          <p className="text-sm text-gray-500">Preparando todo...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <User className="w-16 h-16 text-gray-400" />
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-gray-900">Perfil no encontrado</p>
          <p className="text-sm text-gray-500">No pudimos cargar tu perfil</p>
          <Button onClick={loadProfile} variant="outline" className="mt-4">
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  const displayName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    user.username ||
    "Sin nombre";

  return (
    <section className="space-y-6 mt-6 mb-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">Mi perfil</h1>
          <p className="text-sm text-muted-foreground">
            Administrá tu información personal y preferencias
          </p>
        </div>
        {!isEditing && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="active:scale-95 transition-transform duration-150 shadow-sm"
          >
            Editar perfil
          </Button>
        )}
      </div>

      <Card className="overflow-hidden border shadow-sm">
        <CardContent className="py-8 px-4 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Avatar + info */}
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 shadow-md border">
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
                <div className="space-y-1.5 min-w-0">
                  <div className="text-lg font-semibold text-gray-900 truncate">{displayName}</div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Shield className="w-3.5 h-3.5 shrink-0" />
                    <span>{ROLE_LABELS[user.role] ?? user.role}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>Desde {formatDate(user.created_at)}</span>
                  </div>
                </div>
              </div>

              <AvatarChangeButton onAction={() => setShowEditAvatar(true)} />
            </div>

            {/* Form */}
            <div className="lg:col-span-2">
              <form key={formSeed} id="profile-form" onSubmit={saveProfile} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="username" className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      Nombre de usuario
                    </Label>
                    <Input
                      id="username"
                      name="username"
                      value={user.username ?? ""}
                      readOnly
                      className="bg-muted/40 text-muted-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      Correo electrónico
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      value={user.email ?? ""}
                      readOnly
                      className="bg-muted/40 text-muted-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName">Nombre</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      defaultValue={profile?.first_name ?? ""}
                      placeholder="Tu nombre"
                      disabled={!isEditing}
                      className={isEditing ? "border-blue-200 focus:border-blue-500" : ""}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName">Apellido</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      defaultValue={profile?.last_name ?? ""}
                      placeholder="Tu apellido"
                      disabled={!isEditing}
                      className={isEditing ? "border-blue-200 focus:border-blue-500" : ""}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      name="phone"
                      maxLength={11}
                      defaultValue={profile?.phone ?? ""}
                      placeholder="Tu teléfono"
                      disabled={!isEditing}
                      className={isEditing ? "border-blue-200 focus:border-blue-500" : ""}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bio">Sobre mí</Label>
                  <textarea
                    id="bio"
                    name="bio"
                    defaultValue={profile?.bio ?? ""}
                    placeholder="Contanos un poco sobre vos..."
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!isEditing}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="country">País</Label>
                    <Input
                      id="country"
                      name="country"
                      defaultValue={profile?.country ?? ""}
                      placeholder="Tu país"
                      disabled={!isEditing}
                      className={isEditing ? "border-blue-200 focus:border-blue-500" : ""}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="city">Ciudad</Label>
                    <Input
                      id="city"
                      name="city"
                      defaultValue={profile?.city ?? ""}
                      placeholder="Tu ciudad"
                      disabled={!isEditing}
                      className={isEditing ? "border-blue-200 focus:border-blue-500" : ""}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="street">Calle</Label>
                    <Input
                      id="street"
                      name="street"
                      maxLength={50}
                      defaultValue={profile?.street ?? ""}
                      placeholder="Tu dirección"
                      disabled={!isEditing}
                      className={isEditing ? "border-blue-200 focus:border-blue-500" : ""}
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex items-center gap-3 pt-4 border-t">
                    <Button type="submit" disabled={saving} className="gap-2">
                      {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                      {saving ? "Guardando..." : "Guardar cambios"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={cancelEdit}
                      disabled={saving}
                    >
                      Cancelar
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
