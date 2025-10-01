"use client";

import Countdown from "@/components/countDown";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get("email") ?? "";

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [codeExpired, setCodeExpired] = useState(false);
  const [loading, setLoading] = useState(true);

  // Evita reenviar múltiples veces si el componente re-renderiza
  const hasAutoResentRef = useRef(false);

  const hasSentCode = !!expiresAt;

  useEffect(() => {
    // Si hay email en la URL, lo pre-rellena
    if (emailFromUrl && !form.email) {
      setForm((prev) => ({ ...prev, email: emailFromUrl }));
    }
  }, [emailFromUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Reenvío automático si llega ?email=... en la URL
    const autoResend = async () => {
      if (!emailFromUrl || hasAutoResentRef.current) setLoading(false);
      else { 
        hasAutoResentRef.current = true;

        try {
          const res = await fetch("/api/auth/resend", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: emailFromUrl }),
          });
          const data = await res.json();

          if (data.error) {
            toast.error(data.error);
            return;
          }

          setExpiresAt(data.expiresAt ?? null);
          setDevCode(process.env.NODE_ENV !== "production" ? data.devCode ?? null : null);
          setCodeExpired(false);
          toast.success("Code sent to your email.");
        } catch {
          toast.error("Could not resend the code. Please try again.");
        } finally {
          setLoading(false);
        }
      }
    };

    autoResend();
  }, [emailFromUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      toast.error("All fields are required.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (data.error) {
      toast.error(data.error);
      return;
    }
    setLoading(false)
    setExpiresAt(data.expiresAt ?? null);
    setDevCode(process.env.NODE_ENV !== "production" ? data.devCode ?? null : null);
    setCodeExpired(false);
    toast.success("We sent you a verification code.");
  };

  const handleResend = async () => {
    if (!form.email.trim()) return toast.error("First enter your email.");
    const res = await fetch("/api/auth/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email }),
    });
    const data = await res.json();

    if (data.error) return toast.error(data.error);

    setExpiresAt(data.expiresAt ?? null);
    setDevCode(process.env.NODE_ENV !== "production" ? data.devCode ?? null : null);
    setCodeExpired(false);
    toast.success("Code sent.");
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Validation</h1>
      {loading ? 
      (
        <div className="flex justify-center items-center">
          <span className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-600"></span>
          <span className="ml-2 text-blue-600">Waiting...</span>
        </div>
      ) :
      !hasSentCode ? (
        <>
          <input
            className="w-full border p-2"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            suppressHydrationWarning
          />
          <input
            className="w-full border p-2"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            suppressHydrationWarning
          />
          <input
            className="w-full border p-2"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            suppressHydrationWarning
          />
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded transition transform active:scale-95 active:bg-blue-700 w-full"
            suppressHydrationWarning
          >
            Register
          </button>
        </>
      ) : (
        <div className="text-sm text-center gap-4">
          <div className="mb-8 mt-8">
            <VerificationNotice
              expiresAt={expiresAt}
              devCode={devCode}
              onExpired={() => {
                setCodeExpired(true);
                toast.error("Code expired, please resend.");
              }}
            />
          </div>

          {!codeExpired ? (
            <Link href="/verify" replace className="underline hover:no-underline font-semibold">
              Validate Code
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="underline hover:no-underline font-semibold"
            >
              Resend Code
            </button>
          )}
        </div>
      )}
    </form>
  );
}

function VerificationNotice({
  expiresAt,
  devCode,
  onExpired,
}: {
  expiresAt: string | null;
  devCode: string | null;
  onExpired: () => void;
}) {
  return (
    <>
      We sent a validation code to your email, please check your inbox.{" "}
      The code expires in{" "}
      {expiresAt ? (
        <>
          <Countdown expiresAt={expiresAt} onDone={onExpired} />{" "}minutes.
        </>
      ) : (
        "—"
      )}
      {/* (DEV) Code helper, opcional en desarrollo
      {devCode ? (
        <div className="mt-1 text-xs text-gray-500">
          (DEV) Code: <span className="font-mono">{devCode}</span>
        </div>
      ) : null} */}
    </>
  );
}
