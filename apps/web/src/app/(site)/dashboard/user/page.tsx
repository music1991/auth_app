// components/dashboard/UserStats.tsx
"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Clock, CheckCircle, PlayCircle, AlertCircle, FileText } from "lucide-react";

interface UserStatsData {
  pending_tasks: number;
  in_progress_tasks: number;
  completed_tasks: number;
  today_work_time: string;
  pending_evaluations: number;
  productivity_score: number;
}

export default function UserStats() {
  const [stats, setStats] = useState<UserStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/user/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="p-4 rounded-2xl border border-gray-200 bg-gray-50 animate-pulse">
            <div className="h-4 bg-gray-300 rounded mb-2"></div>
            <div className="h-8 bg-gray-300 rounded mb-1"></div>
            <div className="h-3 bg-gray-300 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8 text-gray-500">
        Error loading statistics
      </div>
    );
  }

  const statCards = [
    {
      title: "Pending Tasks",
      value: stats.pending_tasks.toString(),
      trend: "+2",
      description: "To start",
      icon: AlertCircle,
      color: "from-amber-500 to-orange-500",
      bgColor: "bg-gradient-to-br from-amber-50 to-orange-50",
      borderColor: "border-amber-200",
      iconColor: "text-amber-600"
    },
    {
      title: "In Progress",
      value: stats.in_progress_tasks.toString(),
      trend: "Active",
      description: "Ongoing tasks",
      icon: PlayCircle,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
      borderColor: "border-blue-200",
      iconColor: "text-blue-600"
    },
    {
      title: "Completed",
      value: stats.completed_tasks.toString(),
      trend: "+5",
      description: "This month",
      icon: CheckCircle,
      color: "from-emerald-500 to-green-500",
      bgColor: "bg-gradient-to-br from-emerald-50 to-green-50",
      borderColor: "border-emerald-200",
      iconColor: "text-emerald-600"
    },
    {
      title: "Today's Time",
      value: stats.today_work_time,
      trend: "Productive",
      description: "Work registered",
      icon: Clock,
      color: "from-violet-500 to-purple-500",
      bgColor: "bg-gradient-to-br from-violet-50 to-purple-50",
      borderColor: "border-violet-200",
      iconColor: "text-violet-600"
    },
    {
      title: "Pending Evaluations",
      value: stats.pending_evaluations.toString(),
      trend: "Due soon",
      description: "To respond",
      icon: FileText,
      color: "from-rose-500 to-pink-500",
      bgColor: "bg-gradient-to-br from-rose-50 to-pink-50",
      borderColor: "border-rose-200",
      iconColor: "text-rose-600"
    },
    {
      title: "Productivity",
      value: `${stats.productivity_score}%`,
      trend: "+12%",
      description: "Your performance",
      icon: TrendingUp,
      color: "from-indigo-500 to-blue-500",
      bgColor: "bg-gradient-to-br from-indigo-50 to-blue-50",
      borderColor: "border-indigo-200",
      iconColor: "text-indigo-600"
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <div
            key={index}
            className={`relative p-4 rounded-2xl border ${stat.borderColor} ${stat.bgColor} transition-all duration-300 hover:scale-105 hover:shadow-lg group overflow-hidden`}
          >
            <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${stat.color} opacity-10 rounded-full -translate-y-8 translate-x-8`}></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <IconComponent size={16} className={stat.iconColor} />
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{stat.title}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full bg-white/80 backdrop-blur-sm ${stat.color.replace('from-', 'text-').split(' ')[0]}`}>
                  {stat.trend}
                </span>
              </div>
              
              <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
              
              <p className="text-xs text-gray-500 mb-3">{stat.description}</p>
              
              {stat.title === "Productivity" && (
                <div className="mt-2">
                  <div className="w-full bg-white/50 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full bg-gradient-to-r ${stat.color} transition-all duration-1000 ease-out`}
                      style={{ width: `${stats.productivity_score}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>This week</span>
                    <span>+12%</span>
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