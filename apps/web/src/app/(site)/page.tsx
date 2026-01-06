// app/(site)/dashboard/page.tsx

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    const session = await getSession();
    const role = session?.role;

    if (!role) {
        redirect("/login");
    }

    if (role === "admin") {
        redirect("/dashboard/admin");
    } else {
        redirect("/dashboard/user");
    }
}