import { AdminUser, AssignmentUser } from "@/app/types/types";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isStrongPassword(pw: string) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\.).{8,}$/.test(pw);
}

export const formatDateShort = (dateString: string) => {
  if (!dateString) return "";
  
  // Limpiamos comillas y extraemos solo la parte de la fecha: "2026-03-31"
  const cleanDate = dateString.replace(/"/g, '').split('T')[0];
  const [year, month, day] = cleanDate.split('-');

  return `${day}/${month}/${year}`;
};



export function extractGoogleFormId(url: string) {
  const regex = /\/d\/(?:e\/)?([a-zA-Z0-9_-]{40,})\//;
  const match = url.match(regex);
  return match ? match[1] : url;
}

export function normalizeDateInput(value: string) {
  if (!value) return "";
  if (value.includes("T")) {
    return value.replace(/"/g, "").split("T")[0];
  }
  return value;
}

export function buildAssignmentUsers(
  users: AdminUser[],
  assignedUsers: AdminUser[],
  selectedUserIds: string[]
): AssignmentUser[] {
  const assignedIds = new Set(assignedUsers.map((user) => user.id));

  return users.map((user) => ({
    ...user,
    assigned: assignedIds.has(user.id),
    selected: selectedUserIds.includes(user.id),
  }));
}