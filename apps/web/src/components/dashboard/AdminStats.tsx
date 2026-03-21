"use client";

import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  FileText,
  TrendingUp,
} from "lucide-react";

interface AdminStatsData {
  total_users: number;
  active_users: number;
  pending_tasks: number;
  completed_tasks: number;
  pending_evaluations: number;
  productivity_rate: number;
}

export default function AdminStats() {
  const [stats, setStats] = useState<AdminStatsData | null>(null);
  const [loading, setLoading] = useState(true);

/*   useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/dashboard/admin/stats", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load admin stats");
        const data = (await res.json()) as AdminStatsData;
        setStats(data);
      } catch (err) {
        console.error("Error fetching admin stats:", err);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []); */

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-4 rounded-2xl border border-gray-200 bg-gray-50 animate-pulse">
            <div className="h-4 bg-gray-300 rounded mb-2"></div>
            <div className="h-8 bg-gray-300 rounded mb-1"></div>
            <div className="h-3 bg-gray-300 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return <div className="text-center py-8 text-gray-500">Error loading statistics</div>;
  }

  const progress = Math.max(0, Math.min(100, stats.productivity_rate));

  const statCards = [
    {
      title: "Total Users",
      value: stats.total_users.toString(),
      description: "Registered users",
      icon: Users,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
      borderColor: "border-blue-200",
      iconColor: "text-blue-600",
    },
    {
      title: "Active Users",
      value: stats.active_users.toString(),
      description: "Currently active",
      icon: UserCheck,
      color: "from-emerald-500 to-green-500",
      bgColor: "bg-gradient-to-br from-emerald-50 to-green-50",
      borderColor: "border-emerald-200",
      iconColor: "text-emerald-600",
    },
    {
      title: "Pending Tasks",
      value: stats.pending_tasks.toString(),
      description: "To complete",
      icon: AlertTriangle,
      color: "from-amber-500 to-orange-500",
      bgColor: "bg-gradient-to-br from-amber-50 to-orange-50",
      borderColor: "border-amber-200",
      iconColor: "text-amber-600",
    },
    {
      title: "Completed Tasks",
      value: stats.completed_tasks.toString(),
      description: "All-time completed",
      icon: CheckCircle2,
      color: "from-violet-500 to-purple-500",
      bgColor: "bg-gradient-to-br from-violet-50 to-purple-50",
      borderColor: "border-violet-200",
      iconColor: "text-violet-600",
    },
    {
      title: "Pending Evaluations",
      value: stats.pending_evaluations.toString(),
      description: "Awaiting response",
      icon: FileText,
      color: "from-rose-500 to-pink-500",
      bgColor: "bg-gradient-to-br from-rose-50 to-pink-50",
      borderColor: "border-rose-200",
      iconColor: "text-rose-600",
    },
    {
      title: "Productivity Rate",
      value: `${progress}%`,
      description: "Team average (today)",
      icon: TrendingUp,
      color: "from-indigo-500 to-blue-500",
      bgColor: "bg-gradient-to-br from-indigo-50 to-blue-50",
      borderColor: "border-indigo-200",
      iconColor: "text-indigo-600",
      isProgress: true,
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;

        return (
          <div
            key={index}
            className={`relative p-4 rounded-2xl border ${stat.borderColor} ${stat.bgColor} transition-all duration-300 hover:scale-105 hover:shadow-lg group overflow-hidden`}
          >
            <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${stat.color} opacity-10 rounded-full -translate-y-8 translate-x-8`} />

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <IconComponent size={16} className={stat.iconColor} />
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{stat.title}</p>
                </div>
              </div>

              <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-xs text-gray-500 mb-3">{stat.description}</p>

              {"isProgress" in stat && stat.isProgress && (
                <div className="mt-2">
                  <div className="w-full bg-white/50 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full bg-gradient-to-r ${stat.color} transition-all duration-700 ease-out`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Today</span>
                    <span>{progress}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
