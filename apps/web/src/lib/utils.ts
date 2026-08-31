import { AdminUser, AssignmentUser } from "@/types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isStrongPassword(pw: string) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\.).{8,}$/.test(pw);
}

export function formatDateShort(dateString?: string | null): string {
  if (!dateString) return "—";
  const clean = dateString.replace(/"/g, "").split("T")[0];
  const [year, month, day] = clean.split("-");
  return `${day}/${month}/${year}`;
}

export function extractGoogleFormId(url: string): string {
  const regex = /\/d\/(?:e\/)?([a-zA-Z0-9_-]{40,})\//;
  const match = url.match(regex);
  return match ? match[1] : url;
}

export function isEvaluationExpired(dueDate?: string | null): boolean {
  if (!dueDate) return false;
  const due = new Date(dueDate.replace(/"/g, "").trim());
  if (isNaN(due.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return today > due;
}

export function normalizeDateInput(value: string): string {
  if (!value) return "";
  if (value.includes("T")) return value.replace(/"/g, "").split("T")[0];
  return value;
}

export function normalizeUrl(url?: string): string {
  if (!url) return "#";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

export function getResourceTypeLabel(type?: string): string {
  switch (type?.toLowerCase()) {
    case "pdf":    return "PDF";
    case "link":   return "Link";
    case "video":  return "Video";
    case "doc":
    case "document": return "Documento";
    default: return type ?? "Recurso";
  }
}

export function buildAssignmentUsers(
  users: AdminUser[],
  assignedUsers: AdminUser[],
  selectedUserIds: string[]
): AssignmentUser[] {
  const assignedIds = new Set(assignedUsers.map((u) => u.id));
  return users.map((u) => ({
    ...u,
    assigned: assignedIds.has(u.id),
    selected: selectedUserIds.includes(u.id),
  }));
}
