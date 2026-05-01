"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Award, FileText, Clock3, TrendingUp } from "lucide-react";

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
  period: string;
}

export default function UserPerformanceStats({ period }: Props) {
  const [data, setData] = useState<UserPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/dashboard/user/analytics/summary?period=${period}`,
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
  }, [period]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 rounded-2xl border border-gray-200 bg-gray-50 animate-pulse">
            <div className="h-4 bg-gray-300 rounded mb-2"></div>
            <div className="h-8 bg-gray-300 rounded mb-1"></div>
            <div className="h-3 bg-gray-300 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!data) {
    return <div className="py-8 text-center text-gray-500">No se pudo cargar tu desempeño</div>;
  }

  const cards = [
    {
      title: "Tareas",
      value: `${data.task_completion_pct}%`,
      description: "Completadas",
      icon: CheckCircle2,
      color: "text-violet-600",
      bg: "bg-violet-50",
      border: "border-violet-200",
    },
    {
      title: "En fecha",
      value: `${data.on_time_task_pct}%`,
      description: "Cumplimiento",
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
    },
    {
      title: "Aprobación",
      value: `${data.evaluation_approval_pct}%`,
      description: "Evaluaciones aprobadas",
      icon: Award,
      color: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-200",
    },
    {
      title: "Score",
      value: `${data.avg_score_pct}%`,
      description: "Promedio",
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
    },
    {
      title: "Horas",
      value: `${data.total_hours}`,
      description: `Sesión ${period}`,
      icon: Clock3,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-200",
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;

        return (
          <div
            key={index}
            className={`p-4 rounded-2xl border ${card.border} ${card.bg} transition-all hover:shadow-md`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Icon size={16} className={card.color} />
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                {card.title}
              </p>
            </div>

            <p className="text-2xl font-bold text-gray-900 mb-1">{card.value}</p>
            <p className="text-xs text-gray-500">{card.description}</p>
          </div>
        );
      })}
    </div>
  );
}