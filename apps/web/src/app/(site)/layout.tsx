import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import Navbar from "@/components/Navbar";

function isValid(token?: string) {
  if (!token) return false;
  try { jwt.verify(token, process.env.JWT_SECRET!); return true; }
  catch { return false; }
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const token = jar.get("session")?.value;

  if (!isValid(token)) redirect("/login");

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <section className="">
          {children}
        </section>
      </div>
    </>
  );
}
