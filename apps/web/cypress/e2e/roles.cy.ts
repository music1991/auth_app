// CY-05 — Control de roles

const EMAIL = "emlopezgonzalez@gmail.com";
const PASSWORD = "Teams2026!";

describe("CY-05 — Control de roles", () => {
  it("admin puede acceder a /dashboard/admin", () => {
    cy.loginAs(EMAIL, PASSWORD);
    cy.visit("/dashboard/admin");
    cy.contains(/panel de administración/i).should("be.visible");
  });

  it("usuario sin sesión es redirigido a login al visitar rutas protegidas", () => {
    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    const rutasProtegidas = ["/dashboard/user", "/dashboard/admin", "/profile", "/users"];
    rutasProtegidas.forEach((ruta) => {
      cy.visit(ruta, { failOnStatusCode: false });
      cy.url().should("include", "/login");
    });
  });
});
