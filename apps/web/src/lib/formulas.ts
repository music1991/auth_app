/**
 * Fórmulas de negocio de Teams Improve.
 *
 * Funciones puras extraídas de las queries SQL y la lógica del sistema
 * para permitir testing unitario aislado.
 *
 * Referencia: §10.1 Fórmulas implementadas — documento TFI UTN-FRT.
 */

/**
 * Calcula el índice de desempeño compuesto de un usuario.
 *
 * Pesos: Tareas 40% + Aprobación evaluaciones 40% + Horas sesión 20%.
 * Las horas se normalizan sobre 200h (referencia = jornada laboral mensual completa).
 * Capped en 100 para evitar que horas extra inflen el índice.
 *
 * Usado en: ranking del equipo (RF-16), tab Desempeño del admin.
 */
export function calcPerformanceIndex(
  taskCompletionPct: number,
  evaluationApprovalPct: number,
  totalHours: number
): number {
  const normalizedHours = Math.min((totalHours / 200) * 100, 100);
  return (
    taskCompletionPct * 0.4 +
    evaluationApprovalPct * 0.4 +
    normalizedHours * 0.2
  );
}

/**
 * Determina si una evaluación está aprobada según el umbral configurado.
 *
 * El umbral `passingScorePct` se almacena en `evaluation_templates.passing_score_pct`
 * con default 60. Retorna false si maxScore es 0 (evaluación sin puntaje).
 *
 * Usado en: cálculo de evaluation_approval_pct (RF-16, RF-17, RF-18).
 */
export function isEvaluationApproved(
  score: number,
  maxScore: number,
  passingScorePct: number = 60
): boolean {
  if (maxScore <= 0) return false;
  return (score / maxScore) * 100 >= passingScorePct;
}

/**
 * Convierte segundos acumulados de sesión al formato "Xh Ym".
 *
 * Mismo formato que retorna `getUserStats` en tasks-db.ts para
 * `today_work_time`. Retorna "0h 0m" para valores nulos o negativos.
 *
 * Usado en: UserStats, panel de presencia (RF-15, RF-18).
 */
export function formatWorkSeconds(seconds: number): string {
  if (!seconds || seconds < 0) return "0h 0m";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}
