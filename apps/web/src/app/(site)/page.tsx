import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session?.role) redirect("/login");

  if (session.role === "admin") {
    redirect("/dashboard/admin");
  } else {
    redirect("/dashboard/user");
  }
}
