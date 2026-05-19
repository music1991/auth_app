/// <reference types="cypress" />

export {};

declare global {
  namespace Cypress {
    interface Chainable {
      loginAs(email: string, password: string): Chainable<void>;
    }
  }
}

// Comando reutilizable con cy.session() — hace login una sola vez y cachea la sesión
Cypress.Commands.add("loginAs", (email: string, password: string) => {
  cy.session(
    [email, password],
    () => {
      cy.visit("/login");
      cy.get('input[type="email"]').type(email);
      cy.get('input[type="password"]').type(password);
      cy.get('button[type="submit"]').click();
      cy.url().should("include", "/dashboard");
    },
    {
      cacheAcrossSpecs: true,
    }
  );
});
