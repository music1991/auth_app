import { sql } from "./db";

function getPeriodDays(period?: string) {
  switch (period) {
    case "7d":  return 7;
    case "90d": return 90;
    case "30d":
    default:    return 30;
  }
}

// ==========================================
// SECTION: TEAM ANALYTICS (ADMIN)
// ==========================================

export const analyticsDb = {
  async getAnalyticsUsers() {
    return await sql<{ id: string; name: string; email: string }>`
      SELECT id, name, email
      FROM users
      WHERE role = 'user'
      ORDER BY name ASC
    `;
  },

  async getAdminTeamStats(period = "30d") {
    const days = getPeriodDays(period);

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
           AND ws.session_date >= CURRENT_DATE - ${days} * INTERVAL '1 day'
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
        AND t.assigned_date >= NOW() - ${days} * INTERVAL '1 day'
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
        AND e.assigned_date >= NOW() - ${days} * INTERVAL '1 day'
    `;

    const [sessionsResult] = await sql<{ total_session_hours: number | null }>`
      SELECT ROUND(COALESCE(SUM(ws.duration), 0) / 3600.0, 1) AS total_session_hours
      FROM work_sessions ws
      JOIN users u ON u.id = ws.user_id
      WHERE u.role = 'user'
        AND ws.session_date >= CURRENT_DATE - ${days} * INTERVAL '1 day'
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

  async getAdminTeamRanking(period = "30d") {
    const days = getPeriodDays(period);

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
        WHERE t.assigned_date >= NOW() - ${days} * INTERVAL '1 day'
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
        WHERE e.assigned_date >= NOW() - ${days} * INTERVAL '1 day'
        GROUP BY e.user_id
      ),
      session_stats AS (
        SELECT ws.user_id,
          ROUND(COALESCE(SUM(ws.duration), 0) / 3600.0, 1) AS total_hours
        FROM work_sessions ws
        WHERE ws.session_date >= CURRENT_DATE - ${days} * INTERVAL '1 day'
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

  async getAdminUserPerformance(userId: string, period = "30d") {
    const days = getPeriodDays(period);

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
              AND completed_date <= due_date
          ) * 100.0
          / NULLIF(COUNT(*) FILTER (WHERE status = 'completed'), 0), 1
        ) AS on_time_task_pct
      FROM tasks
      WHERE user_id = ${userId}
        AND assigned_date >= NOW() - ${days} * INTERVAL '1 day'
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
        AND assigned_date >= NOW() - ${days} * INTERVAL '1 day'
    `;

    const [sessionResult] = await sql<{ total_hours: number | null }>`
      SELECT ROUND(COALESCE(SUM(duration), 0) / 3600.0, 1) AS total_hours
      FROM work_sessions
      WHERE user_id = ${userId}
        AND session_date >= CURRENT_DATE - ${days} * INTERVAL '1 day'
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

  async getUserOwnPerformance(userId: string, period = "30d") {
    const days = getPeriodDays(period);

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
              AND completed_date <= due_date
          ) * 100.0
          / NULLIF(COUNT(*) FILTER (WHERE status = 'completed'), 0), 1
        ) AS on_time_task_pct
      FROM tasks
      WHERE user_id = ${userId}
        AND assigned_date >= NOW() - ${days} * INTERVAL '1 day'
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
        AND assigned_date >= NOW() - ${days} * INTERVAL '1 day'
    `;

    const [sessionResult] = await sql<{ total_hours: number | null }>`
      SELECT ROUND(COALESCE(SUM(duration), 0) / 3600.0, 1) AS total_hours
      FROM work_sessions
      WHERE user_id = ${userId}
        AND session_date >= CURRENT_DATE - ${days} * INTERVAL '1 day'
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
