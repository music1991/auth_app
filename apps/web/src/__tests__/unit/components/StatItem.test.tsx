/**
 * Tests unitarios — components/dashboard/StatItem.tsx
 *
 * Componente presentacional puro: recibe `label` y `value` (ReactNode)
 * y los renderiza sin lógica adicional. Usado extensamente en tarjetas
 * de KPIs del admin y del usuario.
 *
 * No requiere mocks. Testea el contrato visual del componente.
 *
 * Trazabilidad de requerimientos:
 *   - RF-16 (KPIs globales del equipo — cards de stats del admin)
 *   - RF-18 (Mi desempeño — cards de stats del usuario)
 */

import { render, screen } from "@testing-library/react";
import { StatItem } from "@/components/dashboard/StatItem";

describe("StatItem", () => {
  it("renderiza el label correctamente", () => {
    render(<StatItem label="Tareas completadas" value={12} />);
    expect(screen.getByText("Tareas completadas")).toBeInTheDocument();
  });

  it("renderiza un valor numérico", () => {
    render(<StatItem label="Score" value={85} />);
    expect(screen.getByText("85")).toBeInTheDocument();
  });

  it("renderiza un valor string", () => {
    render(<StatItem label="Tiempo" value="2h 30m" />);
    expect(screen.getByText("2h 30m")).toBeInTheDocument();
  });

  it("renderiza un valor ReactNode (elemento JSX)", () => {
    render(
      <StatItem
        label="Estado"
        value={<span data-testid="badge">Activo</span>}
      />
    );
    expect(screen.getByTestId("badge")).toBeInTheDocument();
    expect(screen.getByText("Activo")).toBeInTheDocument();
  });

  it("renderiza el label con estilo de texto pequeño y gris", () => {
    render(<StatItem label="Usuarios" value={5} />);
    const labelEl = screen.getByText("Usuarios");
    expect(labelEl).toHaveClass("text-gray-400");
  });

  it("renderiza el valor con estilo bold", () => {
    render(<StatItem label="Total" value="100%" />);
    const valueEl = screen.getByText("100%");
    expect(valueEl).toHaveClass("font-bold");
  });

  it("muestra ambos elementos en el mismo contenedor", () => {
    const { container } = render(<StatItem label="KPI" value={42} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.children).toHaveLength(2);
  });
});
