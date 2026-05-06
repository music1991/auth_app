import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import UsersTable from "@/components/shared/UsersTable";
import { Shield } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Users() {
  const session = await getSession();

  if (!session || session.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8 sm:px-8 lg:px-12">
      <div className="mb-8 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
            <Shield className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de usuarios</h1>
            <p className="text-sm text-gray-600">
              Administrá cuentas y permisos del sistema
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-sm font-medium text-green-700">
          <Shield className="w-4 h-4" />
          Acceso administrador · Permisos completos
        </span>
      </div>

      <UsersTable currentUserId={session.userId} />
    </div>
  );
}
