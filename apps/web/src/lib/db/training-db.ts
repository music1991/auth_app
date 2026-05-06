import { sql } from ".";

export const trainingDb = {

  // ==========================================
  // SECTORS
  // ==========================================

  async getSectors() {
    return await sql<{ id: number; name: string }>`
      SELECT id, name FROM sectors ORDER BY name ASC
    `;
  },

  async createSector(name: string) {
    const rows = await sql<{ id: number }>`
      INSERT INTO sectors (name) VALUES (${name}) RETURNING id
    `;
    return rows[0].id;
  },

  async deleteSector(id: number) {
    await sql`DELETE FROM sectors WHERE id = ${id}`;
  },

  // ==========================================
  // PROVIDERS
  // ==========================================

  async getProviders() {
    return await sql<{
      id: number;
      name: string;
      website: string | null;
      contact: string | null;
      created_at: string;
    }>`
      SELECT id, name, website, contact, created_at
      FROM providers
      ORDER BY name ASC
    `;
  },

  async createProvider(data: { name: string; website?: string | null; contact?: string | null }) {
    const rows = await sql<{ id: number }>`
      INSERT INTO providers (name, website, contact)
      VALUES (${data.name}, ${data.website ?? null}, ${data.contact ?? null})
      RETURNING id
    `;
    return rows[0].id;
  },

  async deleteProvider(id: number) {
    await sql`DELETE FROM providers WHERE id = ${id}`;
  },

  // ==========================================
  // COURSES
  // ==========================================

  async getCourses() {
    return await sql<{
      id: string;
      title: string;
      description: string | null;
      source: "internal" | "external";
      provider_id: number | null;
      provider_name: string | null;
      url: string | null;
      duration_h: number | null;
      cost_per_user: number;
      currency: string;
      created_by: string;
      created_at: string;
      updated_at: string;
    }>`
      SELECT
        c.id, c.title, c.description, c.source, c.provider_id,
        p.name AS provider_name,
        c.url, c.duration_h, c.cost_per_user, c.currency,
        c.created_by, c.created_at, c.updated_at
      FROM courses c
      LEFT JOIN providers p ON p.id = c.provider_id
      ORDER BY c.created_at DESC
    `;
  },

  async getCourseById(id: string) {
    const rows = await sql<{
      id: string;
      title: string;
      description: string | null;
      source: "internal" | "external";
      provider_id: number | null;
      provider_name: string | null;
      url: string | null;
      duration_h: number | null;
      cost_per_user: number;
      currency: string;
      created_by: string;
      created_at: string;
      updated_at: string;
    }>`
      SELECT
        c.id, c.title, c.description, c.source, c.provider_id,
        p.name AS provider_name,
        c.url, c.duration_h, c.cost_per_user, c.currency,
        c.created_by, c.created_at, c.updated_at
      FROM courses c
      LEFT JOIN providers p ON p.id = c.provider_id
      WHERE c.id = ${id}
      LIMIT 1
    `;
    return rows[0] ?? null;
  },

  async createCourse(data: {
    title: string;
    description?: string | null;
    source: "internal" | "external";
    providerId?: number | null;
    url?: string | null;
    durationH?: number | null;
    costPerUser?: number;
    currency?: string;
    createdBy: string;
  }) {
    const rows = await sql<{ id: string }>`
      INSERT INTO courses (
        title, description, source, provider_id, url,
        duration_h, cost_per_user, currency, created_by
      )
      VALUES (
        ${data.title}, ${data.description ?? null}, ${data.source},
        ${data.providerId ?? null}, ${data.url ?? null},
        ${data.durationH ?? null}, ${data.costPerUser ?? 0},
        ${data.currency ?? "ARS"}, ${data.createdBy}
      )
      RETURNING id
    `;
    return rows[0].id;
  },

  async updateCourse(id: string, data: {
    title?: string;
    description?: string | null;
    source?: "internal" | "external";
    providerId?: number | null;
    url?: string | null;
    durationH?: number | null;
    costPerUser?: number;
    currency?: string;
  }) {
    await sql`
      UPDATE courses SET
        title        = COALESCE(${data.title ?? null}, title),
        description  = COALESCE(${data.description ?? null}, description),
        source       = COALESCE(${data.source ?? null}, source),
        provider_id  = COALESCE(${data.providerId ?? null}, provider_id),
        url          = COALESCE(${data.url ?? null}, url),
        duration_h   = COALESCE(${data.durationH ?? null}, duration_h),
        cost_per_user= COALESCE(${data.costPerUser ?? null}, cost_per_user),
        currency     = COALESCE(${data.currency ?? null}, currency),
        updated_at   = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;
  },

  async deleteCourse(id: string) {
    await sql`DELETE FROM courses WHERE id = ${id}`;
  },

  // ==========================================
  // TRAINING LINES
  // ==========================================

  async getTrainingLines() {
    return await sql<{
      id: string;
      title: string;
      description: string | null;
      mandatory: boolean;
      created_by: string;
      created_at: string;
      updated_at: string;
      total_items: number;
      sectors: string;
    }>`
      SELECT
        tl.id, tl.title, tl.description, tl.mandatory,
        tl.created_by, tl.created_at, tl.updated_at,
        COUNT(DISTINCT tli.id)::int AS total_items,
        COALESCE(
          string_agg(DISTINCT s.name, ', ' ORDER BY s.name),
          ''
        ) AS sectors
      FROM training_lines tl
      LEFT JOIN training_line_items tli ON tli.training_line_id = tl.id
      LEFT JOIN training_line_sectors tls ON tls.training_line_id = tl.id
      LEFT JOIN sectors s ON s.id = tls.sector_id
      GROUP BY tl.id, tl.title, tl.description, tl.mandatory, tl.created_by, tl.created_at, tl.updated_at
      ORDER BY tl.created_at DESC
    `;
  },

  async getTrainingLineById(id: string) {
    const rows = await sql<{
      id: string;
      title: string;
      description: string | null;
      mandatory: boolean;
      created_by: string;
      created_at: string;
      updated_at: string;
    }>`
      SELECT id, title, description, mandatory, created_by, created_at, updated_at
      FROM training_lines
      WHERE id = ${id}
      LIMIT 1
    `;
    return rows[0] ?? null;
  },

  async createTrainingLine(data: {
    title: string;
    description?: string | null;
    mandatory?: boolean;
    createdBy: string;
  }) {
    const rows = await sql<{ id: string }>`
      INSERT INTO training_lines (title, description, mandatory, created_by)
      VALUES (
        ${data.title}, ${data.description ?? null},
        ${data.mandatory ?? false}, ${data.createdBy}
      )
      RETURNING id
    `;
    return rows[0].id;
  },

  async updateTrainingLine(id: string, data: {
    title?: string;
    description?: string | null;
    mandatory?: boolean;
  }) {
    await sql`
      UPDATE training_lines SET
        title       = COALESCE(${data.title ?? null}, title),
        description = COALESCE(${data.description ?? null}, description),
        mandatory   = COALESCE(${data.mandatory ?? null}, mandatory),
        updated_at  = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;
  },

  async deleteTrainingLine(id: string) {
    await sql`DELETE FROM training_lines WHERE id = ${id}`;
  },

  async setTrainingLineSectors(trainingLineId: string, sectorIds: number[]) {
    await sql`DELETE FROM training_line_sectors WHERE training_line_id = ${trainingLineId}`;
    for (const sectorId of sectorIds) {
      await sql`
        INSERT INTO training_line_sectors (training_line_id, sector_id)
        VALUES (${trainingLineId}, ${sectorId})
        ON CONFLICT DO NOTHING
      `;
    }
  },

  // ==========================================
  // TRAINING LINE ITEMS
  // ==========================================

  async getTrainingLineItems(trainingLineId: string) {
    return await sql<{
      id: string;
      training_line_id: string;
      item_type: "course" | "evaluation" | "task";
      course_id: string | null;
      evaluation_template_id: string | null;
      task_template_id: string | null;
      order_index: number;
      item_title: string | null;
    }>`
      SELECT
        tli.id, tli.training_line_id, tli.item_type,
        tli.course_id, tli.evaluation_template_id, tli.task_template_id,
        tli.order_index,
        COALESCE(c.title, et.title, tt.title) AS item_title
      FROM training_line_items tli
      LEFT JOIN courses c ON c.id = tli.course_id
      LEFT JOIN evaluation_templates et ON et.id = tli.evaluation_template_id
      LEFT JOIN task_templates tt ON tt.id = tli.task_template_id
      WHERE tli.training_line_id = ${trainingLineId}
      ORDER BY tli.order_index ASC
    `;
  },

  async addTrainingLineItem(data: {
    trainingLineId: string;
    itemType: "course" | "evaluation" | "task";
    courseId?: string | null;
    evaluationTemplateId?: string | null;
    taskTemplateId?: string | null;
    orderIndex: number;
  }) {
    const rows = await sql<{ id: string }>`
      INSERT INTO training_line_items (
        training_line_id, item_type, course_id,
        evaluation_template_id, task_template_id, order_index
      )
      VALUES (
        ${data.trainingLineId}, ${data.itemType},
        ${data.courseId ?? null}, ${data.evaluationTemplateId ?? null},
        ${data.taskTemplateId ?? null}, ${data.orderIndex}
      )
      RETURNING id
    `;
    return rows[0].id;
  },

  async removeTrainingLineItem(itemId: string) {
    await sql`DELETE FROM training_line_items WHERE id = ${itemId}`;
  },

  // ==========================================
  // ENROLLMENTS
  // ==========================================

  async enrollUsersInLine(data: {
    trainingLineId: string;
    userIds: string[];
    assignedBy: string;
  }) {
    const [costRow] = await sql<{ total_cost: number }>`
      SELECT COALESCE(SUM(c.cost_per_user), 0)::int AS total_cost
      FROM training_line_items tli
      JOIN courses c ON c.id = tli.course_id
      WHERE tli.training_line_id = ${data.trainingLineId}
        AND tli.item_type = 'course'
    `;
    const trainingCost = Number(costRow?.total_cost ?? 0);

    const items = await sql<{ id: string }>`
      SELECT id FROM training_line_items WHERE training_line_id = ${data.trainingLineId}
    `;
    const totalItems = items.length;

    for (const userId of data.userIds) {
      const existing = await sql<{ user_id: string }>`
        SELECT user_id FROM training_line_progress
        WHERE user_id = ${userId} AND training_line_id = ${data.trainingLineId}
        LIMIT 1
      `;
      if (existing.length > 0) continue;

      await sql`
        INSERT INTO training_line_progress (user_id, training_line_id, total_items, completed_items)
        VALUES (${userId}, ${data.trainingLineId}, ${totalItems}, 0)
        ON CONFLICT DO NOTHING
      `;

      await trainingDb.captureRoiSnapshot(userId, data.trainingLineId, trainingCost);
    }
  },

  async getUserTrainingLines(userId: string) {
    return await sql<{
      training_line_id: string;
      title: string;
      description: string | null;
      mandatory: boolean;
      total_items: number;
      completed_items: number;
      last_updated: string;
    }>`
      SELECT
        tlp.training_line_id,
        tl.title,
        tl.description,
        tl.mandatory,
        tlp.total_items,
        tlp.completed_items,
        tlp.last_updated
      FROM training_line_progress tlp
      JOIN training_lines tl ON tl.id = tlp.training_line_id
      WHERE tlp.user_id = ${userId}
      ORDER BY tl.mandatory DESC, tlp.last_updated DESC
    `;
  },

  async getTrainingLineEnrollments(trainingLineId: string) {
    return await sql<{
      user_id: string;
      user_name: string;
      total_items: number;
      completed_items: number;
      last_updated: string;
    }>`
      SELECT
        tlp.user_id,
        u.name AS user_name,
        tlp.total_items,
        tlp.completed_items,
        tlp.last_updated
      FROM training_line_progress tlp
      JOIN users u ON u.id = tlp.user_id
      WHERE tlp.training_line_id = ${trainingLineId}
      ORDER BY u.name ASC
    `;
  },

  async recalculateProgress(userId: string, trainingLineId: string) {
    const rows = await sql<{ completed_items: number; total_items: number }>`
      SELECT
        COUNT(tli.id) FILTER (
          WHERE (
            tli.item_type = 'course'     AND EXISTS (
              SELECT 1 FROM course_enrollments ce
              WHERE ce.course_id = tli.course_id
                AND ce.user_id = ${userId}
                AND ce.training_line_id = ${trainingLineId}
                AND ce.status = 'completed'
            )
          ) OR (
            tli.item_type = 'evaluation' AND EXISTS (
              SELECT 1 FROM evaluations e
              WHERE e.template_id = tli.evaluation_template_id
                AND e.user_id = ${userId}
                AND e.training_line_id = ${trainingLineId}
                AND e.status = 'completed'
            )
          ) OR (
            tli.item_type = 'task'       AND EXISTS (
              SELECT 1 FROM tasks t
              WHERE t.template_id = tli.task_template_id
                AND t.user_id = ${userId}
                AND t.training_line_id = ${trainingLineId}
                AND t.status = 'completed'
            )
          )
        )::int AS completed_items,
        COUNT(tli.id)::int AS total_items
      FROM training_line_items tli
      WHERE tli.training_line_id = ${trainingLineId}
    `;

    const { completed_items, total_items } = rows[0] ?? { completed_items: 0, total_items: 0 };

    await sql`
      INSERT INTO training_line_progress (user_id, training_line_id, total_items, completed_items, last_updated)
      VALUES (${userId}, ${trainingLineId}, ${total_items}, ${completed_items}, NOW())
      ON CONFLICT (user_id, training_line_id) DO UPDATE SET
        completed_items = EXCLUDED.completed_items,
        total_items     = EXCLUDED.total_items,
        last_updated    = NOW()
    `;
  },

  // ==========================================
  // COURSE ENROLLMENTS
  // ==========================================

  async enrollUserInCourse(data: {
    userId: string;
    courseId: string;
    trainingLineId?: string | null;
  }) {
    const rows = await sql<{ id: string }>`
      INSERT INTO course_enrollments (user_id, course_id, training_line_id, status)
      VALUES (
        ${data.userId}, ${data.courseId},
        ${data.trainingLineId ?? null}, 'enrolled'
      )
      ON CONFLICT (user_id, course_id, training_line_id) DO NOTHING
      RETURNING id
    `;
    return rows[0]?.id ?? null;
  },

  async updateCourseEnrollmentStatus(data: {
    userId: string;
    courseId: string;
    trainingLineId: string | null;
    status: "enrolled" | "in_progress" | "completed" | "dropped";
  }) {
    await sql`
      UPDATE course_enrollments SET
        status       = ${data.status},
        completed_at = CASE WHEN ${data.status} = 'completed' THEN NOW() ELSE completed_at END
      WHERE user_id        = ${data.userId}
        AND course_id      = ${data.courseId}
        AND (training_line_id = ${data.trainingLineId} OR (training_line_id IS NULL AND ${data.trainingLineId} IS NULL))
    `;
  },

  // ==========================================
  // CERTIFICATIONS
  // ==========================================

  async getUserCertifications(userId: string) {
    return await sql<{
      id: string;
      user_id: string;
      course_id: string | null;
      course_title: string | null;
      enrollment_id: string | null;
      title: string;
      issuer: string | null;
      issued_date: string | null;
      expiry_date: string | null;
      credential_url: string | null;
      file_url: string | null;
      verified: boolean;
      created_at: string;
    }>`
      SELECT
        cert.id, cert.user_id, cert.course_id,
        c.title AS course_title,
        cert.enrollment_id, cert.title, cert.issuer,
        cert.issued_date, cert.expiry_date,
        cert.credential_url, cert.file_url, cert.verified, cert.created_at
      FROM certifications cert
      LEFT JOIN courses c ON c.id = cert.course_id
      WHERE cert.user_id = ${userId}
      ORDER BY cert.created_at DESC
    `;
  },

  async getAllCertifications() {
    return await sql<{
      id: string;
      user_id: string;
      user_name: string;
      course_id: string | null;
      course_title: string | null;
      title: string;
      issuer: string | null;
      issued_date: string | null;
      expiry_date: string | null;
      credential_url: string | null;
      file_url: string | null;
      verified: boolean;
      created_at: string;
    }>`
      SELECT
        cert.id, cert.user_id, u.name AS user_name,
        cert.course_id, c.title AS course_title,
        cert.title, cert.issuer,
        cert.issued_date, cert.expiry_date,
        cert.credential_url, cert.file_url, cert.verified, cert.created_at
      FROM certifications cert
      JOIN users u ON u.id = cert.user_id
      LEFT JOIN courses c ON c.id = cert.course_id
      ORDER BY cert.created_at DESC
    `;
  },

  async createCertification(data: {
    userId: string;
    courseId?: string | null;
    enrollmentId?: string | null;
    title: string;
    issuer?: string | null;
    issuedDate?: string | null;
    expiryDate?: string | null;
    credentialUrl?: string | null;
    fileUrl?: string | null;
  }) {
    const rows = await sql<{ id: string }>`
      INSERT INTO certifications (
        user_id, course_id, enrollment_id, title, issuer,
        issued_date, expiry_date, credential_url, file_url
      )
      VALUES (
        ${data.userId}, ${data.courseId ?? null}, ${data.enrollmentId ?? null},
        ${data.title}, ${data.issuer ?? null},
        ${data.issuedDate ?? null}, ${data.expiryDate ?? null},
        ${data.credentialUrl ?? null}, ${data.fileUrl ?? null}
      )
      RETURNING id
    `;
    return rows[0].id;
  },

  async verifyCertification(id: string) {
    await sql`UPDATE certifications SET verified = true WHERE id = ${id}`;
  },

  async deleteCertification(id: string) {
    await sql`DELETE FROM certifications WHERE id = ${id}`;
  },

  // ==========================================
  // ROI
  // ==========================================

  async captureRoiSnapshot(userId: string, trainingLineId: string, trainingCost: number) {
    const [metrics] = await sql<{
      avg_productivity: number;
      avg_eval_score: number;
      tasks_completion_pct: number;
    }>`
      SELECT
        COALESCE(
          (SELECT AVG(productivity_score)
           FROM productivity_metrics
           WHERE user_id = ${userId}
             AND date >= CURRENT_DATE - INTERVAL '30 days'),
          0
        ) AS avg_productivity,
        COALESCE(
          (SELECT ROUND(AVG(CASE WHEN max_score > 0 THEN score * 100.0 / max_score END), 1)
           FROM evaluations
           WHERE user_id = ${userId}
             AND status = 'completed'
             AND completed_date >= NOW() - INTERVAL '30 days'),
          0
        ) AS avg_eval_score,
        COALESCE(
          (SELECT ROUND(
             COUNT(*) FILTER (WHERE status = 'completed') * 100.0
             / NULLIF(COUNT(*), 0), 1)
           FROM tasks
           WHERE user_id = ${userId}
             AND assigned_date >= NOW() - INTERVAL '30 days'),
          0
        ) AS tasks_completion_pct
    `;

    await sql`
      INSERT INTO training_roi_snapshots (
        user_id, training_line_id, snapshot_date,
        avg_productivity, avg_eval_score, tasks_completion_pct, training_cost
      )
      VALUES (
        ${userId}, ${trainingLineId}, CURRENT_DATE,
        ${metrics.avg_productivity}, ${metrics.avg_eval_score},
        ${metrics.tasks_completion_pct}, ${trainingCost}
      )
      ON CONFLICT (user_id, training_line_id) DO NOTHING
    `;
  },

  async getRoiForLine(trainingLineId: string) {
    return await sql<{
      user_id: string;
      user_name: string;
      training_cost: number;
      baseline_productivity: number;
      current_productivity: number;
      baseline_eval_score: number;
      current_eval_score: number;
      completed_items: number;
      total_items: number;
    }>`
      SELECT
        snap.user_id,
        u.name AS user_name,
        snap.training_cost,
        snap.avg_productivity     AS baseline_productivity,
        snap.avg_eval_score       AS baseline_eval_score,
        COALESCE(
          (SELECT AVG(productivity_score)
           FROM productivity_metrics
           WHERE user_id = snap.user_id
             AND date >= snap.snapshot_date),
          0
        ) AS current_productivity,
        COALESCE(
          (SELECT ROUND(AVG(CASE WHEN max_score > 0 THEN score * 100.0 / max_score END), 1)
           FROM evaluations
           WHERE user_id = snap.user_id
             AND status = 'completed'
             AND completed_date >= snap.snapshot_date),
          0
        ) AS current_eval_score,
        COALESCE(tlp.completed_items, 0) AS completed_items,
        COALESCE(tlp.total_items, 0)     AS total_items
      FROM training_roi_snapshots snap
      JOIN users u ON u.id = snap.user_id
      LEFT JOIN training_line_progress tlp
        ON tlp.user_id = snap.user_id
        AND tlp.training_line_id = snap.training_line_id
      WHERE snap.training_line_id = ${trainingLineId}
      ORDER BY u.name ASC
    `;
  },
};

