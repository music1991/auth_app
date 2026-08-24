import { sql } from ".";

// ==========================================
// SECTION: DATA RANGE & GAP DETECTION
// ==========================================

export interface DataGap {
  from: string;
  to: string;
  gap_days: number;
}

export interface DataRange {
  min_date: string;
  max_date: string;
  gaps: DataGap[];
}

export const analyticsDb = {

  /**
   * Returns the overall date range of activity data and any gaps > 20 days.
   * A gap is a consecutive sequence of days with no tasks, evaluations, or sessions.
   */
  async getDataRange(): Promise<DataRange> {
    // Min and max dates across all activity tables
    const [range] = await sql<{ min_date: string; max_date: string }>`
      SELECT
        LEAST(
          COALESCE((SELECT MIN(assigned_date::date)::text FROM tasks), '9999-01-01'),
          COALESCE((SELECT MIN(assigned_date::date)::text FROM evaluations), '9999-01-01'),
          COALESCE((SELECT MIN(session_date::date)::text FROM work_sessions), '9999-01-01')
        ) AS min_date,
        GREATEST(
          COALESCE((SELECT MAX(assigned_date::date)::text FROM tasks), '1970-01-01'),
          COALESCE((SELECT MAX(assigned_date::date)::text FROM evaluations), '1970-01-01'),
          COALESCE((SELECT MAX(session_date::date)::text FROM work_sessions), '1970-01-01')
        ) AS max_date
    `;

    const minDate = range?.min_date ?? new Date().toISOString().slice(0, 10);
    const maxDate = range?.max_date ?? new Date().toISOString().slice(0, 10);

    // Find all days with activity
    const activeDays = await sql<{ activity_date: string }>`
      SELECT DISTINCT activity_date FROM (
        SELECT assigned_date::date AS activity_date FROM tasks
        UNION
        SELECT assigned_date::date  AS activity_date FROM evaluations
        UNION
        SELECT session_date::date   AS activity_date FROM work_sessions
      ) all_activity
      ORDER BY activity_date ASC
    `;

    // Detect gaps > 20 days between consecutive active days
    const gaps: DataGap[] = [];
    for (let i = 1; i < activeDays.length; i++) {
      const prev = new Date(activeDays[i - 1].activity_date);
      const curr = new Date(activeDays[i].activity_date);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
      if (diffDays > 20) {
        gaps.push({
          from: activeDays[i - 1].activity_date,
          to: activeDays[i].activity_date,
          gap_days: diffDays,
        });
      }
    }

    // Also check trailing gap between maxDate and today
    const today = new Date().toISOString().slice(0, 10);
    if (maxDate < today) {
      const dMax = new Date(maxDate);
      const dToday = new Date(today);
      const trailingDiff = Math.round((dToday.getTime() - dMax.getTime()) / 86400000);
      if (trailingDiff > 20) {
        gaps.push({
          from: maxDate,
          to: today,
          gap_days: trailingDiff,
        });
      }
    }

    return { min_date: minDate, max_date: maxDate, gaps };
  },

  async getAnalyticsUsers() {
    return await sql<{ id: string; name: string; email: string }>`
      SELECT id, name, email
      FROM users
      WHERE role = 'user'
      ORDER BY name ASC
    `;
  },

  // ==========================================
  // SECTION: TEAM ANALYTICS (ADMIN)
  // ==========================================

  /**
   * Team-wide stats for the given date range [from, to].
   */
  async getAdminTeamStats(from: string, to: string) {
    const [usersResult] = await sql<{
      total_users: number;
      active_users: number;
    }>`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'user') AS total_users,
        (SELECT COUNT(DISTINCT ws.user_id)
         FROM work_sessions ws
         JOIN users u ON u.id = ws.user_id
         WHERE u.role = 'user'
           AND ws.session_date::date BETWEEN ${from}::date AND ${to}::date
        ) AS active_users
    `;

    const [tasksResult] = await sql<{ task_completion_pct: number | null }>`
      SELECT
        ROUND(
          COUNT(*) FILTER (WHERE status = 'completed') * 100.0
          / NULLIF(COUNT(*), 0), 1
        ) AS task_completion_pct
      FROM tasks t
      JOIN users u ON u.id = t.user_id
      WHERE u.role = 'user'
        AND t.assigned_date::date BETWEEN ${from}::date AND ${to}::date
    `;

    const [evalsResult] = await sql<{
      evaluation_completion_pct: number | null;
      evaluation_approval_pct: number | null;
      avg_score_pct: number | null;
    }>`
      SELECT
        ROUND(
          COUNT(*) FILTER (WHERE status = 'completed') * 100.0
          / NULLIF(COUNT(*), 0), 1
        ) AS evaluation_completion_pct,
        ROUND(
          COUNT(*) FILTER (
            WHERE status = 'completed' AND max_score > 0
              AND score * 100.0 / max_score >= 60
          ) * 100.0
          / NULLIF(COUNT(*) FILTER (WHERE status = 'completed'), 0), 1
        ) AS evaluation_approval_pct,
        ROUND(
          AVG(
            CASE WHEN status = 'completed' AND max_score > 0
              THEN score * 100.0 / max_score END
          ), 1
        ) AS avg_score_pct
      FROM evaluations e
      JOIN users u ON u.id = e.user_id
      WHERE u.role = 'user'
        AND e.assigned_date::date BETWEEN ${from}::date AND ${to}::date
    `;

    const [sessionsResult] = await sql<{ total_session_hours: number | null }>`
      SELECT ROUND(COALESCE(SUM(ws.duration), 0) / 3600.0, 1) AS total_session_hours
      FROM work_sessions ws
      JOIN users u ON u.id = ws.user_id
      WHERE u.role = 'user'
        AND ws.session_date::date BETWEEN ${from}::date AND ${to}::date
    `;

    return {
      total_users: Number(usersResult?.total_users ?? 0),
      active_users: Number(usersResult?.active_users ?? 0),
      task_completion_pct: Number(tasksResult?.task_completion_pct ?? 0),
      evaluation_completion_pct: Number(evalsResult?.evaluation_completion_pct ?? 0),
      evaluation_approval_pct: Number(evalsResult?.evaluation_approval_pct ?? 0),
      avg_score_pct: Number(evalsResult?.avg_score_pct ?? 0),
      total_session_hours: Number(sessionsResult?.total_session_hours ?? 0),
    };
  },

  /**
   * Team ranking for the given date range [from, to].
   */
  async getAdminTeamRanking(from: string, to: string) {
    const rows = await sql<{
      user_id: string;
      user_name: string;
      task_completion_pct: number | null;
      evaluation_approval_pct: number | null;
      avg_score_pct: number | null;
      total_hours: number | null;
      performance_index: number | null;
    }>`
      WITH task_stats AS (
        SELECT
          t.user_id,
          ROUND(
            COUNT(*) FILTER (WHERE t.status = 'completed') * 100.0
            / NULLIF(COUNT(*), 0), 1
          ) AS task_completion_pct
        FROM tasks t
        WHERE t.assigned_date::date BETWEEN ${from}::date AND ${to}::date
        GROUP BY t.user_id
      ),
      eval_stats AS (
        SELECT
          e.user_id,
          ROUND(
            COUNT(*) FILTER (
              WHERE e.status = 'completed' AND e.max_score > 0
                AND e.score * 100.0 / e.max_score >= 60
            ) * 100.0
            / NULLIF(COUNT(*) FILTER (WHERE e.status = 'completed'), 0), 1
          ) AS evaluation_approval_pct,
          ROUND(
            AVG(
              CASE WHEN e.status = 'completed' AND e.max_score > 0
                THEN e.score * 100.0 / e.max_score END
            ), 1
          ) AS avg_score_pct
        FROM evaluations e
        WHERE e.assigned_date::date BETWEEN ${from}::date AND ${to}::date
        GROUP BY e.user_id
      ),
      session_stats AS (
        SELECT ws.user_id,
          ROUND(COALESCE(SUM(ws.duration), 0) / 3600.0, 1) AS total_hours
        FROM work_sessions ws
        WHERE ws.session_date::date BETWEEN ${from}::date AND ${to}::date
        GROUP BY ws.user_id
      )
      SELECT
        u.id AS user_id,
        u.name AS user_name,
        COALESCE(ts.task_completion_pct, 0) AS task_completion_pct,
        COALESCE(es.evaluation_approval_pct, 0) AS evaluation_approval_pct,
        COALESCE(es.avg_score_pct, 0) AS avg_score_pct,
        COALESCE(ss.total_hours, 0) AS total_hours,
        ROUND(
          COALESCE(ts.task_completion_pct, 0) * 0.4 +
          COALESCE(es.evaluation_approval_pct, 0) * 0.4 +
          LEAST(COALESCE(ss.total_hours, 0) / 200.0 * 100.0, 100) * 0.2, 1
        ) AS performance_index
      FROM users u
      LEFT JOIN task_stats ts ON ts.user_id = u.id
      LEFT JOIN eval_stats es ON es.user_id = u.id
      LEFT JOIN session_stats ss ON ss.user_id = u.id
      WHERE u.role = 'user'
      ORDER BY performance_index DESC, user_name ASC
    `;

    return rows.map((row) => ({
      user_id: row.user_id,
      user_name: row.user_name,
      task_completion_pct: Number(row.task_completion_pct ?? 0),
      evaluation_approval_pct: Number(row.evaluation_approval_pct ?? 0),
      avg_score_pct: Number(row.avg_score_pct ?? 0),
      total_hours: Number(row.total_hours ?? 0),
      performance_index: Number(row.performance_index ?? 0),
    }));
  },

  // ==========================================
  // SECTION: INDIVIDUAL PERFORMANCE
  // ==========================================

  /**
   * Admin view of a single user's performance for the date range [from, to].
   */
  async getAdminUserPerformance(userId: string, from: string, to: string) {
    const [userResult] = await sql<{ id: string; name: string }>`
      SELECT id, name FROM users WHERE id = ${userId} AND role = 'user' LIMIT 1
    `;
    if (!userResult) throw new Error("User not found");

    const [taskResult] = await sql<{
      task_completion_pct: number | null;
      on_time_task_pct: number | null;
    }>`
      SELECT
        ROUND(
          COUNT(*) FILTER (WHERE status = 'completed') * 100.0
          / NULLIF(COUNT(*), 0), 1
        ) AS task_completion_pct,
        ROUND(
          COUNT(*) FILTER (
            WHERE status = 'completed'
              AND completed_date IS NOT NULL AND due_date IS NOT NULL
              AND completed_date::date <= due_date::date
          ) * 100.0
          / NULLIF(COUNT(*) FILTER (WHERE status = 'completed'), 0), 1
        ) AS on_time_task_pct
      FROM tasks
      WHERE user_id = ${userId}
        AND assigned_date::date BETWEEN ${from}::date AND ${to}::date
    `;

    const [evalResult] = await sql<{
      evaluation_completion_pct: number | null;
      evaluation_approval_pct: number | null;
      avg_score_pct: number | null;
    }>`
      SELECT
        ROUND(
          COUNT(*) FILTER (WHERE status = 'completed') * 100.0
          / NULLIF(COUNT(*), 0), 1
        ) AS evaluation_completion_pct,
        ROUND(
          COUNT(*) FILTER (
            WHERE status = 'completed' AND max_score > 0
              AND score * 100.0 / max_score >= 60
          ) * 100.0
          / NULLIF(COUNT(*) FILTER (WHERE status = 'completed'), 0), 1
        ) AS evaluation_approval_pct,
        ROUND(
          AVG(
            CASE WHEN status = 'completed' AND max_score > 0
              THEN score * 100.0 / max_score END
          ), 1
        ) AS avg_score_pct
      FROM evaluations
      WHERE user_id = ${userId}
        AND assigned_date::date BETWEEN ${from}::date AND ${to}::date
    `;

    const [sessionResult] = await sql<{ total_hours: number | null }>`
      SELECT ROUND(COALESCE(SUM(duration), 0) / 3600.0, 1) AS total_hours
      FROM work_sessions
      WHERE user_id = ${userId}
        AND session_date::date BETWEEN ${from}::date AND ${to}::date
    `;

    return {
      user_id: userResult.id,
      user_name: userResult.name,
      task_completion_pct: Number(taskResult?.task_completion_pct ?? 0),
      on_time_task_pct: Number(taskResult?.on_time_task_pct ?? 0),
      evaluation_completion_pct: Number(evalResult?.evaluation_completion_pct ?? 0),
      evaluation_approval_pct: Number(evalResult?.evaluation_approval_pct ?? 0),
      avg_score_pct: Number(evalResult?.avg_score_pct ?? 0),
      total_hours: Number(sessionResult?.total_hours ?? 0),
    };
  },

  /**
   * User's own performance view for the date range [from, to].
   */
  async getUserOwnPerformance(userId: string, from: string, to: string) {
    const [userResult] = await sql<{ id: string; name: string }>`
      SELECT id, name FROM users WHERE id = ${userId} AND role = 'user' LIMIT 1
    `;
    if (!userResult) throw new Error("User not found");

    const [taskResult] = await sql<{
      task_completion_pct: number | null;
      on_time_task_pct: number | null;
    }>`
      SELECT
        ROUND(
          COUNT(*) FILTER (WHERE status = 'completed') * 100.0
          / NULLIF(COUNT(*), 0), 1
        ) AS task_completion_pct,
        ROUND(
          COUNT(*) FILTER (
            WHERE status = 'completed'
              AND completed_date IS NOT NULL AND due_date IS NOT NULL
              AND completed_date::date <= due_date::date
          ) * 100.0
          / NULLIF(COUNT(*) FILTER (WHERE status = 'completed'), 0), 1
        ) AS on_time_task_pct
      FROM tasks
      WHERE user_id = ${userId}
        AND assigned_date::date BETWEEN ${from}::date AND ${to}::date
    `;

    const [evalResult] = await sql<{
      evaluation_completion_pct: number | null;
      evaluation_approval_pct: number | null;
      avg_score_pct: number | null;
    }>`
      SELECT
        ROUND(
          COUNT(*) FILTER (WHERE status = 'completed') * 100.0
          / NULLIF(COUNT(*), 0), 1
        ) AS evaluation_completion_pct,
        ROUND(
          COUNT(*) FILTER (
            WHERE status = 'completed' AND max_score > 0
              AND score * 100.0 / max_score >= 60
          ) * 100.0
          / NULLIF(COUNT(*) FILTER (WHERE status = 'completed'), 0), 1
        ) AS evaluation_approval_pct,
        ROUND(
          AVG(
            CASE WHEN status = 'completed' AND max_score > 0
              THEN score * 100.0 / max_score END
          ), 1
        ) AS avg_score_pct
      FROM evaluations
      WHERE user_id = ${userId}
        AND assigned_date::date BETWEEN ${from}::date AND ${to}::date
    `;

    const [sessionResult] = await sql<{ total_hours: number | null }>`
      SELECT ROUND(COALESCE(SUM(duration), 0) / 3600.0, 1) AS total_hours
      FROM work_sessions
      WHERE user_id = ${userId}
        AND session_date::date BETWEEN ${from}::date AND ${to}::date
    `;

    return {
      user_id: userResult.id,
      user_name: userResult.name,
      task_completion_pct: Number(taskResult?.task_completion_pct ?? 0),
      on_time_task_pct: Number(taskResult?.on_time_task_pct ?? 0),
      evaluation_completion_pct: Number(evalResult?.evaluation_completion_pct ?? 0),
      evaluation_approval_pct: Number(evalResult?.evaluation_approval_pct ?? 0),
      avg_score_pct: Number(evalResult?.avg_score_pct ?? 0),
      total_hours: Number(sessionResult?.total_hours ?? 0),
    };
  },
};
