"use client";

import { useEffect, useMemo } from "react";

import { BaseModal } from "../BaseModal";
import { AssignmentUser } from "@/app/types/types";
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
            className="text-white font-bold px-4 py-2 bg-black hover:!bg-gray-500 rounded-lg"
          >
            Cerrar
          </button>

          <button
            onClick={onAssign}
            disabled={submitting || selectedUserIds.length === 0}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50"
          >
            {submitting ? "Asignando..." : "Asignar seleccionados"}
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase">Fecha Límite</label>
          <input
            type="date"
            min={new Date().toISOString().split("T")[0]}
            value={assignDueDate}
            onChange={(e) => onDueDateChange(e.target.value)}
            className="w-full border rounded-lg p-2 mt-1 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {isLoading ? (
          <p className="p-4 text-center text-xs">Cargando...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase">
                Usuarios asignados ({assignedUsers.length})
              </label>

              <div className="border rounded-lg mt-1 h-72 overflow-y-auto divide-y">
                {assignedUsers.length === 0 ? (
                  <p className="p-4 text-center text-xs text-gray-400">
                    No hay usuarios asignados
                  </p>
                ) : (
                  assignedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between gap-3 p-3 hover:bg-indigo-50 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-bold text-gray-800">{user.name}</p>
                        <p className="text-[10px] text-gray-500">{user.email}</p>
                      </div>

                      <button
                        onClick={() => onUnassign(user.id)}
                        className="text-red-600 text-xs font-bold hover:underline"
                      >
                        Desasignar
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase">
                Seleccionar usuarios ({selectedUserIds.length})
              </label>

              <div className="border rounded-lg mt-1 h-72 overflow-y-auto divide-y">
                {availableUsers.length === 0 ? (
                  <p className="p-4 text-center text-xs text-gray-400">
                    No hay usuarios disponibles
                  </p>
                ) : (
                  availableUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => onToggleUser(user.id)}
                      className="flex items-center gap-3 p-3 hover:bg-indigo-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={user.selected}
                        readOnly
                        className="rounded border-gray-300 text-indigo-600"
                      />

                      <div>
                        <p className="text-sm font-bold text-gray-800">{user.name}</p>
                        <p className="text-[10px] text-gray-500">{user.email}</p>
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