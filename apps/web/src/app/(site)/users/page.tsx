import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import UsersTable from "@/components/UsersTable";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Users() {
  const session = await getSession();

  if (!session || session.role !== "admin") {
    redirect("/");
  }

  return (
    <section className="space-y-6 animate-in fade-in duration-500">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">
              Manage all registered accounts and permissions
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-200">
          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-sm font-medium text-purple-700">
            Admin Access • Full permissions
          </span>
        </div>
      </div>

      <UsersTable currentUserId={session.sub} />
    </section>
  );
}