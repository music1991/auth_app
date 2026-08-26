"use client";

import { useEffect, useState } from "react";

interface UserPerformanceData {
  user_id: string;
  user_name: string;
  task_completion_pct: number;
  on_time_task_pct: number;
  evaluation_completion_pct: number;
  evaluation_approval_pct: number;
  avg_score_pct: number;
  total_hours: number;
}

interface Props {
  from: string;
  to: string;
}

export default function UserPerformanceSummary({ from, to }: Props) {
  const [data, setData] = useState<UserPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!from || !to) {
      setData(null);
      return;
    }

    const fetchSummary = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/dashboard/user/analytics/summary?from=${from}&to=${to}`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error("Failed to load performance summary");
        const json = (await res.json()) as UserPerformanceData;
        setData(json);
      } catch (error) {
        console.error("Error fetching user summary:", error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [from, to]);

  if (loading) {
    return <div className="py-10 text-center text-gray-400">Cargando resumen...</div>;
  }

  if (!data) {
    return <div className="py-10 text-center text-gray-400">Sin datos disponibles</div>;
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <h3 className="text-lg font-bold text-gray-800 mb-2">Resumen personal</h3>
      <p className="text-sm text-gray-500 mb-4">
        Este panel te muestra cómo venís en tareas, evaluaciones y dedicación.
      </p>

      <div className="space-y-3 text-sm text-gray-700">
        <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
          Completaste <span className="font-semibold">{data.task_completion_pct}%</span> de tus tareas
          y tu cumplimiento en fecha es de <span className="font-semibold">{data.on_time_task_pct}%</span>.
        </div>

        <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
          Aprobaste <span className="font-semibold">{data.evaluation_approval_pct}%</span> de tus evaluaciones
          completadas, con un score promedio de <span className="font-semibold">{data.avg_score_pct}%</span>.
        </div>

        <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
          Registraste <span className="font-semibold">{data.total_hours} horas</span> de sesión
          en el período seleccionado.
        </div>
      </div>
    </div>
  );
}