"use client";

import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  CheckCircle2,
  FileText,
  Award,
  Clock3,
} from "lucide-react";

interface AdminTeamStatsData {
  total_users: number;
  active_users: number;
  task_completion_pct: number;
  evaluation_completion_pct: number;
  evaluation_approval_pct: number;
  avg_score_pct: number;
  total_session_hours: number;
}

interface Props {
  period: string;
}

export default function AdminTeamStats({ period }: Props) {
  const [stats, setStats] = useState<AdminTeamStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/dashboard/admin/analytics/team?period=${period}`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error("Failed to load team stats");
        const data = (await res.json()) as AdminTeamStatsData;
        setStats(data);
      } catch (error) {
        console.error("Error fetching team stats:", error);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [period]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-2xl border border-gray-200 bg-gray-50 animate-pulse"
          >
            <div className="h-4 bg-gray-300 rounded mb-2" />
            <div className="h-8 bg-gray-300 rounded mb-1" />
            <div className="h-3 bg-gray-300 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8 text-gray-500">
        Error loading team statistics
      </div>
    );
  }

  const cards = [
    {
      title: "Usuarios",
      value: stats.total_users,
      description: "Total registrados",
      icon: Users,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      title: "Activos",
      value: stats.active_users,
      description: `Con sesiones en ${period}`,
      icon: UserCheck,
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
    },
    {
      title: "Tareas",
      value: `${stats.task_completion_pct}%`,
      description: "Completadas",
      icon: CheckCircle2,
      iconColor: "text-violet-600",
      bgColor: "bg-violet-50",
      borderColor: "border-violet-200",
    },
    {
      title: "Evaluaciones",
      value: `${stats.evaluation_completion_pct}%`,
      description: "Completadas",
      icon: FileText,
      iconColor: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
    },
    {
      title: "Aprobación",
      value: `${stats.evaluation_approval_pct}%`,
      description: "Evaluaciones aprobadas",
      icon: Award,
      iconColor: "text-rose-600",
      bgColor: "bg-rose-50",
      borderColor: "border-rose-200",
    },
    {
      title: "Horas",
      value: stats.total_session_hours,
      description: `Sesión total (${period})`,
      icon: Clock3,
      iconColor: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;

        return (
          <div
            key={index}
            className={`p-4 rounded-2xl border ${card.borderColor} ${card.bgColor} transition-all hover:shadow-md`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Icon size={16} className={card.iconColor} />
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