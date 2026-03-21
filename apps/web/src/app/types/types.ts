/**
 * DB TYPES & INTERFACES
 * Este archivo centraliza todas las definiciones para la base de datos y la API.
 */

// ==========================================
// SECTION: USUARIOS Y PRESENCIA
// ==========================================

export type UserRole = "user" | "admin";
export type UserStatus = "active" | "inactive";

export interface User {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  verified: boolean;
  created_at: string;
}

export interface UserPresence {
  user_id: string;
  status: UserStatus;
  last_login_at: string | null;
  last_seen_at: string | null;
  updated_at: string;
}

export interface UserWithMetrics extends User {
  status: UserStatus;
  last_login: string | null;
  last_seen: string | null;
  tasks_assigned: number;
  tasks_completed: number;
  productivity_score: number;
}

// ==========================================
// SECTION: TAREAS (TASKS)
// ==========================================

export type TaskType = "course" | "report" | "project";
export type TaskStatus = "pending" | "in-progress" | "completed";

export interface DashboardTaskResource {
  id: number;
  title: string;
  type: string;
  url: string;
}

export interface DashboardTask {
  id: string;
  template_id?: string;
  title: string;
  description: string;
  status: "pending" | "in-progress" | "completed";
  progress: number;
  assigned_date?: string | null;
  due_date?: string | null;
  completed_date?: string | null;
  details?: unknown;
  requirements?: unknown;
  assigned_by_name?: string | null;
  resources?: DashboardTaskResource[];
}

export interface DashboardTaskListItem {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in-progress" | "completed";
  progress: number;
  due_date?: string | null;
}

export interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  estimated_hours: number;
  requirements: any;
  created_by: string;
  created_by_name: string;
  created_at: string;
}

// ==========================================
// SECTION: SESIONES DE TRABAJO (WORK SESSIONS)
// ==========================================

export interface WorkSession {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  duration: number | null; // Segundos
  active: boolean;
  created_at: string;
}

// ==========================================
// SECTION: EVALUACIONES (EVALUATIONS)
// ==========================================

export type EvaluationType = "environment" | "performance" | "skills";
export type EvaluationStatus = "pending" | "completed" | "expired" | "active";

export interface Evaluation {
  id: string;
  template_id?: string;
  title: string;       // From JOIN Template
  description: string; // From JOIN Template
  type: EvaluationType;
  status: EvaluationStatus;
  assigned_date: string;
  due_date: string | null;
  completed_date: string | null;
  score: number | null;
  max_score: number | null;
  assigned_by: string;
  assigned_by_name: string;
  created_at: string;
}

export interface EvaluationTemplate {
  id: string;
  title: string;
  description: string;
  type: EvaluationType;
  status: EvaluationStatus;
  created_by: string;
  created_by_name: string;
  assigned_to: string[]; // IDs de usuarios (JSONB array)
  due_date: string | null;
  responses?: number;    // Computed count
  total_users?: number;  // Computed count
  created_at: string;
}

// ==========================================
// SECTION: MÉTRICAS Y ESTADÍSTICAS (STATS)
// ==========================================

export interface UserStats {
  pending_tasks: number;
  in_progress_tasks: number;
  completed_tasks: number;
  today_work_time: string; // Formato "Xh Ym"
  pending_evaluations: number;
  productivity_score: number;
}

export interface AdminStats {
  total_users: number;
  active_users: number;
  pending_tasks: number;
  completed_tasks: number;
  pending_evaluations: number;
  productivity_rate: number;
}

export interface ProductivityMetric {
  user_id: string;
  date: string; // YYYY-MM-DD
  tasks_completed: number;
  tasks_assigned: number;
  total_work_time: number;
  productivity_score: number;
  created_at: string;
}