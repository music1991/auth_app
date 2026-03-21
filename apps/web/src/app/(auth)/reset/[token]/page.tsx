
import { redirect } from "next/navigation";

import { findValidResetByToken } from "@/lib/forgot-password";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page({ params }: { params: { token: string } }) {
  const token = params.token ?? "";
  const pr = await findValidResetByToken(token);
  if (!pr) redirect("/reset/expired");

  return (
    <section className="max-w-sm mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Reset Password</h1>
      <ResetPasswordForm token={token} />
    </section>
  );
}
