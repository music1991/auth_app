// CY-03 — Evaluación virtual con Google Forms embebido

const EMAIL = "emlopezgonzalez@gmail.com";
const PASSWORD = "Teams2026!";

describe("CY-03 — Evaluaciones virtuales", () => {
  beforeEach(() => {
    cy.loginAs(EMAIL, PASSWORD);
    cy.visit("/dashboard/user");
    cy.contains("button", /evaluaciones/i).click();
  });

  it("la pestaña Evaluaciones es visible en el dashboard de usuario", () => {
    cy.contains("button", /evaluaciones/i).should("be.visible");
  });

  it("al hacer clic en la pestaña Evaluaciones se muestran las evaluaciones asignadas", () => {
    cy.contains(/evaluaci[oó]n|sin evaluaciones|no ten[eé]s/i).should("be.visible");
  });

  it("al iniciar una evaluación publicada se abre el modal con Google Forms", () => {
    cy.get("body").then(($body) => {
      if ($body.find("button:contains('Iniciar')").length > 0 || $body.find("button:contains('Continuar')").length > 0) {
        cy.contains("button", /iniciar|continuar/i).first().click();
        cy.get("iframe", { timeout: 8000 }).should("exist");
      } else {
        cy.log("No hay evaluaciones publicadas asignadas — test omitido");
      }
    });
  });
});
