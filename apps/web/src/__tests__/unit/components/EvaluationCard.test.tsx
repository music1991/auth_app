/**
 * Tests unitarios — components/dashboard/EvaluationCard.tsx
 *
 * Componente de tarjeta para plantillas de evaluación en el panel admin.
 * Contiene lógica de renderizado condicional (botón Publicar solo en draft)
 * e interacción con callbacks del padre (onPublish, onManageAssignments).
 *
 * Dependencias reales utilizadas (sin mock):
 *   - constants.ts: EVALUATION_TYPE_LABELS, TEMPLATE_STATUS_LABELS, MODE
 *   - utils.ts: formatDateShort
 *
 * Trazabilidad de requerimientos:
 *   - RF-11 (crear plantillas de evaluación y publicarlas)
 *   - RF-14 (gestión de asignaciones de evaluaciones)
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { EvaluationCard } from "@/components/dashboard/EvaluationCard";
import type { EvaluationTemplateItem } from "@/types";

// ─────────────────────────────────────────────
// Fixture base reutilizable
// ─────────────────────────────────────────────
const baseEval: EvaluationTemplateItem = {
  id: "eval-uuid-001",
  title: "Evaluación de Skills Q1 2026",
  description: "Evaluación técnica del primer trimestre",
  type: "skills",
  status: "draft",
  createdDate: "2026-03-01",
  dueDate: "2026-03-31",
  assignedUsers: 5,
  responses: 0,
  completionRate: 0,
  online: true,
};

const noopPublish = jest.fn();
const noopManage = jest.fn();
const noopViewResults = jest.fn();

afterEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────
// Contenido renderizado
// ─────────────────────────────────────────────
describe("EvaluationCard — contenido", () => {
  it("muestra el título de la evaluación", () => {
    render(
      <EvaluationCard
        evaluation={baseEval}
        onPublish={noopPublish}
        onManageAssignments={noopManage}
        onViewResults={noopViewResults}
      />
    );
    expect(screen.getByText("Evaluación de Skills Q1 2026")).toBeInTheDocument();
  });

  it("muestra la descripción", () => {
    render(
      <EvaluationCard
        evaluation={baseEval}
        onPublish={noopPublish}
        onManageAssignments={noopManage}
        onViewResults={noopViewResults}
      />
    );
    expect(
      screen.getByText("Evaluación técnica del primer trimestre")
    ).toBeInTheDocument();
  });

  it("muestra el label de tipo correcto ('Skills' para tipo 'skills')", () => {
    render(
      <EvaluationCard
        evaluation={baseEval}
        onPublish={noopPublish}
        onManageAssignments={noopManage}
        onViewResults={noopViewResults}
      />
    );
    expect(screen.getByText("Skills")).toBeInTheDocument();
  });

  it("muestra 'Online' cuando online=true", () => {
    render(
      <EvaluationCard
        evaluation={baseEval}
        onPublish={noopPublish}
        onManageAssignments={noopManage}
        onViewResults={noopViewResults}
      />
    );
    expect(screen.getByText("Online")).toBeInTheDocument();
  });

  it("muestra 'Presencial' cuando online=false", () => {
    render(
      <EvaluationCard
        evaluation={{ ...baseEval, online: false }}
        onPublish={noopPublish}
        onManageAssignments={noopManage}
        onViewResults={noopViewResults}
      />
    );
    expect(screen.getByText("Presencial")).toBeInTheDocument();
  });

  it("muestra el label de status 'Sin publicar' para estado draft", () => {
    render(
      <EvaluationCard
        evaluation={baseEval}
        onPublish={noopPublish}
        onManageAssignments={noopManage}
        onViewResults={noopViewResults}
      />
    );
    expect(screen.getByText("Sin publicar")).toBeInTheDocument();
  });

  it("muestra el label de status 'Publicada' para estado active", () => {
    render(
      <EvaluationCard
        evaluation={{ ...baseEval, status: "active" }}
        onPublish={noopPublish}
        onManageAssignments={noopManage}
        onViewResults={noopViewResults}
      />
    );
    expect(screen.getByText("Publicada")).toBeInTheDocument();
  });

  it("muestra el label de status 'Finalizada' para estado completed", () => {
    render(
      <EvaluationCard
        evaluation={{ ...baseEval, status: "completed" }}
        onPublish={noopPublish}
        onManageAssignments={noopManage}
        onViewResults={noopViewResults}
      />
    );
    expect(screen.getByText("Finalizada")).toBeInTheDocument();
  });

  it("muestra la cantidad de usuarios asignados", () => {
    render(
      <EvaluationCard
        evaluation={baseEval}
        onPublish={noopPublish}
        onManageAssignments={noopManage}
        onViewResults={noopViewResults}
      />
    );
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("muestra la fecha límite formateada", () => {
    render(
      <EvaluationCard
        evaluation={baseEval}
        onPublish={noopPublish}
        onManageAssignments={noopManage}
        onViewResults={noopViewResults}
      />
    );
    expect(screen.getByText(/31\/03\/2026/)).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────
// Lógica condicional — botón Publicar
// ─────────────────────────────────────────────
describe("EvaluationCard — botón Publicar (RF-11)", () => {
  it("muestra el botón 'Publicar' cuando el estado es 'draft'", () => {
    render(
      <EvaluationCard
        evaluation={baseEval}
        onPublish={noopPublish}
        onManageAssignments={noopManage}
        onViewResults={noopViewResults}
      />
    );
    expect(screen.getByRole("button", { name: /publicar/i })).toBeInTheDocument();
  });

  it("NO muestra el botón 'Publicar' cuando el estado es 'active'", () => {
    render(
      <EvaluationCard
        evaluation={{ ...baseEval, status: "active" }}
        onPublish={noopPublish}
        onManageAssignments={noopManage}
        onViewResults={noopViewResults}
      />
    );
    expect(
      screen.queryByRole("button", { name: /publicar/i })
    ).not.toBeInTheDocument();
  });

  it("NO muestra el botón 'Publicar' cuando el estado es 'completed'", () => {
    render(
      <EvaluationCard
        evaluation={{ ...baseEval, status: "completed" }}
        onPublish={noopPublish}
        onManageAssignments={noopManage}
        onViewResults={noopViewResults}
      />
    );
    expect(
      screen.queryByRole("button", { name: /publicar/i })
    ).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────
// Interacciones — callbacks
// ─────────────────────────────────────────────
describe("EvaluationCard — interacciones", () => {
  it("llama a onPublish con el id correcto al hacer clic en Publicar", () => {
    render(
      <EvaluationCard
        evaluation={baseEval}
        onPublish={noopPublish}
        onManageAssignments={noopManage}
        onViewResults={noopViewResults}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /publicar/i }));
    expect(noopPublish).toHaveBeenCalledTimes(1);
    expect(noopPublish).toHaveBeenCalledWith("eval-uuid-001");
  });

  it("llama a onManageAssignments con id y dueDate al hacer clic en Gestionar", () => {
    render(
      <EvaluationCard
        evaluation={baseEval}
        onPublish={noopPublish}
        onManageAssignments={noopManage}
        onViewResults={noopViewResults}
      />
    );
    fireEvent.click(
      screen.getByRole("button", { name: /gestionar asignaciones/i })
    );
    expect(noopManage).toHaveBeenCalledTimes(1);
    expect(noopManage).toHaveBeenCalledWith("eval-uuid-001", "2026-03-31");
  });

  it("siempre muestra el botón 'Gestionar asignaciones' sin importar el estado", () => {
    const statuses: EvaluationTemplateItem["status"][] = [
      "draft",
      "active",
      "completed",
    ];
    statuses.forEach((status) => {
      const { unmount } = render(
        <EvaluationCard
          evaluation={{ ...baseEval, status }}
          onPublish={noopPublish}
          onManageAssignments={noopManage}
          onViewResults={noopViewResults}
        />
      );
      expect(
        screen.getByRole("button", { name: /gestionar asignaciones/i })
      ).toBeInTheDocument();
      unmount();
    });
  });
});
