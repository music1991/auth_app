/**
 * Tests unitarios — src/lib/utils.ts
 *
 * Cubre todas las funciones utilitarias puras del sistema.
 * Al ser funciones sin efectos secundarios ni dependencias externas,
 * se testean de forma aislada sin mocks.
 *
 * Trazabilidad de requerimientos:
 *   - normalizeUrl        → RF-04 (recursos de aprendizaje con URLs externas)
 *   - getResourceTypeLabel → RF-04 (labels de tipos de recurso en la UI)
 *   - buildAssignmentUsers → RF-14 (gestión de asignaciones en evaluaciones)
 *   - formatDateShort      → RF-06, RF-07 (fechas en tarjetas Kanban)
 *   - isStrongPassword     → RF-01 (validación de contraseña en registro)
 *   - extractGoogleFormId  → RF-12 (evaluaciones virtuales con Google Forms)
 */

import {
  normalizeUrl,
  getResourceTypeLabel,
  buildAssignmentUsers,
  formatDateShort,
  isStrongPassword,
  extractGoogleFormId,
} from "@/lib/utils";
import type { AdminUser } from "@/types";

// ─────────────────────────────────────────────
// normalizeUrl
// ─────────────────────────────────────────────
describe("normalizeUrl", () => {
  it("retorna '#' cuando la URL es undefined", () => {
    expect(normalizeUrl(undefined)).toBe("#");
  });

  it("retorna '#' cuando la URL es string vacío", () => {
    expect(normalizeUrl("")).toBe("#");
  });

  it("no modifica una URL que ya tiene https://", () => {
    expect(normalizeUrl("https://example.com")).toBe("https://example.com");
  });

  it("no modifica una URL que ya tiene http://", () => {
    expect(normalizeUrl("http://example.com")).toBe("http://example.com");
  });

  it("agrega https:// a una URL sin protocolo", () => {
    expect(normalizeUrl("coursera.org/course/react")).toBe(
      "https://coursera.org/course/react"
    );
  });

  it("agrega https:// a una URL con solo dominio", () => {
    expect(normalizeUrl("udemy.com")).toBe("https://udemy.com");
  });
});

// ─────────────────────────────────────────────
// getResourceTypeLabel
// ─────────────────────────────────────────────
describe("getResourceTypeLabel", () => {
  it("retorna 'PDF' para tipo 'pdf'", () => {
    expect(getResourceTypeLabel("pdf")).toBe("PDF");
  });

  it("retorna 'PDF' para tipo 'PDF' (case insensitive)", () => {
    expect(getResourceTypeLabel("PDF")).toBe("PDF");
  });

  it("retorna 'Video' para tipo 'video'", () => {
    expect(getResourceTypeLabel("video")).toBe("Video");
  });

  it("retorna 'Link' para tipo 'link'", () => {
    expect(getResourceTypeLabel("link")).toBe("Link");
  });

  it("retorna 'Documento' para tipo 'doc'", () => {
    expect(getResourceTypeLabel("doc")).toBe("Documento");
  });

  it("retorna 'Documento' para tipo 'document'", () => {
    expect(getResourceTypeLabel("document")).toBe("Documento");
  });

  it("retorna el tipo original para tipos desconocidos", () => {
    expect(getResourceTypeLabel("audio")).toBe("audio");
  });

  it("retorna 'Recurso' cuando el tipo es undefined", () => {
    expect(getResourceTypeLabel(undefined)).toBe("Recurso");
  });
});

