"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function VerifyPage() {
  const [form, setForm] = useState({ email: "", code: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async(e: React.FormEvent) => {
    e.preventDefault();
    if (form.email.trim().length === 0 || form.code.trim().length === 0) toast.error("All fields are required.");
    else {
      setLoading(true);
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      data.error ? toast.error(data.error) : toast.success("Verify correct.");

      if (res.ok) router.replace("/");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Verify Account</h1>
      <input
        className="w-full border p-2"
        type="email"
        placeholder="Email"
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <input
        className="w-full border p-2"
        placeholder="Code"
        onChange={(e) => setForm({ ...form, code: e.target.value })}
      />
      
      {loading && (
        <div className="flex justify-center items-center">
          <span className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-600"></span>
          <span className="ml-2 text-purple-600">Verifying...</span>
        </div>
      )}
      {!loading && 
        <button className="bg-purple-600 text-white px-4 py-2 rounded transition transform active:scale-95 active:bg-purple-700 w-full">Verify</button>
      }
    </form>
  );
}
