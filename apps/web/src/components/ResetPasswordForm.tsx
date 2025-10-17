"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import PasswordField from "@/components/PasswordField";
import RequirementsList from "./RequirementsList";


export default function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);

  const rules = useMemo(() => {
    const len = pw1.length >= 8;
    const lower = /[a-z]/.test(pw1);
    const upper = /[A-Z]/.test(pw1);
    const number = /\d/.test(pw1);
    const dot = /\./.test(pw1);
    const match = pw1.length > 0 && pw1 === pw2;
    return { len, lower, upper, number, dot, match };
  }, [pw1, pw2]);

  const allOk = Object.values(rules).every(Boolean);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allOk) {
      toast.error(!rules.match ? "Passwords do not match." : "Password does not meet the requirements.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password: pw1 }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data?.code === 101 || /expired|invalid/i.test(data?.error || "")) {
        toast.error(data?.error || "Invalid or expired reset link.");
        return router.replace("/reset/expired");
      }
      return toast.error(data?.error || "Something went wrong.");
    }

    toast.success("Password updated. You can sign in now.");
    router.replace("/login");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <PasswordField value={pw1} onChange={(e) => setPw1(e.target.value)} />
      <PasswordField value={pw2} onChange={(e) => setPw2(e.target.value)} />
      <RequirementsList rules={rules} />
      <button
        className="bg-green-600 text-white px-4 py-2 rounded transition active:scale-95 w-full disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!allOk || loading}
      >
        {loading ? "Updating..." : "Update Password"}
      </button>
    </form>
  );
}
