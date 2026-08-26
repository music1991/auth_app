"use client";

import { useEffect, useMemo } from "react";

import { BaseModal } from "@/components/shared/BaseModal";
import { AssignmentUser } from "@/types";
import { normalizeDateInput } from "@/lib/utils";

interface ManageAssignmentsModalProps {
  open: boolean;
  users: AssignmentUser[];
  usersLoading: boolean;
  assignedLoading: boolean;
  selectedUserIds: string[];
  assignDueDate: string;
  submitting: boolean;
  onClose: () => void;
  onToggleUser: (id: string) => void;
  onDueDateChange: (value: string) => void;
  onAssign: () => void;
  onUnassign: (id: string) => void;
}

export function ManageAssignmentsModal({
  open,
  users,
  usersLoading,
  assignedLoading,
  selectedUserIds,
  assignDueDate,
  submitting,
  onClose,
  onToggleUser,
  onDueDateChange,
  onAssign,
  onUnassign,
}: ManageAssignmentsModalProps) {
  useEffect(() => {
    const normalized = normalizeDateInput(assignDueDate);
    if (normalized !== assignDueDate) {
      onDueDateChange(normalized);
    }
  }, [assignDueDate, onDueDateChange]);

  const assignedUsers = useMemo(
    () => users.filter((user) => user.assigned),
    [users]
  );

  const availableUsers = useMemo(
    () => users.filter((user) => !user.assigned),
    [users]
  );

  const isLoading = usersLoading || assignedLoading;

  return (
    <BaseModal
      open={open}
      title="Gestionar Asignaciones"
      maxWidthClass="max-w-3xl"
      footer={
        <>
          <button
            onClick={onClose}
            className="text-foreground font-medium px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm transition-colors"
          >
            Cerrar
          </button>

          <button
            onClick={onAssign}
            disabled={submitting || selectedUserIds.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-semibold text-sm disabled:opacity-50 shadow-sm transition-colors"
          >
            {submitting ? "Asignando..." : "Asignar seleccionados"}
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Fecha Límite</label>
          <input
            type="date"
            min={new Date().toISOString().split("T")[0]}
            value={assignDueDate}
            onChange={(e) => onDueDateChange(e.target.value)}
            className="w-full border border-input bg-background text-foreground rounded-lg p-2.5 mt-1 outline-none focus:ring-2 focus:ring-ring text-sm"
          />
        </div>

        {isLoading ? (
          <p className="p-4 text-center text-xs text-muted-foreground">Cargando...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Usuarios asignados ({assignedUsers.length})
              </label>

              <div className="border border-border rounded-lg mt-1.5 h-72 overflow-y-auto divide-y divide-border bg-background">
                {assignedUsers.length === 0 ? (
                  <p className="p-4 text-center text-xs text-muted-foreground">
                    No hay usuarios asignados
                  </p>
                ) : (
                  assignedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between gap-3 p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">{user.name}</p>
                        <p className="text-[11px] text-muted-foreground">{user.email}</p>
                      </div>

                      <button
                        onClick={() => onUnassign(user.id)}
                        className="text-red-500 hover:text-red-600 text-xs font-semibold hover:underline"
                      >
                        Desasignar
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Seleccionar usuarios ({selectedUserIds.length})
              </label>

              <div className="border border-border rounded-lg mt-1.5 h-72 overflow-y-auto divide-y divide-border bg-background">
                {availableUsers.length === 0 ? (
                  <p className="p-4 text-center text-xs text-muted-foreground">
                    No hay usuarios disponibles
                  </p>
                ) : (
                  availableUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => onToggleUser(user.id)}
                      className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={user.selected}
                        readOnly
                        className="rounded border-input text-green-600 focus:ring-ring"
                      />

                      <div>
                        <p className="text-sm font-semibold text-foreground">{user.name}</p>
                        <p className="text-[11px] text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
}