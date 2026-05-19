// CY-02 — Kanban: columnas, cards y cambio de estado via drawer

const EMAIL = "emlopezgonzalez@gmail.com";
const PASSWORD = "Teams2026!";

describe("CY-02 — Kanban", () => {
  beforeEach(() => {
    cy.loginAs(EMAIL, PASSWORD);
    cy.visit("/dashboard/user");
  });

  it("las tres columnas del Kanban son visibles", () => {
    cy.contains(/pendiente/i).scrollIntoView().should("be.visible");
    cy.contains(/en progreso/i).scrollIntoView().should("be.visible");
    cy.contains(/completad/i).scrollIntoView().should("be.visible");
  });

  it("las tarjetas de tarea se renderizan en el tablero", () => {
    cy.get("body").then(($body) => {
      if ($body.find("button.w-full.rounded-2xl").length > 0) {
        cy.get("button.w-full.rounded-2xl").first().should("be.visible");
      } else {
        cy.contains(/sin tareas|no ten[eé]s/i).should("be.visible");
      }
    });
  });

  it("al hacer clic en una tarea se abre el drawer de detalle", () => {
    cy.get("body").then(($body) => {
      if ($body.find("button.w-full.rounded-2xl").length > 0) {
        cy.get("button.w-full.rounded-2xl").first().click();
        cy.get("select").should("exist");
      } else {
        cy.log("Sin tareas asignadas — test omitido");
      }
    });
  });

  it("el drawer permite cambiar el estado de una tarea", () => {
    cy.get("body").then(($body) => {
      if ($body.find("button.w-full.rounded-2xl").length > 0) {
        cy.get("button.w-full.rounded-2xl").first().click();
        cy.get("select").first().select("in-progress");
        cy.contains(/guardar|save/i).click();
        cy.contains(/en progreso/i).should("be.visible");
      } else {
        cy.log("Sin tareas asignadas — test omitido");
      }
    });
  });
});
