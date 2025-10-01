"use client";
import { useEffect, useMemo, useState } from "react";

function format(msLeft: number) {
  if (msLeft < 0) msLeft = 0;
  const totalSec = Math.floor(msLeft / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function Countdown({
  expiresAt,
  onDone,
}: {
  expiresAt: string | null | undefined;
  onDone?: () => void;
}) {
  const target = useMemo(() => (expiresAt ? new Date(expiresAt).getTime() : 0), [expiresAt]);
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const msLeft = target - now;
  const done = !target || msLeft <= 0;

  useEffect(() => {
    if (done && onDone) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  return (
    <span className={done ? "text-red-600 font-medium" : "text-gray-600"}>
      {format(msLeft)}
    </span>
  );
}
