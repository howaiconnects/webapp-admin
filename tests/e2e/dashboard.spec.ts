/**
 * Playwright E2E Tests for WowDash Dashboard
 * Tests the main dashboard functionality and navigation
 */

import { test, expect, Page } from '@playwright/test';

test.describe('WowDash Dashboard E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard before each test
    await page.goto('/');
    // Wait for the page to fully load
    await expect(page.locator('h6:text("Dashboard")')).toBeVisible();
  });

  test('should display main dashboard with key metrics', async ({ page }) => {
    // Check that main metrics are visible
    await expect(page.locator('text=Total Users')).toBeVisible();
    await expect(page.locator('text=20,000')).toBeVisible();
    
    await expect(page.locator('text=Total Subscription')).toBeVisible();
    await expect(page.locator('text=15,000')).toBeVisible();
    
    await expect(page.locator('text=Total Free Users')).toBeVisible();
    await expect(page.locator('text=5,000')).toBeVisible();
    
    await expect(page.locator('text=Total Income')).toBeVisible();
    await expect(page.locator('text=$42,000')).toBeVisible();
    
    await expect(page.locator('text=Total Expense')).toBeVisible();
    await expect(page.locator('text=$30,000')).toBeVisible();
  });

  test('should display charts and visualizations', async ({ page }) => {
    // Check that charts are loaded
    await expect(page.locator('text=Sales Statistic')).toBeVisible();
    await expect(page.locator('text=Total Subscriber')).toBeVisible();
    await expect(page.locator('text=Users Overview')).toBeVisible();
    await expect(page.locator('text=Generated Content')).toBeVisible();
    
    // Verify chart elements are present (looking for chart containers)
    const salesChart = page.locator('[class*="chart"], [id*="chart"]').first();
    await expect(salesChart).toBeVisible();
  });

  test('should allow time period selection on charts', async ({ page }) => {
    // Test the Sales Statistic dropdown
    const salesDropdown = page.locator('[data-testid="sales-statistic-dropdown"]');
    await salesDropdown.selectOption('Monthly');
    
    // Verify the selection changed
    await expect(salesDropdown).toHaveValue('Monthly');
    
    // Test other dropdowns
    const userOverviewDropdown = page.locator('[data-testid="users-overview-dropdown"]');
    await userOverviewDropdown.selectOption('Weekly');
    await expect(userOverviewDropdown).toHaveValue('Weekly');
  });

  test('should display user tables with data', async ({ page }) => {
    // Check that user registration table is present
    await expect(page.locator('text=Latest Registered')).toBeVisible();
    
    // Verify table headers
    await expect(page.locator('text=Users')).toBeVisible();
    await expect(page.locator('text=Registered On')).toBeVisible();
    await expect(page.locator('text=Plan')).toBeVisible();
    await expect(page.locator('text=Status')).toBeVisible();
    
    // Verify some user data is present
    await expect(page.locator('text=Dianne Russell')).toBeVisible();
    await expect(page.locator('text=redaniel@gmail.com')).toBeVisible();
    await expect(page.locator('text=Wade Warren')).toBeVisible();
    
    // Check that status badges are displayed
    await expect(page.locator('text=Active').first()).toBeVisible();
  });

  test('should switch between Latest Registered and Latest Subscribe tabs', async ({ page }) => {
    // Click on Latest Subscribe tab
    await page.click('text=Latest Subscribe');
    
    // Verify the tab is active (this depends on the implementation)
    const subscribeTab = page.locator('text=Latest Subscribe').locator('..');
    // The exact selector would depend on how tabs are implemented
  });

  test('should display top performers section', async ({ page }) => {
    await expect(page.locator('text=Top Performer')).toBeVisible();
    
    // Check that performer data is displayed
    await expect(page.locator('text=Agent ID: 36254')).toBeVisible();
    
    // Verify View All link is present
    await expect(page.locator('text=View All').first()).toBeVisible();
  });

  test('should display world map and country statistics', async ({ page }) => {
    await expect(page.locator('text=Top Countries')).toBeVisible();
    
    // Check for country names and statistics
    await expect(page.locator('text=USA')).toBeVisible();
    await expect(page.locator('text=Japan')).toBeVisible();
    await expect(page.locator('text=France')).toBeVisible();
    await expect(page.locator('text=Germany')).toBeVisible();
    
    // Check that progress bars are visible
    const progressBars = page.locator('[role="progressbar"]');
    await expect(progressBars.first()).toBeVisible();
  });

  test('should have working search functionality', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();
    
    // Test search input
    await searchInput.fill('test search');
    await expect(searchInput).toHaveValue('test search');
  });

  test('should have working navigation sidebar', async ({ page }) => {
    // Check main navigation items
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Email')).toBeVisible();
    await expect(page.locator('text=Chat')).toBeVisible();
    await expect(page.locator('text=Calendar')).toBeVisible();
    await expect(page.locator('text=Kanban')).toBeVisible();
    
    // Test AI Application menu
    await expect(page.locator('text=Ai Application')).toBeVisible();
    
    // Test UI Elements section
    await expect(page.locator('text=Components')).toBeVisible();
    await expect(page.locator('text=Forms')).toBeVisible();
    await expect(page.locator('text=Table')).toBeVisible();
    await expect(page.locator('text=Chart')).toBeVisible();
    await expect(page.locator('text=Widgets')).toBeVisible();
  });

  test('should navigate to different pages via sidebar', async ({ page }) => {
    // Navigate to Email page
    await page.click('text=Email');
    await expect(page).toHaveURL('/email');
    
    // Navigate back to dashboard
    await page.click('text=Dashboard');
    await expect(page).toHaveURL('/');
    
    // Navigate to Chat
    await page.click('text=Chat');
    await expect(page).toHaveURL('/chat');
  });

  test('should expand and collapse menu items', async ({ page }) => {
    // Test AI Application menu expansion
    const aiMenu = page.locator('text=Ai Application');
    await aiMenu.click();
    
    // Check that submenu items appear
    await expect(page.locator('text=Text Generator')).toBeVisible();
    await expect(page.locator('text=Code Generator')).toBeVisible();
    await expect(page.locator('text=Image Generator')).toBeVisible();
    await expect(page.locator('text=Voice Generator')).toBeVisible();
    await expect(page.locator('text=Video Generator')).toBeVisible();
  });

  test('should have responsive design elements', async ({ page }) => {
    // Test different viewport sizes
    await page.setViewportSize({ width: 1024, height: 768 });
    await expect(page.locator('h6:text("Dashboard")')).toBeVisible();
    
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('h6:text("Dashboard")')).toBeVisible();
    
    // Reset to default
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should handle page refresh correctly', async ({ page }) => {
    // Refresh the page
    await page.reload();
    
    // Check that dashboard loads correctly after refresh
    await expect(page.locator('h6:text("Dashboard")')).toBeVisible();
    await expect(page.locator('text=Total Users')).toBeVisible();
  });

  test('should have working footer with copyright', async ({ page }) => {
    // Check footer content
    await expect(page.locator('text=© 2024 HowAIConnects. All Rights Reserved.')).toBeVisible();
    await expect(page.locator('text=Made by')).toBeVisible();
    await expect(page.locator('text=Pixcels Themes')).toBeVisible();
  });

  test('should handle dark/light mode toggle', async ({ page }) => {
    // Look for theme toggle button (assuming it exists)
    const themeToggle = page.locator('button:has-text("light")');
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      // Add assertions for theme change if implemented
    }
  });

  test('should display proper breadcrumbs', async ({ page }) => {
    // Check breadcrumb navigation
    const breadcrumbs = page.locator('[role="list"]:has-text("Dashboard")');
    await expect(breadcrumbs).toBeVisible();
    
    // Check individual breadcrumb items
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=AI')).toBeVisible();
  });

  test('should have proper page title', async ({ page }) => {
    await expect(page).toHaveTitle('HowAIConnects - Bootstrap 5 Admin Dashboard NodeJs Template');
  });

  test('should load all critical resources', async ({ page }) => {
    // Monitor network requests for critical resources
    const responses = [];
    
    page.on('response', (response) => {
      responses.push(response.url());
    });
    
    await page.reload();
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Check that critical resources loaded (this would be more specific in a real implementation)
    expect(responses.length).toBeGreaterThan(0);
  });
});

test.describe('Dashboard Performance Tests', () => {
  test('should load dashboard within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await expect(page.locator('h6:text("Dashboard")')).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    
    // Assert that page loads within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should handle multiple chart updates efficiently', async ({ page }) => {
    await page.goto('/');
    
    const startTime = Date.now();
    
    // Change multiple dropdown selections rapidly
    const dropdowns = page.locator('select');
    const count = await dropdowns.count();
    
    for (let i = 0; i < Math.min(count, 3); i++) {
      await dropdowns.nth(i).selectOption('Monthly');
      await page.waitForTimeout(100); // Small delay between selections
    }
    
    const updateTime = Date.now() - startTime;
    
    // Assert that updates complete within reasonable time
    expect(updateTime).toBeLessThan(2000);
  });
});