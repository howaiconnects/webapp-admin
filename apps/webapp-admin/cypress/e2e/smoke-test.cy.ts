describe('MVP Smoke Test', () => {
  beforeEach(() => {
    // Ensure the app is running
    cy.visit('/')
  })

  it('should load the landing page successfully', () => {
    // Check landing page elements
    cy.contains('How AI Connects').should('be.visible')
    cy.contains('Discover the power of AI-driven connections').should('be.visible')
    cy.contains('Get Started').should('be.visible')
  })

  it('should navigate to dashboard and load all widgets', () => {
    // Since auth is not fully implemented, navigate directly to dashboard
    cy.stubLogin()

    // Verify dashboard loads
    cy.contains('Unified Dashboard').should('be.visible')
    cy.contains('All your AI tools in one place').should('be.visible')

    // Check all dashboard widgets are present
    cy.checkDashboardWidgets()

    // Verify specific widget titles
    cy.contains('Miro Board').should('be.visible')
    cy.contains('Latitude AI Output').should('be.visible')
    cy.contains('Airtable Data').should('be.visible')
  })

  it('should handle dashboard interactions', () => {
    cy.stubLogin()

    // Test Latitude prompt button (should be clickable)
    cy.contains('Run Sample Prompt').should('be.visible').and('not.be.disabled')

    // Test that widgets are properly rendered
    cy.get('[data-testid="dashboard-widget"]').should('have.length.at.least', 3)
  })

  it('should handle error scenarios gracefully', () => {
    cy.stubLogin()

    // Test Latitude prompt button (should be clickable)
    cy.contains('Run Sample Prompt').click()

    // Should show loading state then either success or error message
    cy.get('body').should('contain', 'Generating...')
  })
})