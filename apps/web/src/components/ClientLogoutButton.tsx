"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";

export function ClientLogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Cache-Control": "no-cache"
        },
        cache: "no-store"
      });

      if (response.ok) {
        // Forzar recarga completa para limpiar cache del navegador
        window.location.href = "/login";
      } else {
        console.error("Logout failed");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoading(false);
      // Fallback: redirigir incluso si hay error
      window.location.href = "/login";
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className={`
        flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150
      `}
    >
      {isLoading ? (
        <div className="m-auto">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      ) : (
        <>
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </>
      )}
    </button>
  );
}