import "server-only";
import { sql } from "./db";

// =============================================
// TIPOS PARA EL DASHBOARD
// =============================================

export type DashboardTask = {
  id: string;
  title: string;
  description: string;
  type: "course" | "report" | "project";
  status: "pending" | "in-progress" | "completed";
  assigned_by: string;
  assigned_by_name: string;
  assigned_date: string;
  due_date: string | null;
  progress: number;
  details: any;
  created_at: string;
  updated_at: string;
};

export type WorkSession = {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  duration: number | null;
  active: boolean;
  created_at: string;
};

export type Evaluation = {
  id: string;
  title: string;
  description: string;
  type: "environment" | "performance" | "skills";
  status: "pending" | "completed" | "expired";
  assigned_date: string;
  due_date: string | null;
  completed_date: string | null;
  score: number | null;
  max_score: number | null;
  assigned_by: string;
  assigned_by_name: string;
  created_at: string;
};

export type UserStats = {
  pending_tasks: number;
  in_progress_tasks: number;
  completed_tasks: number;
  today_work_time: string;
  pending_evaluations: number;
  productivity_score: number;
};

export type AdminStats = {
  total_users: number;
  active_users: number;
  pending_tasks: number;
  completed_tasks: number;
  pending_evaluations: number;
  productivity_rate: number;
};

export type TaskTemplate = {
  id: string;
  title: string;
  description: string;
  type: "course" | "report" | "project";
  estimated_hours: number;
  requirements: any;
  created_by: string;
  created_by_name: string;
  created_at: string;
};

export type UserWithMetrics = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  status: string;
  last_login: string | null;
  tasks_assigned: number;
  tasks_completed: number;
  productivity_score: number;
};

// =============================================
// CONSULTAS PARA USUARIO
// =============================================

