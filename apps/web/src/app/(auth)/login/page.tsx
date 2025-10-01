"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showWarningRedirect, setShowWarningRedirect] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.email.trim().length === 0 || form.password.trim().length === 0) {
      toast.error("All fields are required.");
      return;
    }
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (data.error) {
      toast.error(data.error);
      setLoading(false);

      if (data.code === 100) {
        setShowWarningRedirect(true);
        setTimeout(() => {
          router.replace(`/register?email=${encodeURIComponent(form.email)}`);
        }, 5000);
      }
      return;
    }
    setLoading(false);

    if (res.ok) {
      router.replace("/");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Sign In</h1>
      <input
        className="w-full border p-2"
        type="email"
        placeholder="Email"
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        suppressHydrationWarning
      />
      <input
        className="w-full border p-2"
        type="password"
        placeholder="Password"
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        suppressHydrationWarning
      />
      {loading ?
        (
          <div className="flex justify-center items-center">
            <span className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-green-600"></span>
            <span className="ml-2 text-green-600">Login...</span>
          </div>
        ) :
        <button
          className="bg-green-600 text-white px-4 py-2 rounded transition transform active:scale-95 active:bg-green-700 w-full"
          suppressHydrationWarning
        >
          Login
        </button>}

      {showWarningRedirect && (
        <div className="flex flex-col items-center space-y-2">
          <span className="text-red-600 text-sm text-center">
            Your account is not verified. <br />
            You will be redirected to the verification page in 5 seconds...
          </span>
        </div>
      )}

      <div className="text-sm text-center">
        <span className="text-muted-foreground">Don’t have an account?</span>{" "}
        <Link href={{ pathname: "/register" }} replace className="underline hover:no-underline">
          REGISTER HERE
        </Link>
      </div>

      <div className="mt-12 flex gap-2 rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground flex-col">
        <div className="flex flex-col mt-3 mb-3 items-center justify-center">
          <div className="mb-4">
            <span role="img" aria-label="key">🔑</span>
            <span>
              You can register or try the <strong>demo admin account</strong>.
            </span>
          </div>
          <span>
            <span className="font-medium">.Email:</span>{" "}
            <code className="font-mono">admin@gmail.com</code>{" "}
            </span>
            <span>
            <span className="font-medium">.Password:</span>{" "}
            <code className="font-mono">admin</code>
          </span>
        </div>
      </div>
    </form>
  );
}
