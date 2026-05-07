"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LogOut, RefreshCw, Clock } from "lucide-react";

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;
const WARNING_BEFORE_MS = 5 * 60 * 1000;
const WARNING_AT_MS = INACTIVITY_TIMEOUT_MS - WARNING_BEFORE_MS;

export default function SessionGuard() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [countdown, setCountdown] = useState(300);
  const [refreshing, setRefreshing] = useState(false);

  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const isModalOpen = useRef(false);

  const clearTimers = () => {
    if (warningTimer.current) clearTimeout(warningTimer.current);
    if (countdownInterval.current) clearInterval(countdownInterval.current);
  };

  const handleLogout = useCallback(async () => {
    clearTimers();
    setShowModal(false);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/login");
  }, [router]);

  const startCountdown = useCallback(() => {
    setCountdown(300);
    if (countdownInterval.current) clearInterval(countdownInterval.current);
    countdownInterval.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [handleLogout]);

  const scheduleWarning = useCallback(() => {
    if (warningTimer.current) clearTimeout(warningTimer.current);
    warningTimer.current = setTimeout(() => {
      isModalOpen.current = true;
      setShowModal(true);
      startCountdown();
    }, WARNING_AT_MS);
  }, [startCountdown]);

  const handleContinue = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" });
      if (!res.ok) {
        await handleLogout();
        return;
      }
      isModalOpen.current = false;
      setShowModal(false);
      if (countdownInterval.current) clearInterval(countdownInterval.current);
      scheduleWarning();
    } catch {
      await handleLogout();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const onActivity = () => {
      if (!isModalOpen.current) scheduleWarning();
    };

    const events: (keyof WindowEventMap)[] = ["mousedown", "keydown", "touchstart", "scroll", "click"];
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    scheduleWarning();

    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      clearTimers();
    };
  }, [scheduleWarning]);

  if (!showModal) return null;

  const mins = Math.floor(countdown / 60);
  const secs = countdown % 60;
  const pct = Math.round((countdown / 300) * 100);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">

        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-1 bg-amber-400 transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="p-6">
          {/* Icon + title */}
          <div className="flex flex-col items-center gap-3 mb-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 border-2 border-amber-200">
              <Clock className="h-7 w-7 text-amber-500" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-gray-900">Tu sesión está por expirar</h2>
              <p className="mt-1 text-sm text-gray-500">
                Por inactividad, tu sesión cerrará automáticamente en
              </p>
            </div>
          </div>

          {/* Countdown */}
          <div className="mb-6 flex justify-center">
            <span className="tabular-nums text-4xl font-bold text-amber-500">
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </span>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleContinue}
              disabled={refreshing}
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-green-500 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-green-600 disabled:opacity-60 transition-colors"
            >
              {refreshing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {refreshing ? "Renovando sesión..." : "Continuar aquí"}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
