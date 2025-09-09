// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

/// <reference types="cypress" />

// Custom command to stub login since auth is not fully implemented
Cypress.Commands.add('stubLogin', () => {
  // Since Supabase auth is not fully implemented, we'll navigate directly to dashboard
  cy.visit('/user/dashboard')
})

// Custom command to check if dashboard widgets are loaded
Cypress.Commands.add('checkDashboardWidgets', () => {
  // Check Miro iframe
  cy.get('iframe').should('have.attr', 'src').and('include', 'miro.com')

  // Check Latitude widget
  cy.contains('Latitude AI Output').should('be.visible')

  // Check Airtable widget
  cy.contains('Airtable Data').should('be.visible')
})

declare global {
  namespace Cypress {
    interface Chainable {
      stubLogin(): Chainable<void>
      checkDashboardWidgets(): Chainable<void>
    }
  }
}

export {}