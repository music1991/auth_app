"use client";

import { useState } from "react";
import UserPerformanceFilters from "@/components/dashboard/user/UserPerformanceFilters";
import UserPerformanceStats from "@/components/dashboard/user/UserPerformanceStats";
import UserPerformanceSummary from "@/components/dashboard/user/UserPerformanceSummary";

export default function UserPerformanceDashboard() {
  const [from, setFrom] = useState<string>("");
  const [to, setTo]     = useState<string>("");

  const ready = Boolean(from && to);

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Mi desempeño</h2>
          <p className="text-gray-500 mt-1">
            Resumen de tu avance, evaluaciones y tiempo de dedicación
          </p>
        </div>
      </div>

      <UserPerformanceFilters
        from={from}
        to={to}
        onRangeChange={(f, t) => {
          setFrom(f);
          setTo(t);
        }}
      />

      {ready && (
        <>
          <UserPerformanceStats from={from} to={to} />
          <UserPerformanceSummary from={from} to={to} />
        </>
      )}
    </div>
  );
}