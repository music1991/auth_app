import type { ReactNode } from "react";

export function StatItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-[10px] text-gray-400">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}