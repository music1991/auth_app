"use client";

import { useState } from "react";
import UserPerformanceStats from "@/components/dashboard/UserPerformanceStats";
import UserPerformanceSummary from "@/components/dashboard/UserPerformanceSummary";

export default function UserPerformanceDashboard() {
  const [period, setPeriod] = useState("30d");

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Mi desempeño</h2>
          <p className="text-gray-500 mt-1">
            Resumen de tu avance, evaluaciones y tiempo de dedicación
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">Período</p>
          <div className="bg-white rounded-xl border border-gray-200 p-1 inline-flex gap-1">
            {["7d", "30d", "90d"].map((item) => (
              <button
                key={item}
                onClick={() => setPeriod(item)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  period === item
                    ? "bg-green-500 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <UserPerformanceStats period={period} />
      <UserPerformanceSummary period={period} />
    </div>
  );
}