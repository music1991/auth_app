import { sql } from ".";
import { AdminStats, DashboardTask, DashboardTaskListItem, User, UserRole, UserStats, UserWithMetrics } from "@/types";

// ==========================================
// SECTION: USER STATS
// ==========================================

export const tasksDb = {
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
          WHERE ws.user_id = ${userId} AND ws.session_date = CURRENT_DATE
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

  async getAdminStats(): Promise<AdminStats> {
    const rows = await sql<{
      total_users: number;
      active_users: number;
      pending_tasks: number;
      completed_tasks: number;
      pending_evaluations: number;
      avg_rate: number;
    }>`
      SELECT
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(DISTINCT user_id) FROM work_sessions WHERE session_date >= CURRENT_DATE - 7) as active_users,
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

  // ==========================================
  // SECTION: USERS
  // ==========================================

  async getAllUsers(): Promise<User[]> {
    const rows = await sql<User>`
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

  async getUsersWithMetrics(): Promise<UserWithMetrics[]> {
    const rows = await sql<{
      id: string;
      name: string;
      email: string;
      role: UserRole;
      verified: boolean;
      created_at: string;
      tasks_assigned: number;
      tasks_completed: number;
      productivity_score: number;
    }>`
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.verified,
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
      GROUP BY u.id, u.name, u.email, u.role, u.verified, u.created_at
      ORDER BY u.created_at DESC
    `;
    return rows.map((row) => ({
      ...row,
      status: "inactive" as const,
      last_login: null,
      last_seen: null,
    }));
  },

  // ==========================================
  // SECTION: TASKS
  // ==========================================

  async getUserTasks(userId: string): Promise<DashboardTaskListItem[]> {
    return await sql<DashboardTaskListItem>`
      SELECT
        t.id,
        t.title,
        t.description,
        t.status,
        t.progress,
        t.due_date
      FROM tasks t
      WHERE t.user_id = ${userId}
      ORDER BY
        CASE t.status
          WHEN 'in-progress' THEN 1
          WHEN 'pending' THEN 2
          ELSE 3
        END,
        t.due_date ASC,
        t.created_at DESC
    `;
  },

  async getUserTaskById(userId: string, taskId: string): Promise<DashboardTask | null> {
    const rows = await sql<DashboardTask>`
      SELECT
        t.id,
        t.template_id,
        t.title,
        t.description,
        t.status,
        t.progress,
        t.assigned_date,
        t.due_date,
        t.completed_date,
        t.details,
        tt.requirements,
        u.name AS assigned_by_name,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', r.id,
                'title', r.title,
                'type', r.type,
                'url', r.url
              )
              ORDER BY r.created_at DESC
            )
            FROM resources r
            WHERE r.id IN (
              SELECT (trim(both '"' from value::text))::uuid
              FROM jsonb_array_elements(COALESCE(tt.requirements, '[]'::jsonb)) AS value
            )
          ),
          '[]'::json
        ) AS resources
      FROM tasks t
      LEFT JOIN task_templates tt ON tt.id = t.template_id
      LEFT JOIN users u ON u.id = t.assigned_by
      WHERE t.user_id = ${userId}
        AND t.id = ${taskId}
      LIMIT 1
    `;
    return rows[0] ?? null;
  },

  async getAdminUserTaskById(userId: string, taskId: string): Promise<DashboardTask | null> {
    const rows = await sql<DashboardTask>`
      SELECT
        t.id,
        t.template_id,
        t.title,
        t.description,
        t.status,
        t.progress,
        t.assigned_date,
        t.due_date,
        t.completed_date,
        t.details,
        tt.requirements,
        u.name AS assigned_by_name,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', r.id,
                'name', r.title,
                'type', r.type,
                'url', r.url
              )
              ORDER BY r.created_at DESC
            )
            FROM resources r
            WHERE r.id IN (
              SELECT (trim(both '"' from value::text))::uuid
              FROM jsonb_array_elements(COALESCE(tt.requirements, '[]'::jsonb)) AS value
            )
          ),
          '[]'::json
        ) AS resources
      FROM tasks t
      LEFT JOIN task_templates tt ON tt.id = t.template_id
      LEFT JOIN users u ON u.id = t.assigned_by
      WHERE t.user_id = ${userId}
        AND t.id = ${taskId}
      LIMIT 1
    `;
    return rows[0] ?? null;
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

  async getTaskById(taskId: string) {
    const rows = await sql<{
      id: string;
      user_id: string;
      status: string;
      progress: number;
      training_line_id: string | null;
      details: Record<string, unknown> | null;
    }>`
      SELECT id, user_id, status, progress, training_line_id, details
      FROM tasks
      WHERE id = ${taskId}
      LIMIT 1
    `;
    return rows[0] ?? null;
  },

  async updateUserTask(taskId: string, data: { status?: string; progress?: number; userNotes?: string }) {
    const rows = await sql<{ details: Record<string, unknown> | null }>`
      SELECT details FROM tasks WHERE id = ${taskId} LIMIT 1
    `;
    const currentTask = rows[0];
    let currentDetails: Record<string, unknown> = {};
    if (currentTask?.details) {
      try {
        currentDetails = typeof currentTask.details === "string"
          ? JSON.parse(currentTask.details) : currentTask.details;
      } catch { currentDetails = {}; }
    }

    const nextDetails = {
      ...currentDetails,
      ...(data.userNotes !== undefined ? { userNotes: data.userNotes } : {}),
    };
    const finalProgress = data.status === "completed" ? 100 : data.progress;

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
  // SECTION: TASK TEMPLATES
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
      SELECT id, title, description, type, estimated_hours, requirements, created_by, created_at, updated_at
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
      INSERT INTO task_templates (title, description, type, estimated_hours, requirements, created_by)
      VALUES (
        ${template.title}, ${template.description}, ${template.type},
        ${template.estimatedHours}, ${JSON.stringify(template.requirements)}, ${template.createdBy}
      )
      RETURNING id
    `;
    return rows[0].id;
  },

  async updateTaskTemplate(templateId: string, template: {
    title: string;
    description: string;
    type: string;
    estimatedHours: number;
    requirements: string[];
  }) {
    const cleanRequirements = (template.requirements || []).filter(Boolean);
    await sql`
      UPDATE task_templates
      SET
        title = ${template.title},
        description = ${template.description},
        type = ${template.type},
        estimated_hours = ${template.estimatedHours},
        requirements = ${JSON.stringify(cleanRequirements)}::jsonb,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${templateId}
    `;
  },

  async deleteTaskTemplate(templateId: string) {
    await sql`DELETE FROM task_templates WHERE id = ${templateId}`;
  },

  async assignTask(task: {
    templateId: string;
    userId: string;
    assignedBy: string;
    title: string;
    description: string;
    dueDate: string;
    trainingLineId?: string | null;
    details?: Record<string, unknown>;
  }) {
    const rows = await sql<{ id: string }>`
      INSERT INTO tasks (
        template_id, user_id, assigned_by, title, description,
        status, progress, assigned_date, due_date, training_line_id, details
      )
      VALUES (
        ${task.templateId}, ${task.userId}, ${task.assignedBy},
        ${task.title}, ${task.description},
        'pending', 0, CURRENT_TIMESTAMP, ${task.dueDate},
        ${task.trainingLineId ?? null},
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
        t.id, t.template_id, t.user_id,
        u.name as user_name,
        t.assigned_date, t.due_date, t.status,
        COALESCE(t.progress, 0) as progress, t.details
      FROM tasks t
      LEFT JOIN users u ON u.id = t.user_id
      ORDER BY u.name ASC, t.assigned_date DESC, t.created_at DESC
    `;
    return rows.map((row) => {
      let parsedDetails: Record<string, unknown> = {};
      if (row.details) {
        try {
          parsedDetails = typeof row.details === "string" ? JSON.parse(row.details) : row.details;
        } catch { parsedDetails = {}; }
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

  // ==========================================
  // SECTION: PRODUCTIVITY & AVATAR
  // ==========================================

  async updateProductivityMetric(metric: {
    userId: string;
    date: string;
    tasksCompleted: number;
    tasksAssigned: number;
    totalWorkTime: number;
    productivityScore: number;
  }) {
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
      VALUES (${userId}, '', '', ${buffer}, ${mimeType})
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
      SET avatar_blob = NULL, avatar_mime = NULL, updated_at = NOW()
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
    return rows.length > 0 ? rows[0] : null;
  },
};

