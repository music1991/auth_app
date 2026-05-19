// CY-01 — Auth completa

describe("CY-01 — Auth completa", () => {
  it("login exitoso redirige al dashboard", () => {
    cy.loginAs("emlopezgonzalez@gmail.com", "Teams2026!");
    cy.visit("/dashboard/admin");
    cy.url().should("include", "/dashboard");
  });

  it("login con credenciales incorrectas muestra error", () => {
    cy.visit("/login");
    cy.get('input[type="email"]').type("noexiste@test.com");
    cy.get('input[type="password"]').type("Wrongpass.1");
    cy.get('button[type="submit"]').click();
    cy.url().should("include", "/login");
  });

  it("ruta protegida sin sesión redirige a login", () => {
    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.visit("/dashboard/user", { failOnStatusCode: false });
    cy.url().should("include", "/login");
  });
});
