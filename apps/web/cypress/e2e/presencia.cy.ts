// CY-04 — Presencia en tiempo real con Socket.io

const EMAIL = "emlopezgonzalez@gmail.com";
const PASSWORD = "Teams2026!";

describe("CY-04 — Presencia en tiempo real", () => {
  beforeEach(() => {
    cy.loginAs(EMAIL, PASSWORD);
    cy.visit("/dashboard/admin");
  });

  it("el panel admin carga correctamente", () => {
    cy.contains(/panel de administración/i).should("be.visible");
  });

  it("el websocket de Socket.io establece conexión al cargar el dashboard", () => {
    cy.intercept("GET", "http://localhost:4000/socket.io/*").as("socketHandshake");
    cy.visit("/dashboard/admin");
    cy.wait("@socketHandshake", { timeout: 8000 }).its("response.statusCode").should("eq", 200);
  });

  it("el panel de usuarios muestra indicadores de conexión", () => {
    cy.contains(/conectado|desconectado/i).should("be.visible");
  });
});
