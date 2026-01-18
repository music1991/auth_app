"use client";

import { useEffect } from "react";

export default function PresencePing() {
  useEffect(() => {
    const ping = () => {
      fetch("/api/dashboard/presence", {
        method: "POST",
        cache: "no-store",
      }).catch(() => {});
    };

    ping();

    const id = setInterval(ping, 10 * 60 * 1000); // 10 min
    return () => clearInterval(id);
  }, []);

  return null;
}
