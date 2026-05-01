"use client";

import { useEffect, useState } from "react";

interface AdminUserOption {
  id: string;
  name: string;
}

interface Props {
  selectedUserId: string;
  onUserChange: (userId: string) => void;
  period: string;
  onPeriodChange: (period: string) => void;
}

const PERIODS = [
  { value: "7d", label: "7 días" },
  { value: "30d", label: "30 días" },
  { value: "90d", label: "90 días" },
];

export default function AdminPerformanceFilters({
  selectedUserId,
  onUserChange,
  period,
  onPeriodChange,
}: Props) {
  const [users, setUsers] = useState<AdminUserOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/dashboard/admin/users", { cache: "no-store" });
        const data = await res.json();

        const onlyUsers = Array.isArray(data)
          ? data
              .filter((user: { role: string }) => user.role === "user")
              .map((user: { id: string; name: string }) => ({
                id: user.id,
                name: user.name,
              }))
          : [];

        setUsers(onlyUsers);
      } catch (error) {
        console.error("Error loading users:", error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Usuario
          </label>
          <select
            value={selectedUserId}
            onChange={(e) => onUserChange(e.target.value)}
            className="min-w-[220px] rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Seleccionar usuario</option>
            {loading ? (
              <option disabled>Cargando...</option>
            ) : (
              users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-1">Período</p>
        <div className="bg-white rounded-xl border border-gray-200 p-1 inline-flex gap-1">
          {PERIODS.map((item) => (
            <button
              key={item.value}
              onClick={() => onPeriodChange(item.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                period === item.value
                  ? "bg-green-500 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}