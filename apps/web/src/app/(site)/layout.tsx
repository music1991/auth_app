import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import { Navbar } from "@/components/Navbar";
import PresencePing from "@/hooks/use-socket-presence";


function isValid(token?: string) {
  if (!token) return false;
  try {
    jwt.verify(token, process.env.JWT_SECRET!);
    return true;
  } catch {
    return false;
  }
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const token = jar.get("session")?.value;
  const role = jar.get("role")?.value || "user";

  if (!isValid(token)) redirect("/login");

  const userSession = {
    id: jar.get("id")?.value || 0,
    name: jar.get("name")?.value || "Usuario",
    role: jar.get("role")?.value || "user"
  };

  return (
    <>
      <PresencePing user={userSession} />
      <Navbar role={role!} />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <section className="">
          {children}
        </section>
      </div>
    </>
  );
}