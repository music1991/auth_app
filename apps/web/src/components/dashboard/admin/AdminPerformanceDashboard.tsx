"use client";

import { useState } from "react";
import AdminTeamStats from "./AdminTeamStats";
import AdminPerformanceFilters from "./AdminPerformanceFilters";
import AdminTeamRanking from "./AdminTeamRanking";
import AdminUserPerformancePanel from "./AdminUserPerformancePanel";
import AdminRoiPanel from "./AdminRoiPanel";

export default function AdminPerformanceDashboard() {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo]     = useState<string>("");

  // Until the filter initializes, don't render data components
  const ready = from && to;

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Desempeño del Equipo</h2>
          <p className="text-gray-500 mt-1">
            Vista general del equipo y detalle por usuario
          </p>
        </div>
      </div>

      {/* Filters — sets from/to on mount via data-range endpoint */}
      <AdminPerformanceFilters
        selectedUserId={selectedUserId}
        onUserChange={setSelectedUserId}
        from={from}
        to={to}
        onRangeChange={(f, t) => { setFrom(f); setTo(t); }}
      />

      {ready && (
        <>
          <AdminTeamStats from={from} to={to} />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <AdminTeamRanking
                from={from}
                to={to}
                selectedUserId={selectedUserId}
                onSelectUser={setSelectedUserId}
              />
            </div>
            <div className="xl:col-span-1">
              <AdminUserPerformancePanel
                userId={selectedUserId}
                from={from}
                to={to}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-6">
            <AdminRoiPanel />
          </div>
        </>
      )}
    </div>
  );
}