export const dashboardDb = {
  // ========== ESTADÍSTICAS DE USUARIO ==========
  async getUserStats(userId: string): Promise<UserStats> {
    const rows = await sql<{
      pending_tasks: number;
      in_progress_tasks: number;
      completed_tasks: number;
      today_work_seconds: number;
      pending_evaluations: number;
      productivity_score: number;
    }>`
      SELECT 
        COUNT(t.id) FILTER (WHERE t.status = 'pending') as pending_tasks,
        COUNT(t.id) FILTER (WHERE t.status = 'in-progress') as in_progress_tasks,
        COUNT(t.id) FILTER (WHERE t.status = 'completed') as completed_tasks,
        COALESCE((
          SELECT SUM(duration) 
          FROM work_sessions ws 
          WHERE ws.user_id = ${userId} AND DATE(ws.start_time) = CURRENT_DATE
        ), 0) as today_work_seconds,
        COUNT(e.id) FILTER (WHERE e.status = 'pending') as pending_evaluations,
        COALESCE((
          SELECT productivity_score 
          FROM productivity_metrics pm 
          WHERE pm.user_id = ${userId} AND pm.date = CURRENT_DATE 
          ORDER BY created_at DESC LIMIT 1
        ), 0) as productivity_score
      FROM users u
      LEFT JOIN tasks t ON t.user_id = u.id
      LEFT JOIN evaluations e ON e.user_id = u.id
      WHERE u.id = ${userId}
      GROUP BY u.id
    `;

    const stats = rows[0];
    if (!stats) {
      return {
        pending_tasks: 0,
        in_progress_tasks: 0,
        completed_tasks: 0,
        today_work_time: "0h 0m",
        pending_evaluations: 0,
        productivity_score: 0
      };
    }

    // Convertir segundos a formato horas:minutos
    const hours = Math.floor(stats.today_work_seconds / 3600);
    const minutes = Math.floor((stats.today_work_seconds % 3600) / 60);
    const todayWorkTime = `${hours}h ${minutes}m`;

    return {
      pending_tasks: stats.pending_tasks,
      in_progress_tasks: stats.in_progress_tasks,
      completed_tasks: stats.completed_tasks,
      today_work_time: todayWorkTime,
      pending_evaluations: stats.pending_evaluations,
      productivity_score: stats.productivity_score
    };
  },

  // ========== TAREAS DEL USUARIO ==========
  async getUserTasks(userId: string): Promise<DashboardTask[]> {
    const rows = await sql<DashboardTask>`
      SELECT 
        t.id,
        t.title,
        t.description,
        t.type,
        t.status,
        t.assigned_by,
        u.name as assigned_by_name,
        t.assigned_date,
        t.due_date,
        t.progress,
        t.details,
        t.created_at,
        t.updated_at
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assigned_by
      WHERE t.user_id = ${userId}
      ORDER BY 
        CASE 
          WHEN t.status = 'in-progress' THEN 1
          WHEN t.status = 'pending' THEN 2
          ELSE 3
        END,
        t.due_date ASC,
        t.created_at DESC
    `;
    return rows;
  },

  async updateTaskStatus(taskId: string, status: "pending" | "in-progress" | "completed"): Promise<void> {
    await sql`
      UPDATE tasks 
      SET status = ${status}, 
          updated_at = CURRENT_TIMESTAMP,
          ${status === 'completed' ? sql`completed_date = CURRENT_TIMESTAMP, progress = 100` : sql`progress = progress`}
      WHERE id = ${taskId}
    `;
  },

  async updateTaskProgress(taskId: string, progress: number): Promise<void> {
    await sql`
      UPDATE tasks 
      SET progress = ${progress}, 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${taskId}
    `;
  },

  // ========== SESIONES DE TRABAJO ==========
  async getWorkSessions(userId: string, limit: number = 10): Promise<WorkSession[]> {
    const rows = await sql<WorkSession>`
      SELECT 
        id,
        user_id,
        start_time,
        end_time,
        duration,
        active,
        created_at
      FROM work_sessions 
      WHERE user_id = ${userId}
      ORDER BY start_time DESC
      LIMIT ${limit}
    `;
    return rows;
  },

  async getActiveWorkSession(userId: string): Promise<WorkSession | null> {
    const rows = await sql<WorkSession>`
      SELECT 
        id,
        user_id,
        start_time,
        end_time,
        duration,
        active,
        created_at
      FROM work_sessions 
      WHERE user_id = ${userId} AND active = true
      ORDER BY start_time DESC
      LIMIT 1
    `;
    return rows[0] ?? null;
  },

  async startWorkSession(userId: string): Promise<string> {
    const rows = await sql<{ id: string }>`
      INSERT INTO work_sessions (user_id, start_time, active)
      VALUES (${userId}, CURRENT_TIMESTAMP, true)
      RETURNING id
    `;
    return rows[0].id;
  },

  async endWorkSession(sessionId: string): Promise<void> {
    await sql`
      UPDATE work_sessions 
      SET 
        end_time = CURRENT_TIMESTAMP,
        duration = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - start_time)),
        active = false
      WHERE id = ${sessionId}
    `;
  },

  // ========== EVALUACIONES DEL USUARIO ==========
  async getUserEvaluations(userId: string): Promise<Evaluation[]> {
    const rows = await sql<Evaluation>`
      SELECT 
        e.id,
        et.title,
        et.description,
        et.type,
        e.status,
        e.assigned_date,
        e.due_date,
        e.completed_date,
        e.score,
        e.max_score,
        e.assigned_by,
        u.name as assigned_by_name,
        e.created_at
      FROM evaluations e
      LEFT JOIN evaluation_templates et ON et.id = e.template_id
      LEFT JOIN users u ON u.id = e.assigned_by
      WHERE e.user_id = ${userId}
      ORDER BY 
        CASE 
          WHEN e.status = 'pending' THEN 1
          ELSE 2
        END,
        e.due_date ASC
    `;
    return rows;
  },

  // =============================================
  // CONSULTAS PARA ADMINISTRADOR
  // =============================================

  // ========== ESTADÍSTICAS DE ADMIN ==========
  async getAdminStats(): Promise<AdminStats> {
  const rows = await sql<{
    total_users: number;
    active_users: number;
    pending_tasks: number;
    completed_tasks: number;
    pending_evaluations: number;
    avg_productivity_rate: number;
  }>`
    SELECT
      (SELECT COUNT(*) FROM users) as total_users,

      -- "activos" sin depender de users.status/last_login:
      -- usuarios con sesión activa hoy o en los últimos 7 días (ajusta si quieres)
      (SELECT COUNT(DISTINCT ws.user_id)
       FROM work_sessions ws
       WHERE ws.start_time >= NOW() - INTERVAL '7 days'
      ) as active_users,

      (SELECT COUNT(*) FROM tasks WHERE status = 'pending') as pending_tasks,
      (SELECT COUNT(*) FROM tasks WHERE status = 'completed') as completed_tasks,
      (SELECT COUNT(*) FROM evaluations WHERE status = 'pending') as pending_evaluations,

      COALESCE((
        SELECT AVG(pm.productivity_score)
        FROM productivity_metrics pm
        WHERE pm.date = CURRENT_DATE
      ), 0) as avg_productivity_rate
  `;

  const s = rows[0];

  return {
    total_users: s?.total_users ?? 0,
    active_users: s?.active_users ?? 0,
    pending_tasks: s?.pending_tasks ?? 0,
    completed_tasks: s?.completed_tasks ?? 0,
    pending_evaluations: s?.pending_evaluations ?? 0,
    productivity_rate: Math.round(s?.avg_productivity_rate ?? 0),
  };
},

  // ========== GESTIÓN DE USUARIOS ==========
  async getUsersWithMetrics(): Promise<UserWithMetrics[]> {
    const rows = await sql<UserWithMetrics & {
      last_login: string;
      tasks_assigned: number;
      tasks_completed: number;
      current_productivity_score: number;
    }>`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.status,
        u.last_login,
        COUNT(t.id) as tasks_assigned,
        COUNT(t.id) FILTER (WHERE t.status = 'completed') as tasks_completed,
        COALESCE((
          SELECT productivity_score 
          FROM productivity_metrics pm 
          WHERE pm.user_id = u.id AND pm.date = CURRENT_DATE 
          ORDER BY created_at DESC LIMIT 1
        ), 0) as productivity_score
      FROM users u
      LEFT JOIN tasks t ON t.user_id = u.id
      WHERE u.role = 'user'
      GROUP BY u.id, u.name, u.email, u.role, u.status, u.last_login
      ORDER BY u.created_at DESC
    `;
    return rows;
  },

  async updateUserRole(userId: string, role: "user" | "admin"): Promise<void> {
    await sql`
      UPDATE users 
      SET role = ${role}
      WHERE id = ${userId}
    `;
  },

  async updateUserStatus(userId: string, status: "active" | "inactive"): Promise<void> {
    await sql`
      UPDATE users 
      SET status = ${status}
      WHERE id = ${userId}
    `;
  },

  // ========== PLANTILLAS DE TAREAS ==========
  async getTaskTemplates(): Promise<TaskTemplate[]> {
    const rows = await sql<TaskTemplate>`
      SELECT 
        tt.id,
        tt.title,
        tt.description,
        tt.type,
        tt.estimated_hours,
        tt.requirements,
        tt.created_by,
        u.name as created_by_name,
        tt.created_at
      FROM task_templates tt
      LEFT JOIN users u ON u.id = tt.created_by
      ORDER BY tt.created_at DESC
    `;
    return rows;
  },

  async createTaskTemplate(template: {
    title: string;
    description: string;
    type: "course" | "report" | "project";
    estimatedHours: number;
    requirements: any;
    createdBy: string;
  }): Promise<string> {
    const rows = await sql<{ id: string }>`
      INSERT INTO task_templates (title, description, type, estimated_hours, requirements, created_by)
      VALUES (${template.title}, ${template.description}, ${template.type}, ${template.estimatedHours}, ${template.requirements}, ${template.createdBy})
      RETURNING id
    `;
    return rows[0].id;
  },

  // ========== ASIGNACIÓN DE TAREAS ==========
  async assignTask(task: {
    templateId: string;
    userId: string;
    assignedBy: string;
    title: string;
    description: string;
    dueDate?: string;
    details?: any;
  }): Promise<string> {
    const rows = await sql<{ id: string }>`
      INSERT INTO tasks (template_id, user_id, assigned_by, title, description, due_date, details)
      VALUES (${task.templateId}, ${task.userId}, ${task.assignedBy}, ${task.title}, ${task.description}, ${task.dueDate}, ${task.details})
      RETURNING id
    `;
    return rows[0].id;
  },

  // ========== GESTIÓN DE EVALUACIONES ==========
  async getEvaluationTemplates(): Promise<any[]> {
    const rows = await sql<{
      id: string;
      title: string;
      description: string;
      type: string;
      status: string;
      created_by: string;
      created_by_name: string;
      assigned_to: any;
      due_date: string | null;
      responses: number;
      total_users: number;
      created_at: string;
    }>`
      SELECT 
        et.id,
        et.title,
        et.description,
        et.type,
        et.status,
        et.created_by,
        u.name as created_by_name,
        et.assigned_to,
        et.due_date,
        COUNT(e.id) FILTER (WHERE e.id IS NOT NULL) as responses,
        COALESCE(json_array_length(et.assigned_to), 0) as total_users,
        et.created_at
      FROM evaluation_templates et
      LEFT JOIN users u ON u.id = et.created_by
      LEFT JOIN evaluations e ON e.template_id = et.id AND e.status = 'completed'
      GROUP BY et.id, u.name
      ORDER BY et.created_at DESC
    `;
    return rows;
  },

  async createEvaluationTemplate(template: {
    title: string;
    description: string;
    type: "environment" | "performance" | "skills";
    createdBy: string;
    dueDate?: string;
  }): Promise<string> {
    const rows = await sql<{ id: string }>`
      INSERT INTO evaluation_templates (title, description, type, created_by, due_date)
      VALUES (${template.title}, ${template.description}, ${template.type}, ${template.createdBy}, ${template.dueDate})
      RETURNING id
    `;
    return rows[0].id;
  },

  async assignEvaluation(evaluation: {
    templateId: string;
    userId: string;
    assignedBy: string;
    dueDate?: string;
  }): Promise<string> {
    const rows = await sql<{ id: string }>`
      INSERT INTO evaluations (template_id, user_id, assigned_by, due_date)
      VALUES (${evaluation.templateId}, ${evaluation.userId}, ${evaluation.assignedBy}, ${evaluation.dueDate})
      RETURNING id
    `;
    return rows[0].id;
  },

  async publishEvaluation(templateId: string): Promise<void> {
    await sql`
      UPDATE evaluation_templates 
      SET status = 'active'
      WHERE id = ${templateId}
    `;
  },

  // ========== MÉTRICAS DE PRODUCTIVIDAD ==========
  async updateProductivityMetric(metric: {
    userId: string;
    date: string;
    tasksCompleted: number;
    tasksAssigned: number;
    totalWorkTime: number;
    productivityScore: number;
  }): Promise<void> {
    await sql`
      INSERT INTO productivity_metrics (user_id, date, tasks_completed, tasks_assigned, total_work_time, productivity_score)
      VALUES (${metric.userId}, ${metric.date}, ${metric.tasksCompleted}, ${metric.tasksAssigned}, ${metric.totalWorkTime}, ${metric.productivityScore})
      ON CONFLICT (user_id, date) 
      DO UPDATE SET
        tasks_completed = EXCLUDED.tasks_completed,
        tasks_assigned = EXCLUDED.tasks_assigned,
        total_work_time = EXCLUDED.total_work_time,
        productivity_score = EXCLUDED.productivity_score,
        created_at = CURRENT_TIMESTAMP
    `;
  }
};