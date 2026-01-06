// components/dashboard/UserStats.tsx
"use client";

import { 
  Clock, 
  CheckCircle, 
  PlayCircle, 
  AlertCircle, 
  TrendingUp,
  FileText
} from "lucide-react";

interface UserStatsData {
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  todayWorkTime: string;
  pendingEvaluations: number;
  productivityScore: number;
}

export default function UserStats() {
  const stats: UserStatsData = {
    pendingTasks: 3,
    inProgressTasks: 2,
    completedTasks: 12,
    todayWorkTime: "6h 45m",
    pendingEvaluations: 1,
    productivityScore: 85,
  };

  const statCards = [
    {
      title: "Pending Tasks",
      value: "3",
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
      value: "2",
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
      value: "12",
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
      value: "6h 45m",
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
      value: "1",
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
      value: "85%",
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
            {/* Background gradient accent */}
            <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${stat.color} opacity-10 rounded-full -translate-y-8 translate-x-8`}></div>
            
            <div className="relative z-10">
              {/* Header with icon, title and trend */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <IconComponent size={16} className={stat.iconColor} />
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{stat.title}</p>
                </div>
                {/* <span className={`text-xs font-medium px-2 py-1 rounded-full bg-white/80 backdrop-blur-sm ${stat.color.replace('from-', 'text-').split(' ')[0]}`}>
                  {stat.trend}
                </span> */}
              </div>
              
              {/* Main value */}
              <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
              
              {/* Description */}
              <p className="text-xs text-gray-500 mb-3">{stat.description}</p>
              
              {/* Progress bar only for productivity */}
              {stat.title === "Productivity" && (
                <div className="mt-2">
                  <div className="w-full bg-white/50 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full bg-gradient-to-r ${stat.color} transition-all duration-1000 ease-out`}
                      style={{ width: `85%` }}
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