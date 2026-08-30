"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Calendar, Info } from "lucide-react";

interface AdminUserOption {
  id: string;
  name: string;
}

interface DataGap {
  from: string;
  to: string;
  gap_days: number;
}

interface DataRangeResponse {
  min_date: string;
  max_date: string;
  gaps: DataGap[];
}

interface Props {
  selectedUserId: string;
  onUserChange: (userId: string) => void;
  from: string;
  to: string;
  onRangeChange: (from: string, to: string) => void;
}

/** Formats YYYY-MM-DD to DD/MM/YYYY for user-friendly display in Spanish. */
function formatDateStr(dateIso: string): string {
  if (!dateIso || !/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) return dateIso;
  const [yyyy, mm, dd] = dateIso.split("-");
  return `${dd}/${mm}/${yyyy}`;
}

/** Formats an ISO date or date-time string as "dd/mm/aaaa y hh:mm" (UTC, matching the stored date). */
function formatDateTimeStr(dateIso: string): string {
  const d = new Date(dateIso);
  if (isNaN(d.getTime())) return dateIso;
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const min = String(d.getUTCMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} y ${hh}:${min}`;
}

export default function AdminPerformanceFilters({
  selectedUserId,
  onUserChange,
  from,
  to,
  onRangeChange,
}: Props) {
  const [users, setUsers] = useState<AdminUserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [dataRange, setDataRange] = useState<DataRangeResponse | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Today's date for limiting max pickable date in calendar
  const todayStr = new Date().toISOString().slice(0, 10);

  // Load user list and data-range on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
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
        setLoadingUsers(false);
      }
    };

    const fetchDataRange = async () => {
      try {
        const res = await fetch("/api/dashboard/admin/analytics/data-range", {
          cache: "no-store",
        });
        if (res.ok) {
          const range: DataRangeResponse = await res.json();
          setDataRange(range);

          // Default: use max_date as 'to', and min_date (or max_date - 90d) as 'from'
          if (!from || !to) {
            const defaultTo = range.max_date || todayStr;
            const defaultFrom = range.min_date || defaultTo;
            onRangeChange(defaultFrom, defaultTo);
          }
        }
      } catch (error) {
        console.error("Error fetching data range:", error);
      }
    };

    fetchUsers();
    fetchDataRange();
  }, []);

  // Validate range when from or to changes
  const handleFromChange = (newFrom: string) => {
    validateAndApply(newFrom, to);
  };

  const handleToChange = (newTo: string) => {
    validateAndApply(from, newTo);
  };

  const validateAndApply = (f: string, t: string) => {
    setValidationError(null);
    if (!f || !t) {
      onRangeChange(f, t);
      return;
    }

    const dFrom = new Date(f);
    const dTo = new Date(t);

    if (dFrom > dTo) {
      setValidationError("La fecha 'Desde' no puede ser posterior a 'Hasta'.");
      return;
    }

    const diffDays = Math.round((dTo.getTime() - dFrom.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 28) {
      setValidationError("El rango mínimo de evaluación debe ser de al menos 1 mes (30 días).");
      return;
    }

    if (diffDays > 365) {
      setValidationError("El rango máximo de evaluación es de 1 año (365 días).");
      return;
    }

    onRangeChange(f, t);
  };

  // Calculate total days in current range selection
  const totalSelectedDays = from && to
    ? Math.round((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Calculate exact overlap of gaps INSIDE the user's currently selected [from, to] range
  const relevantGapsInSelection = (dataRange?.gaps ?? [])
    .map((gap) => {
      if (!from || !to) return null;
      // Intersection of selected [from, to] and gap [gap.from, gap.to]
      const overlapStart = gap.from > from ? gap.from : from;
      const overlapEnd   = gap.to < to ? gap.to : to;

      if (overlapStart >= overlapEnd) return null;

      const overlapDays = Math.round(
        (new Date(overlapEnd).getTime() - new Date(overlapStart).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (overlapDays <= 20) return null; // Only flag if > 20 inactive days within the selection

      const isTrailing = gap.to >= todayStr || (dataRange?.max_date && gap.from >= dataRange.max_date);

      return {
        gapFrom: overlapStart,
        gapTo: overlapEnd,
        overlapDays,
        isTrailing,
        suggestedTo: gap.from < to ? gap.from : dataRange?.max_date || from,
      };
    })
    .filter(Boolean) as Array<{
      gapFrom: string;
      gapTo: string;
      overlapDays: number;
      isTrailing: boolean;
      suggestedTo: string;
    }>;

  return (
    <div className="space-y-4">
      {/* --- CARD 1: SELECCIÓN DE USUARIO Y FECHAS --- */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5 flex flex-col lg:flex-row gap-5 lg:items-center lg:justify-between">
        {/* User filter */}
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
              Usuario
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => onUserChange(e.target.value)}
              className="min-w-[240px] rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-800 outline-none focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition"
            >
              <option value="">Todos los usuarios</option>
              {loadingUsers ? (
                <option disabled>Cargando usuarios...</option>
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

        {/* Custom Date Range Picker with 2 Calendars */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 text-gray-700">
            <Calendar size={20} className="text-green-600 hidden sm:block" />
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Período de Evaluación:
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">Desde</label>
              <input
                type="date"
                value={from}
                max={to || todayStr}
                onChange={(e) => handleFromChange(e.target.value)}
                className="rounded-xl border border-gray-300 bg-gray-50 px-3.5 py-2 text-sm font-medium text-gray-800 outline-none focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition"
              />
            </div>

            <span className="text-gray-400 mt-5 font-bold">—</span>

            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">Hasta</label>
              <input
                type="date"
                value={to}
                max={todayStr}
                min={from}
                onChange={(e) => handleToChange(e.target.value)}
                className="rounded-xl border border-gray-300 bg-gray-50 px-3.5 py-2 text-sm font-medium text-gray-800 outline-none focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition"
              />
            </div>
          </div>
        </div>
      </div>

      {/* --- AVISOS Y ALERTAS (UBICADO DEBAJO DEL CARD DE FECHAS Y ARRIBA DE LOS CARDS DE COLORES) --- */}

      {/* Validation Error Banner */}
      {validationError && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm animate-fadeIn">
          <AlertTriangle size={20} className="shrink-0 text-red-500" />
          <span className="font-medium">{validationError}</span>
        </div>
      )}

      {/* Info Banner on Active Date Range */}
      {from && to && !validationError && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-900 shadow-sm">
          <div className="flex items-center gap-3">
            <Info size={20} className="shrink-0 text-emerald-600" />
            <div>
              <p className="font-semibold text-emerald-950">
                Rango Aplicado: <span className="font-bold">{formatDateStr(from)}</span> al <span className="font-bold">{formatDateStr(to)}</span> ({totalSelectedDays} días)
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Todas las métricas de tareas, evaluaciones y horas de sesión se parametrizaron exclusivamente para este período.
              </p>
            </div>
          </div>
          {dataRange?.max_date && (
            <span className="hidden md:inline-flex text-xs font-semibold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
              Datos disponibles: {formatDateStr(dataRange.min_date)} a {formatDateStr(dataRange.max_date)}
            </span>
          )}
        </div>
      )}

      {/* Gap / Inactivity Warning Banner — Only shown if the gap overlaps the SELECTED range */}
      {relevantGapsInSelection.map((gap, index) => (
        <div
          key={index}
          className="flex items-start gap-3.5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm"
        >
          <AlertTriangle size={22} className="shrink-0 text-amber-600 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-950 text-base">
              ⚠️ ¡Alerta de Inactividad en el Rango Seleccionado! ({gap.overlapDays} días sin datos)
            </p>
            <p className="text-xs leading-relaxed text-amber-800">
              Dentro del período seleccionado, entre el <strong className="underline">{formatDateTimeStr(gap.gapFrom)}</strong> y el <strong className="underline">{formatDateTimeStr(gap.gapTo)}</strong> ({gap.overlapDays} días) no existen registros de tareas, evaluaciones ni sesiones de trabajo.
            </p>
            <p className="text-xs font-medium text-amber-900">
              💡 <strong>Sugerencia:</strong> Se recomienda acotar la fecha &quot;Hasta&quot; al <strong>{formatDateTimeStr(gap.suggestedTo)}</strong> para evaluar únicamente el período con actividad real.
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}