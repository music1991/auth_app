/**
 * Tests unitarios — src/lib/formulas.ts
 *
 * Verifica las fórmulas de negocio centrales del sistema.
 * Cada caso de prueba incluye la verificación con datos reales
 * del documento TFI (§10.1 Fórmulas implementadas).
 *
 * Trazabilidad de requerimientos:
 *   - calcPerformanceIndex → RF-16 (KPIs equipo), RF-17 (KPI individual admin)
 *   - isEvaluationApproved → RF-16, RF-17, RF-18 (% aprobación = score >= 60% del max)
 *   - formatWorkSeconds    → RF-15 (presencia), RF-18 (horas de sesión usuario)
 */

import {
  calcPerformanceIndex,
  isEvaluationApproved,
  formatWorkSeconds,
} from "@/lib/formulas";

// ─────────────────────────────────────────────
// calcPerformanceIndex
//
// Fórmula: (tareas × 0.40) + (aprobación × 0.40) + (MIN(horas/200×100, 100) × 0.20)
// Documentada en §10.1 del TFI.
// ─────────────────────────────────────────────
describe("calcPerformanceIndex", () => {
  /**
   * Caso de verificación real extraído del documento TFI §10.1:
   * Lucas — 100% tareas, 0% aprobación, 2.2 horas de sesión → índice 40.2
   *
   * Cálculo manual:
   *   tareas:    100 × 0.40 = 40
   *   aprobación:  0 × 0.40 =  0
   *   horas:   MIN(2.2/200×100, 100) × 0.20 = MIN(1.1, 100) × 0.20 = 0.22
   *   total: 40.22 → redondeado a 1 decimal = 40.2
   */
  it("reproduce el caso real del documento TFI (Lucas: 40.2)", () => {
    const result = calcPerformanceIndex(100, 0, 2.2);
    expect(Math.round(result * 10) / 10).toBe(40.2);
  });

  it("retorna 0 cuando todos los valores son 0", () => {
    expect(calcPerformanceIndex(0, 0, 0)).toBe(0);
  });

  it("retorna 100 con rendimiento perfecto (100% tareas, 100% aprobación, 200h+)", () => {
    expect(calcPerformanceIndex(100, 100, 200)).toBe(100);
  });

  it("capea la contribución de horas en 20 aunque se superen las 200h", () => {
    // 500h → MIN(500/200×100, 100) × 0.20 = 100 × 0.20 = 20 (mismo que con 200h)
    const con500h = calcPerformanceIndex(0, 0, 500);
    const con200h = calcPerformanceIndex(0, 0, 200);
    expect(con500h).toBe(con200h);
    expect(con500h).toBe(20);
  });

  it("calcula correctamente un caso intermedio (50% tareas, 80% aprobación, 100h)", () => {
    // 50×0.4 + 80×0.4 + MIN(100/200×100, 100)×0.2 = 20 + 32 + 10 = 62
    expect(calcPerformanceIndex(50, 80, 100)).toBe(62);
  });

  it("los pesos suman exactamente 100 en el mejor caso posible", () => {
    expect(calcPerformanceIndex(100, 100, 200)).toBe(100);
  });

  it("las horas no aportan cuando son 0 (peso horas = 0)", () => {
    const sinHoras = calcPerformanceIndex(80, 60, 0);
    // 80×0.4 + 60×0.4 + 0 = 32 + 24 = 56
    expect(sinHoras).toBe(56);
  });
});

// ─────────────────────────────────────────────
// isEvaluationApproved
//
// Regla: score >= passingScorePct% del max_score.
// Default passingScorePct = 60 (campo en evaluation_templates).
// ─────────────────────────────────────────────
describe("isEvaluationApproved", () => {
  it("aprueba cuando el score es exactamente el umbral mínimo (60/100)", () => {
    expect(isEvaluationApproved(60, 100)).toBe(true);
  });

  it("aprueba cuando el score supera el umbral (80/100)", () => {
    expect(isEvaluationApproved(80, 100)).toBe(true);
  });

  it("no aprueba cuando el score está por debajo del umbral (59/100)", () => {
    expect(isEvaluationApproved(59, 100)).toBe(false);
  });

  it("no aprueba con score 0 sobre cualquier max", () => {
    expect(isEvaluationApproved(0, 100)).toBe(false);
  });

  it("respeta un umbral personalizado mayor al default (75%)", () => {
    expect(isEvaluationApproved(74, 100, 75)).toBe(false);
    expect(isEvaluationApproved(75, 100, 75)).toBe(true);
  });

  it("respeta un umbral personalizado menor al default (50%)", () => {
    expect(isEvaluationApproved(50, 100, 50)).toBe(true);
    expect(isEvaluationApproved(49, 100, 50)).toBe(false);
  });

  it("funciona correctamente con max_score distinto de 100 (ej: 50 puntos)", () => {
    // 30/50 = 60% → aprueba con umbral 60
    expect(isEvaluationApproved(30, 50)).toBe(true);
    // 29/50 = 58% → no aprueba
    expect(isEvaluationApproved(29, 50)).toBe(false);
  });

  it("retorna false cuando max_score es 0 (evita división por cero)", () => {
    expect(isEvaluationApproved(0, 0)).toBe(false);
  });

  it("retorna false cuando max_score es negativo", () => {
    expect(isEvaluationApproved(10, -1)).toBe(false);
  });
});

// ─────────────────────────────────────────────
// formatWorkSeconds
// ─────────────────────────────────────────────
describe("formatWorkSeconds", () => {
  it("formatea 3600 segundos como '1h 0m'", () => {
    expect(formatWorkSeconds(3600)).toBe("1h 0m");
  });

  it("formatea 5400 segundos (1h 30m) correctamente", () => {
    expect(formatWorkSeconds(5400)).toBe("1h 30m");
  });

  it("formatea 90 segundos (menos de un minuto completo) como '0h 1m'", () => {
    expect(formatWorkSeconds(90)).toBe("0h 1m");
  });

  it("formatea 7200 segundos como '2h 0m'", () => {
    expect(formatWorkSeconds(7200)).toBe("2h 0m");
  });

  it("retorna '0h 0m' cuando los segundos son 0", () => {
    expect(formatWorkSeconds(0)).toBe("0h 0m");
  });

  it("retorna '0h 0m' cuando el valor es negativo", () => {
    expect(formatWorkSeconds(-100)).toBe("0h 0m");
  });

  it("maneja jornadas largas correctamente (10h 45m = 38700s)", () => {
    expect(formatWorkSeconds(38700)).toBe("10h 45m");
  });
});
