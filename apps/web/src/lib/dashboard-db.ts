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

/*   async assignTask(task: any) {
    const rows = await sql<{ id: string }>`
      INSERT INTO tasks (template_id, user_id, assigned_by, title, description, due_date, details)
      VALUES (${task.templateId}, ${task.userId}, ${task.assignedBy}, ${task.title}, ${task.description}, ${task.dueDate}, ${task.details})
      RETURNING id
    `;
    return rows[0].id;
  }, */

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
  },

async updateUserAvatar(userId: string, buffer: Buffer, mimeType: string) {
  const rows = await sql`
    INSERT INTO data_user (user_id, first_name, last_name, avatar_blob, avatar_mime)
    VALUES (${userId}, '', '', ${buffer}, ${mimeType}) -- Verifica que mimeType no sea null aquí
    ON CONFLICT (user_id) DO UPDATE SET
      avatar_blob = EXCLUDED.avatar_blob,
      avatar_mime = EXCLUDED.avatar_mime,
      updated_at  = now()
  `;
  return rows[0]; 
},

   async deleteUserAvatar(userId: string) {

    await sql`
      UPDATE data_user 
      SET 
        avatar_blob = NULL, 
        avatar_mime = NULL,
        updated_at = NOW()
      WHERE user_id = ${userId}
    `;
    return { success: true };
},
async getUserAvatar(userId: string) {
  const rows = await sql<{ avatar_blob: Uint8Array | null; avatar_mime: string | null }>`
    SELECT avatar_blob, avatar_mime 
    FROM data_user 
    WHERE user_id = ${userId} 
    LIMIT 1
  `;
  
  // Si no hay filas, devolvemos null explícitamente
  return rows.length > 0 ? rows[0] : null;
},

  // ==========================================
  // SECTION: TEMPLATES & ASSIGNMENTS
  // ==========================================

  async getTaskTemplates() {
    const rows = await sql<{
      id: string;
      title: string;
      description: string;
      type: string;
      estimated_hours: number;
      requirements: string[] | null;
      created_by: string;
      created_at: string;
      updated_at: string;
    }>`
      SELECT
        id,
        title,
        description,
        type,
        estimated_hours,
        requirements,
        created_by,
        created_at,
        updated_at
      FROM task_templates
      ORDER BY created_at DESC
    `;

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      type: row.type,
      estimatedHours: row.estimated_hours,
      requirements: row.requirements ?? [],
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  async createTaskTemplate(template: {
    title: string;
    description: string;
    type: string;
    estimatedHours: number;
    requirements: string[];
    createdBy: string;
  }) {
    const rows = await sql<{ id: string }>`
      INSERT INTO task_templates (
        title,
        description,
        type,
        estimated_hours,
        requirements,
        created_by
      )
     VALUES (
      ${template.title},
      ${template.description},
      ${template.type},
      ${template.estimatedHours},
      ${JSON.stringify(template.requirements)},
      ${template.createdBy}
    )
      RETURNING id
    `;

    return rows[0].id;
  },

  async updateTaskTemplate(
    templateId: string,
    template: {
      title: string;
      description: string;
      type: string;
      estimatedHours: number;
      requirements: string[];
    }
  ) {
    await sql`
      UPDATE task_templates
      SET
        title = ${template.title},
        description = ${template.description},
        type = ${template.type},
        estimated_hours = ${template.estimatedHours},
        requirements = ${template.requirements},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${templateId}
    `;
  },

  async deleteTaskTemplate(templateId: string) {
    await sql`
      DELETE FROM task_templates
      WHERE id = ${templateId}
    `;
  },

 async assignTask(task: {
  templateId: string;
  userId: string;
  assignedBy: string;
  title: string;
  description: string;
  dueDate: string;
  details?: any;
}) {
  const rows = await sql<{ id: string }>`
    INSERT INTO tasks (
      template_id,
      user_id,
      assigned_by,
      title,
      description,
      status,
      progress,
      assigned_date,
      due_date,
      details
    )
    VALUES (
      ${task.templateId},
      ${task.userId},
      ${task.assignedBy},
      ${task.title},
      ${task.description},
      'pending',
      0,
      CURRENT_TIMESTAMP,
      ${task.dueDate},
      ${JSON.stringify(task.details ?? {})}
    )
    RETURNING id
  `;

  return rows[0].id;
},

async getAssignedTasksForAdmin() {
  const rows = await sql<{
    id: string;
    template_id: string;
    user_id: string;
    user_name: string;
    assigned_date: string;
    due_date: string;
    status: "pending" | "in-progress" | "completed";
    progress: number;
    details: string | null;
  }>`
    SELECT
      t.id,
      t.template_id,
      t.user_id,
      u.name as user_name,
      t.assigned_date,
      t.due_date,
      t.status,
      COALESCE(t.progress, 0) as progress,
      t.details
    FROM tasks t
    LEFT JOIN users u ON u.id = t.user_id
    ORDER BY u.name ASC, t.assigned_date DESC, t.created_at DESC
  `;

  return rows.map((row) => {
    let parsedDetails: any = {};

    if (row.details) {
      try {
        parsedDetails =
          typeof row.details === "string" ? JSON.parse(row.details) : row.details;
      } catch {
        parsedDetails = {};
      }
    }

    return {
      id: row.id,
      templateId: row.template_id,
      userId: row.user_id,
      userName: row.user_name ?? "Usuario",
      assignedDate: row.assigned_date,
      dueDate: row.due_date,
      status: row.status,
      progress: Number(row.progress ?? 0),
      instructions: parsedDetails.instructions ?? "",
    };
  });
},

async getTaskById(taskId: string) {
  const rows = await sql<{
    id: string;
    user_id: string;
    status: string;
    progress: number;
    details: any;
  }>`
    SELECT id, user_id, status, progress, details
    FROM tasks
    WHERE id = ${taskId}
    LIMIT 1
  `;

  return rows[0] ?? null;
},

async updateUserTask(
  taskId: string,
  data: {
    status?: string;
    progress?: number;
    userNotes?: string;
  }
) {
  const rows = await sql<{
    details: any;
  }>`
    SELECT details
    FROM tasks
    WHERE id = ${taskId}
    LIMIT 1
  `;

  const currentTask = rows[0];

  let currentDetails: any = {};

  if (currentTask?.details) {
    try {
      currentDetails =
        typeof currentTask.details === "string"
          ? JSON.parse(currentTask.details)
          : currentTask.details;
    } catch {
      currentDetails = {};
    }
  }

  const nextDetails = {
    ...currentDetails,
    ...(data.userNotes !== undefined ? { userNotes: data.userNotes } : {}),
  };

  const finalProgress =
    data.status === "completed"
      ? 100
      : data.progress;

  await sql`
    UPDATE tasks
    SET
      status = COALESCE(${data.status}, status),
      progress = COALESCE(${finalProgress}, progress),
      details = ${JSON.stringify(nextDetails)},
      completed_date = CASE
        WHEN ${data.status} = 'completed' THEN CURRENT_TIMESTAMP
        ELSE completed_date
      END,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${taskId}
  `;
},

// ==========================================
// SECTION: EVALUATIONS
// ==========================================

async getEvaluationTemplatesWithStats() {
  const rows = await sql<{
    id: string;
    title: string;
    description: string;
    type: "environment" | "performance" | "skills";
    status: "draft" | "active" | "completed";
    due_date: string | null;
    created_at: string;
    assigned_users: number;
    responses_count: number;
  }>`
    SELECT
      et.id,
      et.title,
      et.description,
      et.type,
      et.status,
      et.due_date,
      et.created_at,
      COUNT(e.id)::int as assigned_users,
      COUNT(e.id) FILTER (WHERE e.completed_date IS NOT NULL)::int as responses_count
    FROM evaluation_templates et
    LEFT JOIN evaluations e ON e.template_id = et.id
    GROUP BY
      et.id,
      et.title,
      et.description,
      et.type,
      et.status,
      et.due_date,
      et.created_at
    ORDER BY et.created_at DESC
  `;

  return rows.map((row) => {
    const assignedUsers = Number(row.assigned_users ?? 0);
    const responses = Number(row.responses_count ?? 0);

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      type: row.type,
      status: row.status,
      createdDate: row.created_at,
      dueDate: row.due_date,
      assignedUsers,
      responses,
      completionRate:
        assignedUsers > 0 ? Math.round((responses / assignedUsers) * 100) : 0,
    };
  });
},

