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

export type TaskType = "course" | "report" | "project";
export type TaskStatus = "pending" | "in-progress" | "completed";

export interface DashboardTaskResource {
  id: string;
  title: string;
  type: string;
  url: string;
}

export interface DashboardTask {
  id: string;
  template_id?: string;
  title: string;
  description: string;
  status: TaskStatus;
  progress: number;
  assigned_date?: string | null;
  due_date?: string | null;
  completed_date?: string | null;
  training_line_id?: string | null;
  details?: unknown;
  requirements?: unknown;
  assigned_by_name?: string | null;
  resources?: DashboardTaskResource[];
}

export interface DashboardTaskListItem {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  progress: number;
  due_date?: string | null;
}

export interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  estimated_hours: number;
  requirements: string[];
  created_by: string;
  created_by_name: string;
  created_at: string;
}

export type EvaluationType = "environment" | "performance" | "skills";
export type EvaluationTemplateStatus = "draft" | "active" | "completed";
export type EvaluationAssignmentStatus = "pending" | "in_progress" | "completed" | "expired";

export interface Evaluation {
  id: string;
  template_id?: string;
  title: string;
  description: string;
  type: EvaluationType;
  status: EvaluationAssignmentStatus;
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
  status: EvaluationTemplateStatus;
  created_by: string;
  created_by_name: string;
  assigned_to: string[];
  due_date: string | null;
  responses?: number;
  total_users?: number;
  created_at: string;
}

export interface UserStats {
  pending_tasks: number;
  in_progress_tasks: number;
  completed_tasks: number;
  today_work_time: string;
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
  date: string;
  tasks_completed: number;
  tasks_assigned: number;
  total_work_time: number;
  productivity_score: number;
  created_at: string;
}

export type Mode = "true" | "false";

export interface EvaluationTemplateItem {
  id: string;
  title: string;
  description: string;
  type: EvaluationType;
  status: EvaluationTemplateStatus;
  createdDate: string;
  dueDate: string | null;
  assignedUsers: number;
  responses: number;
  completionRate: number;
  online: boolean;
}

export interface EvaluationResultRow {
  id: string;
  userId: string;
  name: string;
  email: string;
  status: EvaluationAssignmentStatus;
  dueDate: string | null;
  completedDate: string | null;
  score: number | null;
  maxScore: number | null;
  passingScorePct: number;
  responses: Record<string, string | string[]> | null;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
}

export interface NewEvaluationFormData {
  title: string;
  description: string;
  type: EvaluationType;
  dueDate: string;
  google_form_id: string;
  online: boolean;
  max_score: number;
  passing_score_pct: number;
}

export interface AssignmentUser extends AdminUser {
  assigned: boolean;
  selected: boolean;
}
