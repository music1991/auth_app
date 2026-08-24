"use client";

import { useEffect, useState } from "react";

interface TeamRankingItem {
  user_id: string;
  user_name: string;
  task_completion_pct: number;
  evaluation_approval_pct: number;
  avg_score_pct: number;
  total_hours: number;
  performance_index: number;
}

interface Props {
  from: string;
  to: string;
  selectedUserId: string;
  onSelectUser: (userId: string) => void;
}

export default function AdminTeamRanking({
  from,
  to,
  selectedUserId,
  onSelectUser,
}: Props) {
  const [rows, setRows] = useState<TeamRankingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!from || !to || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      return;
    }

    const fetchRanking = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/dashboard/admin/analytics/team/ranking?from=${from}&to=${to}`,
          { cache: "no-store" }
        );
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          console.error("Error response from ranking API:", errData);
          throw new Error(errData.error || "Failed to load ranking");
        }
        const data = await res.json();
        setRows(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching ranking:", error);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, [from, to]);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-800">Ranking del equipo</h3>
        <p className="text-sm text-gray-500">
          Comparativa de desempeño por usuario
        </p>
      </div>

      {loading ? (
        <div className="py-10 text-center text-gray-400">Cargando ranking...</div>
      ) : rows.length === 0 ? (
        <div className="py-10 text-center text-gray-400">Sin datos disponibles para este período</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-200">
                <th className="py-3 pr-4">Usuario</th>
                <th className="py-3 pr-4">% tareas</th>
                <th className="py-3 pr-4">% aprobación</th>
                <th className="py-3 pr-4">Score</th>
                <th className="py-3 pr-4">Horas</th>
                <th className="py-3 pr-4">Índice</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isSelected = selectedUserId === row.user_id;

                return (
                  <tr
                    key={row.user_id}
                    onClick={() => onSelectUser(row.user_id)}
                    className={`border-b border-gray-100 cursor-pointer transition ${
                      isSelected ? "bg-green-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="py-4 pr-4 font-medium text-gray-900">
                      {row.user_name}
                    </td>
                    <td className="py-4 pr-4 text-gray-700">
                      {row.task_completion_pct}%
                    </td>
                    <td className="py-4 pr-4 text-gray-700">
                      {row.evaluation_approval_pct}%
                    </td>
                    <td className="py-4 pr-4 text-gray-700">
                      {row.avg_score_pct}%
                    </td>
                    <td className="py-4 pr-4 text-gray-700">
                      {row.total_hours}
                    </td>
                    <td className="py-4 pr-4">
                      <span className="inline-flex rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-semibold">
                        {row.performance_index}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}