async createEvaluationTemplate(template: {
  title: string;
  description: string;
  type: string;
  dueDate?: string | null;
  createdBy: string;
  googleFormId?: string;
}) {
  const rows = await sql<{ id: string }>`
    INSERT INTO evaluation_templates (
      title,
      description,
      type,
      status,
      created_by,
      due_date,
      google_form_id
    )
    VALUES (
      ${template.title},
      ${template.description},
      ${template.type},
      'draft',
      ${template.createdBy},
      ${template.dueDate ?? null},
      ${template.googleFormId ?? null}
    )
    RETURNING id
  `;

  return rows[0].id;
},

async updateEvaluationScoreByEmailAndForm(data: { 
  email: string; 
  score: number; 
  googleFormId: string 
}) {
  const result = await sql`
    UPDATE evaluations
    SET
      score = ${data.score},
      status = 'completed',
      completed_date = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE user_id = (SELECT id FROM users WHERE email = ${data.email} LIMIT 1)
      AND template_id = (SELECT id FROM evaluation_templates WHERE google_form_id = ${data.googleFormId} LIMIT 1)
      AND status != 'completed'
    RETURNING id;
  `;

  return {
    success: result.length > 0,
    evaluationId: result.length > 0 ? result[0].id : null
  };
},


async publishEvaluationTemplate(templateId: string) {
  await sql`
    UPDATE evaluation_templates
    SET
      status = 'active',
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${templateId}
  `;
},

