// CY-07 — Reset de contraseña

describe("CY-07 — Reset de contraseña", () => {
  it("muestra toast de confirmación al enviar email de reset", () => {
    cy.visit("/forgot");
    cy.get('input[type="email"]').type("emlopezgonzalez@gmail.com");
    // El botón no tiene type="submit", está dentro de un form con onSubmit
    cy.contains("button", /reset password/i).click();
    // El éxito se muestra como toast: "We've sent a reset link."
    cy.contains(/sent a reset link/i, { timeout: 8000 }).should("be.visible");
  });

  it("token inválido redirige a /reset/expired y muestra error", () => {
    cy.visit("/reset/token-invalido-123", { failOnStatusCode: false });
    // Redirige a /reset/expired con texto en inglés
    cy.url().should("include", "/reset/expired");
    cy.contains(/invalid or has expired/i).should("be.visible");
  });
});
