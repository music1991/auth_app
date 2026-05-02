import { sql } from ".";

// ==========================================
// SECTION: EVALUATION TEMPLATES
// ==========================================

export const evaluationsDb = {
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
      online: boolean;
    }>`
      SELECT
        et.id,
        et.title,
        et.description,
        et.type,
        et.status,
        et.due_date,
        et.created_at,
        et.online,
        COUNT(e.id)::int as assigned_users,
        COUNT(e.id) FILTER (WHERE e.completed_date IS NOT NULL)::int as responses_count
      FROM evaluation_templates et
      LEFT JOIN evaluations e ON e.template_id = et.id
      GROUP BY et.id, et.title, et.description, et.type, et.status, et.due_date, et.created_at, et.online
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
        completionRate: assignedUsers > 0 ? Math.round((responses / assignedUsers) * 100) : 0,
        online: row.online,
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
    online: boolean;
    maxScore: number;
  }) {
    const rows = await sql<{ id: string }>`
      INSERT INTO evaluation_templates (
        title, description, type, status, created_by, due_date, google_form_id, online, max_score
      )
      VALUES (
        ${template.title}, ${template.description}, ${template.type},
        'draft', ${template.createdBy}, ${template.dueDate ?? null},
        ${template.googleFormId ?? null}, ${template.online}, ${template.maxScore}
      )
      RETURNING id
    `;
    return rows[0].id;
  },

  async publishEvaluationTemplate(templateId: string) {
    await sql`
      UPDATE evaluation_templates
      SET status = 'active', updated_at = CURRENT_TIMESTAMP
      WHERE id = ${templateId}
    `;
  },

  // ==========================================
  // SECTION: EVALUATION ASSIGNMENTS
  // ==========================================

  async assignEvaluationTemplateToUsers(data: {
    templateId: string;
    userIds: string[];
    assignedBy: string;
    dueDate?: string | null;
  }) {
    if (!data.userIds.length) return;

    for (const userId of data.userIds) {
      const existing = await sql<{ id: string }>`
        SELECT id FROM evaluations
        WHERE template_id = ${data.templateId} AND user_id = ${userId}
        LIMIT 1
      `;
      if (existing.length > 0) continue;

      await sql`
        INSERT INTO evaluations (
          template_id, user_id, assigned_by, status,
          assigned_date, due_date, score, max_score, responses
        )
        VALUES (
          ${data.templateId}, ${userId}, ${data.assignedBy},
          'pending', CURRENT_TIMESTAMP, ${data.dueDate ?? null},
          0, 0, ${JSON.stringify({})}
        )
      `;
    }
  },

  async getAssignedUsersByTemplate(templateId: string) {
    const rows = await sql<{
      id: string;
      evaluation_id: string;
      name: string;
      email: string;
      completed_date: string | null;
    }>`
      SELECT u.id, e.id as evaluation_id, u.name, u.email, e.completed_date
      FROM evaluations e
      JOIN users u ON e.user_id = u.id
      WHERE e.template_id = ${templateId}
      ORDER BY u.name ASC
    `;
    return rows.map((row) => ({
      id: row.id,
      evaluationId: row.evaluation_id,
      name: row.name,
      email: row.email,
      isCompleted: !!row.completed_date,
    }));
  },

  async unassignUserFromEvaluation(templateId: string, userId: string) {
    const result = await sql`
      DELETE FROM evaluations
      WHERE template_id = ${templateId} AND user_id = ${userId} AND completed_date IS NULL
      RETURNING id
    `;
    return result.length > 0;
  },

  // ==========================================
  // SECTION: USER EVALUATIONS
  // ==========================================

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
      responses: unknown;
      title: string;
      description: string;
      type: string;
      google_form_id: string;
      online: boolean;
    }>`
      SELECT
        e.id, e.template_id, e.user_id, e.assigned_by,
        e.status, e.assigned_date, e.due_date, e.completed_date,
        e.score, e.max_score, e.responses,
        et.title, et.description, et.type,
        et.google_form_id as google_form_id, et.online
      FROM evaluations e
      INNER JOIN evaluation_templates et ON et.id = e.template_id AND et.status = 'active'
      WHERE e.user_id = ${userId}
      ORDER BY e.due_date ASC, e.created_at DESC
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
      online: row.online,
    }));
  },

  async submitEvaluation(data: {
    evaluationId: string;
    userId: string;
    responses: unknown;
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
      WHERE id = ${data.evaluationId} AND user_id = ${data.userId}
    `;
  },
};

