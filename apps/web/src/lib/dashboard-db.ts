import "server-only";
import { sql } from "./db";
import { AdminStats, DashboardTask, UserStats, UserWithMetrics } from "@/app/types/types";

// --- TYPES ---
// (Mantenemos tus tipos igual, omitidos aquí por brevedad para ir a la lógica)

export const dashboardDb = {
  // ==========================================
  // SECTION: USER STATS & TASKS
  // ==========================================
  
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

    const stats = rows[0] || {
      pending_tasks: 0, in_progress_tasks: 0, completed_tasks: 0,
      today_work_seconds: 0, pending_evaluations: 0, productivity_score: 0
    };

    const hours = Math.floor(stats.today_work_seconds / 3600);
    const minutes = Math.floor((stats.today_work_seconds % 3600) / 60);

    return {
      pending_tasks: stats.pending_tasks,
      in_progress_tasks: stats.in_progress_tasks,
      completed_tasks: stats.completed_tasks,
      today_work_time: `${hours}h ${minutes}m`,
      pending_evaluations: stats.pending_evaluations,
      productivity_score: stats.productivity_score
    };
  },

  async getUserTasks(userId: string): Promise<DashboardTask[]> {
    return await sql<DashboardTask>`
      SELECT t.*, u.name as assigned_by_name
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assigned_by
      WHERE t.user_id = ${userId}
      ORDER BY 
        CASE t.status WHEN 'in-progress' THEN 1 WHEN 'pending' THEN 2 ELSE 3 END,
        t.due_date ASC, t.created_at DESC
    `;
  },

  async updateTaskStatus(taskId: string, status: string): Promise<void> {
    await sql`
      UPDATE tasks 
      SET status = ${status}, 
          updated_at = CURRENT_TIMESTAMP,
          ${status === 'completed' ? sql`completed_date = CURRENT_TIMESTAMP, progress = 100` : sql`progress = progress`}
      WHERE id = ${taskId}
    `;
  },

  // ==========================================
  // SECTION: WORK SESSIONS
  // ==========================================

  async startWorkSession(userId: string): Promise<string> {
    const rows = await sql<{ id: string }>`
      INSERT INTO work_sessions (user_id, start_time, active)
      VALUES (${userId}, CURRENT_TIMESTAMP, true) RETURNING id
    `;
    return rows[0].id;
  },

  async endWorkSession(sessionId: string): Promise<void> {
    await sql`
      UPDATE work_sessions 
      SET end_time = CURRENT_TIMESTAMP,
          duration = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - start_time)),
          active = false
      WHERE id = ${sessionId}
    `;
  },

  async getAllUsers(): Promise<any[]> {
    const rows = await sql<any>`
      SELECT 
        id, 
        name,
        email, 
        role, 
        verified, 
        created_at
      FROM users 
      ORDER BY created_at DESC
    `;
    return rows;
  },

  // ==========================================
  // SECTION: ADMIN & METRICS (AJUSTADA)
  // ==========================================

  async getAdminStats(): Promise<AdminStats> {
    const rows = await sql<any>`
      SELECT
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(DISTINCT user_id) FROM work_sessions WHERE start_time >= NOW() - INTERVAL '7 days') as active_users,
        (SELECT COUNT(*) FROM tasks WHERE status = 'pending') as pending_tasks,
        (SELECT COUNT(*) FROM tasks WHERE status = 'completed') as completed_tasks,
        (SELECT COUNT(*) FROM evaluations WHERE status = 'pending') as pending_evaluations,
        COALESCE((SELECT AVG(productivity_score) FROM productivity_metrics WHERE date = CURRENT_DATE), 0) as avg_rate
    `;
    const s = rows[0];
    return {
      total_users: Number(s.total_users),
      active_users: Number(s.active_users),
      pending_tasks: Number(s.pending_tasks),
      completed_tasks: Number(s.completed_tasks),
      pending_evaluations: Number(s.pending_evaluations),
      productivity_rate: Math.round(s.avg_rate),
    };
  },

  /**
   * ESTA ES LA FUNCIÓN QUE CAUSABA EL 500
   * Ajustada para que coincida con formatUser de tu API
   */
  async getUsersWithMetrics(): Promise<UserWithMetrics[]> {
    const rows = await sql<any>`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.created_at,
        COUNT(t.id) as tasks_assigned,
        COUNT(t.id) FILTER (WHERE t.status = 'completed') as tasks_completed,
        COALESCE((
          SELECT pm.productivity_score 
          FROM productivity_metrics pm 
          WHERE pm.user_id = u.id AND pm.date = CURRENT_DATE 
          ORDER BY pm.created_at DESC LIMIT 1
        ), 0) as productivity_score
      FROM users u
      LEFT JOIN tasks t ON t.user_id = u.id
      WHERE u.role = 'user'
      GROUP BY u.id, u.name, u.email, u.role, u.created_at
      ORDER BY u.created_at DESC
    `;
    return rows;
  },

  // ==========================================
  // SECTION: TEMPLATES & ASSIGNMENTS
  // ==========================================

  async assignTask(task: any) {
    const rows = await sql<{ id: string }>`
      INSERT INTO tasks (template_id, user_id, assigned_by, title, description, due_date, details)
      VALUES (${task.templateId}, ${task.userId}, ${task.assignedBy}, ${task.title}, ${task.description}, ${task.dueDate}, ${task.details})
      RETURNING id
    `;
    return rows[0].id;
  },

  async updateProductivityMetric(metric: any) {
    await sql`
      INSERT INTO productivity_metrics (user_id, date, tasks_completed, tasks_assigned, total_work_time, productivity_score)
      VALUES (${metric.userId}, ${metric.date}, ${metric.tasksCompleted}, ${metric.tasksAssigned}, ${metric.totalWorkTime}, ${metric.productivityScore})
      ON CONFLICT (user_id, date) DO UPDATE SET
        tasks_completed = EXCLUDED.tasks_completed,
        tasks_assigned = EXCLUDED.tasks_assigned,
        productivity_score = EXCLUDED.productivity_score,
        created_at = CURRENT_TIMESTAMP
    `;
  }
};