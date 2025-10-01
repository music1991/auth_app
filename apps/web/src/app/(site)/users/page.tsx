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
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold mb-6">User Management</h1>
        <p className="text-muted-foreground">
          As an <span className="font-semibold">admin</span>, you can view and manage all registered accounts.
          Use this panel to inspect user details, verify, or remove accounts.
        </p>
      </div>
      <UsersTable currentUserId={session.sub} />
    </section>
  );
}