async getUserEvaluations(userId: string) {
  const rows = await sql<{
    id: string;
    template_id: string;
    user_id: string;
    assigned_by: string;
    status: string;
    assigned_date: string;
    due_date: string | null;
    completed_date: string | null;
    score: number | null;
    max_score: number | null;
    responses: any;
    title: string;
    description: string;
    type: string;
    google_form_id: string;
  }>`
    SELECT
      e.id,
      e.template_id,
      e.user_id,
      e.assigned_by,
      e.status,
      e.assigned_date,
      e.due_date,
      e.completed_date,
      e.score,
      e.max_score,
      e.responses,
      et.title,
      et.description,
      et.type,
      et.google_form_id as google_form_id
    FROM evaluations e
    INNER JOIN evaluation_templates et ON et.id = e.template_id
    WHERE e.user_id = ${userId}
    ORDER BY
      CASE e.status
        WHEN 'in_progress' THEN 1
        WHEN 'pending' THEN 2
        WHEN 'completed' THEN 3
        ELSE 4
      END,
      e.due_date ASC,
      e.created_at DESC
  `;

  return rows.map((row) => ({
    id: row.id,
    templateId: row.template_id,
    title: row.title,
    description: row.description,
    type: row.type,
    status: row.status,
    assignedDate: row.assigned_date,
    dueDate: row.due_date,
    completedDate: row.completed_date,
    score: row.score ?? 0,
    maxScore: row.max_score ?? 0,
    google_form_id: row.google_form_id,
    responses: row.responses,
  }));
},

async startEvaluation(evaluationId: string, userId: string) {
  await sql`
    UPDATE evaluations
    SET
      status = 'in-progress',
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${evaluationId}
      AND user_id = ${userId}
  `;
},

async submitEvaluation(data: {
  evaluationId: string;
  userId: string;
  responses: any;
  score: number;
  maxScore: number;
}) {
  await sql`
    UPDATE evaluations
    SET
      status = 'completed',
      responses = ${JSON.stringify(data.responses ?? {})},
      score = ${data.score},
      max_score = ${data.maxScore},
      completed_date = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${data.evaluationId}
      AND user_id = ${data.userId}
  `;
},
async assignEvaluationTemplateToUsers(data: {
  templateId: string;
  userIds: string[];
  assignedBy: string;
  dueDate?: string | null;
}) {
  if (!data.userIds.length) return;

  for (const userId of data.userIds) {
    const existing = await sql<{ id: string }>`
      SELECT id
      FROM evaluations
      WHERE template_id = ${data.templateId}
        AND user_id = ${userId}
        AND status IN ('pending', 'in_progress')
      LIMIT 1
    `;

    if (existing.length > 0) continue;

    await sql`
      INSERT INTO evaluations (
        template_id,
        user_id,
        assigned_by,
        status,
        assigned_date,
        due_date,
        score,
        max_score,
        responses
      )
      VALUES (
        ${data.templateId},
        ${userId},
        ${data.assignedBy},
        'pending',
        CURRENT_TIMESTAMP,
        ${data.dueDate ?? null},
        0,
        0,
        ${JSON.stringify({})}
      )
    `;
  }
}
};