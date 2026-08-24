"use client";

import { useEffect, useState } from "react";
import { User, CheckCircle2, Award, Clock3, FileText } from "lucide-react";

interface UserPerformanceData {
  user_name: string;
  task_completion_pct: number;
  on_time_task_pct: number;
  evaluation_completion_pct: number;
  evaluation_approval_pct: number;
  avg_score_pct: number;
  total_hours: number;
}

interface Props {
  userId: string;
  from: string;
  to: string;
}

export default function AdminUserPerformancePanel({ userId, from, to }: Props) {
  const [data, setData] = useState<UserPerformanceData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || !from || !to || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      setData(null);
      return;
    }

    const fetchUserStats = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/dashboard/admin/analytics/user/${userId}?from=${from}&to=${to}`,
          { cache: "no-store" }
        );
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          console.error("Error response from user performance API:", errData);
          throw new Error(errData.error || "Failed to load user performance");
        }
        const json = (await res.json()) as UserPerformanceData;
        setData(json);
      } catch (error) {
        console.error("Error fetching user performance:", error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [userId, from, to]);

  if (!userId) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-5 min-h-[300px] flex items-center justify-center text-center text-gray-400">
        Seleccioná un usuario para ver su detalle
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-5 min-h-[300px] flex items-center justify-center text-gray-400">
        Cargando detalle...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-5 min-h-[300px] flex items-center justify-center text-gray-400">
        No se pudo cargar el detalle del usuario
      </div>
    );
  }

  const cards = [
    {
      title: "Tareas",
      value: `${data.task_completion_pct}%`,
      subtitle: "Completadas",
      icon: CheckCircle2,
    },
    {
      title: "En fecha",
      value: `${data.on_time_task_pct}%`,
      subtitle: "Cumplimiento",
      icon: FileText,
    },
    {
      title: "Aprobación",
      value: `${data.evaluation_approval_pct}%`,
      subtitle: "Evaluaciones",
      icon: Award,
    },
    {
      title: "Score",
      value: `${data.avg_score_pct}%`,
      subtitle: "Promedio",
      icon: User,
    },
    {
      title: "Horas",
      value: `${data.total_hours}`,
      subtitle: `Sesión en período`,
      icon: Clock3,
    },
  ] as const;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="mb-5">
        <h3 className="text-lg font-bold text-gray-800">Detalle del usuario</h3>
        <p className="text-sm text-gray-500">{data.user_name}</p>
      </div>

      <div className="space-y-3">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-gray-700">
                  <Icon size={16} />
                  <span className="text-sm font-medium">{card.title}</span>
                </div>
                <span className="text-lg font-bold text-gray-900">
                  {card.value}
                </span>
              </div>
              <p className="text-xs text-gray-500">{card.subtitle}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}