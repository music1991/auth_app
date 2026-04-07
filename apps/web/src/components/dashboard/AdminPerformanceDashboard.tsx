"use client";

import { useState } from "react";


import AdminTeamStats from "./AdminTeamStats";
import AdminPerformanceFilters from "./AdminPerformanceFilters";
import AdminTeamRanking from "./AdminTeamRanking";
import AdminUserPerformancePanel from "./AdminUserPerformancePanel";

export default function AdminPerformanceDashboard() {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [period, setPeriod] = useState("30d");

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Desempeño del Equipo</h2>
          <p className="text-gray-500 mt-1">
            Vista general del equipo y detalle por usuario
          </p>
        </div>
      </div>

      <AdminTeamStats period={period} />

      <AdminPerformanceFilters
        selectedUserId={selectedUserId}
        onUserChange={setSelectedUserId}
        period={period}
        onPeriodChange={setPeriod}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <AdminTeamRanking
            period={period}
            selectedUserId={selectedUserId}
            onSelectUser={setSelectedUserId}
          />
        </div>

        <div className="xl:col-span-1">
          <AdminUserPerformancePanel
            userId={selectedUserId}
            period={period}
          />
        </div>
      </div>
    </div>
  );
}