import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import PresencePing from "@/hooks/use-socket-presence";
import SessionGuard from "@/components/session/SessionGuard";

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
      <SessionGuard />
      <PresencePing user={userSession} />
      <Navbar role={session.role} />
      <div className="w-full">
        <section>{children}</section>
      </div>
    </>
  );
}
