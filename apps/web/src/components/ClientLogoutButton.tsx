"use client";

import { useRouter } from "next/navigation";

export function ClientLogoutButton() {
  const router = useRouter();
  return (
    <button
      className="font text-sm transition transform active:scale-95 active:bg-white-700"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.replace("/login");
      }}
    >
      Logout
    </button>
  );
}
