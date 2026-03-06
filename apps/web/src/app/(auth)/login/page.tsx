"use client";

import PasswordField from "@/components/PasswordField";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

/* interface LoginResponse {
  success: boolean;
  error?: string; // Por si falla
  code?: number;  // Tu código 100 por ejemplo
} */

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

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        cache: "no-store"
      });
      
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error);
        
        if (data.code === 100) {
          setShowWarningRedirect(true);
          setTimeout(() => {
            router.replace(`/register?email=${encodeURIComponent(form.email)}`);
          }, 100);
        }
        setLoading(false)
        return;
      }

      if (res.ok) {
        window.location.href = "/";
        return;
      }
      
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred during login");
      setLoading(false);
    }
      
  }


  const handleQuickRedirect = (path: string) => {
    router.push(path);
  };

  const userAdmin = {
    email: "admin@gmail.com",
    password: "admin"
  };


  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Sign In</h1>
      
      <input
        suppressHydrationWarning
        className="w-full border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        required
        disabled={loading}
      />
      
      <PasswordField
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        disabled={loading}
      />
      
      {loading ? (
        <div className="flex justify-center items-center py-2">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-green-600"></div>
          <span className="ml-2 text-green-600">Signing...</span>
        </div>
      ) : (
        <button
          suppressHydrationWarning
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-all duration-200 active:scale-95 w-full font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          Sign In
        </button>
      )}

      {showWarningRedirect && (
        <div className="flex flex-col items-center space-y-2 p-3 border border-amber-200 bg-amber-50 rounded-md">
          <span className="text-amber-700 text-sm text-center">
            Your account is not verified. <br />
            Redirecting to verification...
          </span>
        </div>
      )}

      <div className="text-sm justify-between flex flex-row pl-2 pr-2">
        <button 
          suppressHydrationWarning
          type="button"
          onClick={() => handleQuickRedirect('/register')}
          className="text-green-600 hover:text-green-700 underline hover:no-underline active:scale-95 transition-transform duration-150 disabled:opacity-50"
          disabled={loading}
        >
          REGISTER HERE
        </button>
        <button 
          suppressHydrationWarning
          type="button"
          onClick={() => handleQuickRedirect('/forgot')}
          className="text-gray-600 hover:text-gray-700 hover:no-underline active:scale-95 transition-transform duration-150 disabled:opacity-50"
          disabled={loading}
        >
          Forgot your password?
        </button>
      </div>

      <div className="mt-12 flex gap-2 rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground flex-col">
        <div className="flex flex-col mt-3 mb-3 items-center justify-center">
          <div className="mb-4 text-center">
            <span role="img" aria-label="key">🔑</span>
            <span>
              You can register or try the <strong>demo admin account</strong>.
            </span>
          </div>
          <span>
            <span className="font-medium">Email:</span>{" "}
            <code className="font-mono">{userAdmin.email}</code>{" "}
          </span>
          <span>
            <span className="font-medium">Password:</span>{" "}
            <code className="font-mono">{userAdmin.password}</code>
          </span>
        </div>
        <button
      type="button"
      onClick={() => setForm({ email: userAdmin.email, password: userAdmin.password })}
      className="mt-3 bg-green-200 hover:bg-green-300 text-green-800 px-4 py-2 rounded-md transition-all duration-200 active:scale-95 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={loading}
      suppressHydrationWarning
    >
      Use Admin Account
    </button>
      </div>
    </form>
  );
}