// ─────────────────────────────────────────────
// buildAssignmentUsers
// ─────────────────────────────────────────────
describe("buildAssignmentUsers", () => {
  const allUsers: AdminUser[] = [
    { id: "u1", name: "Ana García", email: "ana@test.com", role: "user" },
    { id: "u2", name: "Luis Pérez", email: "luis@test.com", role: "user" },
    { id: "u3", name: "Marta López", email: "marta@test.com", role: "user" },
  ];

  it("marca como assigned=true a los usuarios ya asignados", () => {
    const assigned: AdminUser[] = [allUsers[0]];
    const result = buildAssignmentUsers(allUsers, assigned, []);
    expect(result.find((u) => u.id === "u1")?.assigned).toBe(true);
    expect(result.find((u) => u.id === "u2")?.assigned).toBe(false);
  });

  it("marca como selected=true a los IDs en selectedUserIds", () => {
    const result = buildAssignmentUsers(allUsers, [], ["u2", "u3"]);
    expect(result.find((u) => u.id === "u2")?.selected).toBe(true);
    expect(result.find((u) => u.id === "u3")?.selected).toBe(true);
    expect(result.find((u) => u.id === "u1")?.selected).toBe(false);
  });

  it("un usuario puede ser assigned y selected simultáneamente", () => {
    const assigned: AdminUser[] = [allUsers[0]];
    const result = buildAssignmentUsers(allUsers, assigned, ["u1"]);
    const u1 = result.find((u) => u.id === "u1");
    expect(u1?.assigned).toBe(true);
    expect(u1?.selected).toBe(true);
  });

  it("retorna la misma cantidad de usuarios que el listado original", () => {
    const result = buildAssignmentUsers(allUsers, [], []);
    expect(result).toHaveLength(allUsers.length);
  });

  it("conserva los campos originales del usuario (name, email, role)", () => {
    const result = buildAssignmentUsers(allUsers, [], []);
    expect(result[0]).toMatchObject({
      id: "u1",
      name: "Ana García",
      email: "ana@test.com",
      role: "user",
    });
  });

  it("retorna arreglo vacío si no hay usuarios", () => {
    expect(buildAssignmentUsers([], [], [])).toEqual([]);
  });
});

// ─────────────────────────────────────────────
// formatDateShort
// ─────────────────────────────────────────────
describe("formatDateShort", () => {
  it("retorna '—' cuando el valor es undefined", () => {
    expect(formatDateShort(undefined)).toBe("—");
  });

  it("retorna '—' cuando el valor es null", () => {
    expect(formatDateShort(null)).toBe("—");
  });

  it("formatea una fecha ISO 'YYYY-MM-DD' a 'DD/MM/YYYY'", () => {
    expect(formatDateShort("2026-03-15")).toBe("15/03/2026");
  });

  it("extrae solo la parte de fecha de un datetime ISO con T", () => {
    expect(formatDateShort("2026-06-01T00:00:00.000Z")).toBe("01/06/2026");
  });

  it("elimina comillas extras que puede enviar el backend", () => {
    expect(formatDateShort('"2026-12-31"')).toBe("31/12/2026");
  });
});

// ─────────────────────────────────────────────
// isStrongPassword
// ─────────────────────────────────────────────
describe("isStrongPassword", () => {
  it("acepta contraseña con mayúscula, minúscula, punto y 8+ caracteres", () => {
    expect(isStrongPassword("Segura.2026")).toBe(true);
  });

  it("rechaza contraseña sin mayúscula", () => {
    expect(isStrongPassword("minuscula.1")).toBe(false);
  });

  it("rechaza contraseña sin minúscula", () => {
    expect(isStrongPassword("MAYUSCULA.1")).toBe(false);
  });

  it("rechaza contraseña sin punto", () => {
    expect(isStrongPassword("SinPunto123")).toBe(false);
  });

  it("rechaza contraseña menor a 8 caracteres", () => {
    expect(isStrongPassword("Ab.1234")).toBe(false);
  });

  it("rechaza string vacío", () => {
    expect(isStrongPassword("")).toBe(false);
  });
});

// ─────────────────────────────────────────────
// extractGoogleFormId
// ─────────────────────────────────────────────
describe("extractGoogleFormId", () => {
  const VALID_ID = "1FAIpQLSf_ABC123def456GHI789jkl012MNO345pqr678STU901vwx234";

  it("extrae el ID de una URL de edición de Google Forms", () => {
    const url = `https://docs.google.com/forms/d/${VALID_ID}/edit`;
    expect(extractGoogleFormId(url)).toBe(VALID_ID);
  });

  it("extrae el ID de una URL de respuesta embebida (viewform)", () => {
    const url = `https://docs.google.com/forms/d/e/${VALID_ID}/viewform`;
    expect(extractGoogleFormId(url)).toBe(VALID_ID);
  });

  it("retorna el input sin modificar si no es una URL de Forms", () => {
    expect(extractGoogleFormId("no-es-una-url")).toBe("no-es-una-url");
  });

  it("retorna el input si el ID ya fue pegado directamente", () => {
    expect(extractGoogleFormId(VALID_ID)).toBe(VALID_ID);
  });
});
