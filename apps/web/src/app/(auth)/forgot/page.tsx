"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";


export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });


    if (res.status !== 200) {
      const errorData = await res.json();
      toast.error(errorData.error || "Something went wrong");
      setLoading(false);
      return;
    }

    toast.success("We've sent a reset link.");
    setLoading(false);
    router.replace("/");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="max-w-sm mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Forgot Password</h1>

      <input
        className="w-full border p-2 rounded-md"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        suppressHydrationWarning
      />

      {loading ? (
        <div className="flex justify-center items-center">
          <span className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-green-600"></span>
          <span className="ml-2 text-green-600">Sending...</span>
        </div>
      ) : (
        <button className="bg-green-600 text-white px-4 py-2 rounded transition active:scale-95 w-full">
          Reset Password
        </button>
      )}
    </form>
  );
}
