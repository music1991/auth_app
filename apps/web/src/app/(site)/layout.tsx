import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import PresencePing from "@/hooks/use-socket-presence";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const jar = await cookies();
  const userSession = {
    id: session.userId,
    name: jar.get("name")?.value ?? "Usuario",
    role: session.role,
  };

  return (
    <>
      <PresencePing user={userSession} />
      <Navbar role={session.role} />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <section>{children}</section>
      </div>
    </>
  );
}
