/**
 * Playwright E2E Tests for AI Applications
 * Tests all AI generator functionality in the WowDash admin
 */

import { test, expect } from '@playwright/test';

test.describe('AI Applications E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Start from the homepage
    await page.goto('/');
    await expect(page.locator('h6:text("Dashboard")')).toBeVisible();
  });

  test.describe('Text Generator Tests', () => {
    test('should navigate to text generator and display interface', async ({ page }) => {
      // Navigate to Text Generator
      await page.click('text=Ai Application');
      await page.click('text=Text Generator');
      
      // Verify we're on the text generator page
      await expect(page).toHaveURL('/ai/text-generator');
      await expect(page.locator('h6:text("Text Generator")')).toBeVisible();
      
      // Check that key elements are present
      await expect(page.locator('text=New Chat')).toBeVisible();
      await expect(page.locator('input[placeholder*="Message HowAIConnects"]')).toBeVisible();
      
      // Verify chat history sidebar
      await expect(page.locator('text=Today')).toBeVisible();
      await expect(page.locator('text=Yesterday')).toBeVisible();
    });

    test('should display conversation history', async ({ page }) => {
      await page.goto('/ai/text-generator');
      
      // Check that historical conversations are shown
      await expect(page.locator('text=UI/UX Design Roadmap write me the roadmap right now')).toBeVisible();
      await expect(page.locator('text=Calorie-dense foods: Needs, healthy')).toBeVisible();
      await expect(page.locator('text=Online School Education Learning')).toBeVisible();
    });

    test('should show conversation content in main area', async ({ page }) => {
      await page.goto('/ai/text-generator');
      
      // Verify conversation content is displayed
      await expect(page.locator('text=UI/UX Design Roadmap write me')).toBeVisible();
      await expect(page.locator('text=Adam Milner')).toBeVisible();
      await expect(page.locator('text=HowAIConnects')).toBeVisible();
      
      // Check for conversation content
      await expect(page.locator('text=Creating a UI/UX Design roadmap involves several key stages')).toBeVisible();
      await expect(page.locator('text=1. Research and Discovery')).toBeVisible();
    });

    test('should have functional edit buttons', async ({ page }) => {
      await page.goto('/ai/text-generator');
      
      // Check that edit buttons are present and clickable
      const editButtons = page.locator('button:has-text("Edit")');
      await expect(editButtons.first()).toBeVisible();
      
      // Test clicking edit button (implementation would depend on actual functionality)
      await editButtons.first().click();
    });

    test('should have functional regenerate button', async ({ page }) => {
      await page.goto('/ai/text-generator');
      
      // Check that regenerate button is present
      const regenerateButton = page.locator('button:has-text("Regenerate")');
      await expect(regenerateButton.first()).toBeVisible();
      
      // Test clicking regenerate (implementation would depend on actual functionality)
      await regenerateButton.first().click();
    });

    test('should have working message input', async ({ page }) => {
      await page.goto('/ai/text-generator');
      
      // Test message input
      const messageInput = page.locator('input[placeholder*="Message HowAIConnects"]');
      await messageInput.fill('Test message for AI generation');
      await expect(messageInput).toHaveValue('Test message for AI generation');
      
      // Test send button
      const sendButton = page.locator('button[type="submit"]');
      await expect(sendButton.first()).toBeVisible();
    });

    test('should navigate to new chat', async ({ page }) => {
      await page.goto('/ai/text-generator');
      
      // Click New Chat button
      await page.click('text=New Chat');
      
      // Should navigate to new chat page
      await expect(page).toHaveURL('/ai/text-generator-new');
    });

    test('should display proper breadcrumbs', async ({ page }) => {
      await page.goto('/ai/text-generator');
      
      // Check breadcrumb navigation
      await expect(page.locator('text=Dashboard')).toBeVisible();
      await expect(page.locator('text=Text Generator')).toBeVisible();
    });
  });

  test.describe('Navigation Between AI Applications', () => {
    test('should navigate between all AI generators', async ({ page }) => {
      // Start from dashboard and navigate to AI Applications
      await page.click('text=Ai Application');
      
      // Navigate to Text Generator
      await page.click('text=Text Generator');
      await expect(page).toHaveURL('/ai/text-generator');
      await expect(page.locator('h6:text("Text Generator")')).toBeVisible();
      
      // Navigate to Code Generator
      await page.click('text=Code Generator');
      await expect(page).toHaveURL('/ai/code-generator');
      await expect(page.locator('h6:text("Code Generator")')).toBeVisible();
      
      // Navigate to Image Generator
      await page.click('text=Image Generator');
      await expect(page).toHaveURL('/ai/image-generator');
      await expect(page.locator('h6:text("Image Generator")')).toBeVisible();
      
      // Navigate to Voice Generator
      await page.click('text=Voice Generator');
      await expect(page).toHaveURL('/ai/voice-generator');
      await expect(page.locator('h6:text("Voice Generator")')).toBeVisible();
      
      // Navigate to Video Generator
      await page.click('text=Video Generator');
      await expect(page).toHaveURL('/ai/video-generator');
      await expect(page.locator('h6:text("Video Generator")')).toBeVisible();
    });

    test('should maintain sidebar state when navigating', async ({ page }) => {
      // Expand AI Application menu
      await page.click('text=Ai Application');
      
      // Navigate to Text Generator
      await page.click('text=Text Generator');
      
      // Verify that AI menu is still expanded and shows all options
      await expect(page.locator('text=Code Generator')).toBeVisible();
      await expect(page.locator('text=Image Generator')).toBeVisible();
      await expect(page.locator('text=Voice Generator')).toBeVisible();
      await expect(page.locator('text=Video Generator')).toBeVisible();
      
      // Navigate to another generator and check menu stays expanded
      await page.click('text=Code Generator');
      await expect(page.locator('text=Text Generator')).toBeVisible();
      await expect(page.locator('text=Image Generator')).toBeVisible();
    });
  });

  test.describe('AI Application Layouts', () => {
    test('should display consistent layout across all generators', async ({ page }) => {
      const generators = [
        { name: 'Text Generator', url: '/ai/text-generator' },
        { name: 'Code Generator', url: '/ai/code-generator' },
        { name: 'Image Generator', url: '/ai/image-generator' },
        { name: 'Voice Generator', url: '/ai/voice-generator' },
        { name: 'Video Generator', url: '/ai/video-generator' }
      ];

      for (const generator of generators) {
        await page.goto(generator.url);
        
        // Check that common elements are present
        await expect(page.locator(`h6:text("${generator.name}")`)).toBeVisible();
        
        // Check breadcrumbs
        await expect(page.locator('text=Dashboard')).toBeVisible();
        
        // Check sidebar is present
        await expect(page.locator('text=Ai Application')).toBeVisible();
        
        // Check footer
        await expect(page.locator('text=© 2024 HowAIConnects. All Rights Reserved.')).toBeVisible();
      }
    });

    test('should have responsive design on all AI pages', async ({ page }) => {
      const generators = ['/ai/text-generator', '/ai/code-generator', '/ai/image-generator'];
      
      for (const url of generators) {
        // Test tablet size
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.goto(url);
        
        // Verify page loads and key elements are visible
        await expect(page.locator('h6')).toBeVisible();
        
        // Test mobile size
        await page.setViewportSize({ width: 375, height: 667 });
        await page.reload();
        
        // Verify page still works on mobile
        await expect(page.locator('h6')).toBeVisible();
        
        // Reset to desktop
        await page.setViewportSize({ width: 1280, height: 720 });
      }
    });
  });

  test.describe('AI Application Performance', () => {
    test('should load AI generators within acceptable time', async ({ page }) => {
      const generators = [
        '/ai/text-generator',
        '/ai/code-generator', 
        '/ai/image-generator'
      ];

      for (const url of generators) {
        const startTime = Date.now();
        
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        
        const loadTime = Date.now() - startTime;
        
        // Assert load time is reasonable (adjust as needed)
        expect(loadTime).toBeLessThan(3000);
      }
    });

    test('should handle rapid navigation between generators', async ({ page }) => {
      await page.goto('/');
      await page.click('text=Ai Application');
      
      const startTime = Date.now();
      
      // Rapidly navigate between generators
      await page.click('text=Text Generator');
      await page.waitForLoadState('domcontentloaded');
      
      await page.click('text=Code Generator');
      await page.waitForLoadState('domcontentloaded');
      
      await page.click('text=Image Generator');
      await page.waitForLoadState('domcontentloaded');
      
      const totalTime = Date.now() - startTime;
      
      // Verify final page loaded correctly
      await expect(page.locator('h6:text("Image Generator")')).toBeVisible();
      
      // Assert total navigation time is reasonable
      expect(totalTime).toBeLessThan(5000);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle page not found gracefully', async ({ page }) => {
      // Try to navigate to non-existent AI generator
      await page.goto('/ai/non-existent-generator');
      
      // Should either redirect or show 404 (depending on implementation)
      // This test would need to be adjusted based on actual error handling
    });

    test('should handle network errors gracefully', async ({ page }) => {
      // This would require mocking network failures
      // Implementation depends on how the application handles offline states
      
      await page.goto('/ai/text-generator');
      await expect(page.locator('h6:text("Text Generator")')).toBeVisible();
      
      // Simulate network failure and test graceful degradation
      // This is a placeholder for actual network error testing
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading structure', async ({ page }) => {
      await page.goto('/ai/text-generator');
      
      // Check heading hierarchy
      const h6Elements = page.locator('h6');
      await expect(h6Elements.first()).toBeVisible();
      
      // Verify headings have meaningful text
      await expect(page.locator('h6:text("Text Generator")')).toBeVisible();
    });

    test('should have accessible form inputs', async ({ page }) => {
      await page.goto('/ai/text-generator');
      
      // Check that form inputs have proper labels or placeholders
      const messageInput = page.locator('input[placeholder*="Message HowAIConnects"]');
      await expect(messageInput).toBeVisible();
      
      // Check that input is focusable
      await messageInput.focus();
      await expect(messageInput).toBeFocused();
    });

    test('should have keyboard navigation support', async ({ page }) => {
      await page.goto('/ai/text-generator');
      
      // Test tab navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Verify that focusable elements can be reached via keyboard
      // This would need more specific implementation based on actual tab order
    });
  });
});