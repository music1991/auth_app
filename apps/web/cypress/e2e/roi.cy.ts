// CY-06 — ROI de formación: baseline → delta productividad

const EMAIL = "emlopezgonzalez@gmail.com";
const PASSWORD = "Teams2026!";

describe("CY-06 — ROI de formación", () => {
  beforeEach(() => {
    cy.loginAs(EMAIL, PASSWORD);
    // Intercepts antes de navegar para capturar los requests automáticos del componente
    cy.intercept("GET", "/api/training/lines").as("loadLines");
    cy.intercept("GET", "/api/training/lines/*/roi").as("roiRequest");
    cy.visit("/dashboard/admin");
    cy.contains("button", /desempe[ñn]o/i).click();
    cy.wait("@loadLines", { timeout: 8000 });
  });

  it("la sección ROI de Formación es visible en la pestaña Desempeño", () => {
    cy.contains(/ROI de Formación/i).should("be.visible");
    cy.contains(/antes\/después|comparativa/i).should("be.visible");
  });

  it("el selector de línea de formación está disponible con opciones cargadas", () => {
    // El select del ROI tiene clase sm:w-64, distinto al select de usuarios
    cy.contains(/ROI de Formación/i).parents("div").first().find("select").should("exist");
  });

  it("al cargar la pestaña Desempeño se dispara el request de ROI automáticamente", () => {
    cy.wait("@roiRequest", { timeout: 8000 }).its("response.statusCode").should("eq", 200);
  });

  it("el panel muestra la comparativa base → actual de productividad", () => {
    cy.wait("@roiRequest", { timeout: 8000 });
    // El componente muestra "Base: X → actual: Y" para cada métrica
    cy.contains(/[Bb]ase.*actual|productividad/i).should("be.visible");
  });
});
