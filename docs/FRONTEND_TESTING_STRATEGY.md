# Frontend Testing Strategy for HowAIConnects Platform

## 🎯 Overview

This document outlines a comprehensive frontend testing strategy for the HowAIConnects platform, focusing on the WowDash admin dashboard components and external platform integrations.

## 🏗️ Testing Architecture

### Testing Pyramid Structure

```
                    E2E Tests (10%)
                 /                 \
            Integration Tests (20%)
           /                         \
      Unit Tests (70%)
```

### Technology Stack
- **Unit Testing**: Jest + React Testing Library
- **Integration Testing**: Jest + Mock Service Worker (MSW)
- **E2E Testing**: Playwright (already configured)
- **Visual Testing**: Storybook + Chromatic
- **Performance Testing**: Lighthouse CI

## 🧪 Test Categories

### 1. Component Unit Tests

#### AI Generator Components
```javascript
// tests/components/TextGenerator.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TextGenerator } from '../../../wowdash-admin-dashboard/wow-dash-frontend/WowDash/components/TextGenerator';

describe('TextGenerator Component', () => {
  it('renders chat interface correctly', () => {
    render(<TextGenerator />);
    expect(screen.getByPlaceholderText('Message HowAIConnects...')).toBeInTheDocument();
    expect(screen.getByText('New Chat')).toBeInTheDocument();
  });

  it('displays conversation history', () => {
    const mockHistory = [
      { user: 'Test prompt', assistant: 'Test response' }
    ];
    render(<TextGenerator history={mockHistory} />);
    expect(screen.getByText('Test prompt')).toBeInTheDocument();
    expect(screen.getByText('Test response')).toBeInTheDocument();
  });

  it('handles message submission', async () => {
    const mockOnSubmit = jest.fn();
    render(<TextGenerator onSubmit={mockOnSubmit} />);
    
    const input = screen.getByPlaceholderText('Message HowAIConnects...');
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('Test message');
    });
  });

  it('handles regenerate functionality', async () => {
    const mockOnRegenerate = jest.fn();
    render(<TextGenerator onRegenerate={mockOnRegenerate} />);
    
    fireEvent.click(screen.getByText('Regenerate'));
    
    await waitFor(() => {
      expect(mockOnRegenerate).toHaveBeenCalled();
    });
  });
});
```

#### Dashboard Widget Components
```javascript
// tests/components/DashboardWidget.test.js
import { render, screen } from '@testing-library/react';
import { SalesStatisticWidget } from '../../../wowdash-admin-dashboard/components/SalesStatisticWidget';

describe('SalesStatisticWidget', () => {
  const mockData = {
    revenue: '$27,200',
    growth: '10%',
    period: 'Yearly'
  };

  it('displays sales statistics correctly', () => {
    render(<SalesStatisticWidget data={mockData} />);
    expect(screen.getByText('$27,200')).toBeInTheDocument();
    expect(screen.getByText('10%')).toBeInTheDocument();
  });

  it('handles period selection change', () => {
    const mockOnPeriodChange = jest.fn();
    render(<SalesStatisticWidget data={mockData} onPeriodChange={mockOnPeriodChange} />);
    
    fireEvent.change(screen.getByDisplayValue('Yearly'), {
      target: { value: 'Monthly' }
    });
    
    expect(mockOnPeriodChange).toHaveBeenCalledWith('Monthly');
  });
});
```

### 2. Integration Tests

#### External Platform Integrations
```javascript
// tests/integration/LatitudeIntegration.test.js
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { LatitudeAdapter } from '../../packages/adapters/latitude-adapter';

const server = setupServer(
  rest.get('https://api.latitude.so/prompts', (req, res, ctx) => {
    return res(ctx.json({
      prompts: [
        { id: 1, name: 'Test Prompt', version: '1.0' }
      ]
    }));
  }),
  
  rest.post('https://api.latitude.so/prompts/execute', (req, res, ctx) => {
    return res(ctx.json({
      result: 'Generated content from Latitude'
    }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Latitude Integration', () => {
  let adapter;

  beforeEach(() => {
    adapter = new LatitudeAdapter({ apiKey: 'test-key' });
  });

  it('fetches prompts from Latitude API', async () => {
    const prompts = await adapter.listPrompts();
    expect(prompts).toHaveLength(1);
    expect(prompts[0].name).toBe('Test Prompt');
  });

  it('executes prompt and returns result', async () => {
    const result = await adapter.executePrompt('1', { input: 'test' });
    expect(result).toBe('Generated content from Latitude');
  });
});
```

#### Airtable Data Management
```javascript
// tests/integration/AirtableIntegration.test.js
import { AirtableAdapter } from '../../packages/adapters/airtable-adapter';

const mockAirtableResponses = {
  bases: [
    { id: 'base1', name: 'Users Database' }
  ],
  records: [
    { id: 'rec1', fields: { Name: 'John Doe', Email: 'john@example.com' } }
  ]
};

describe('Airtable Integration', () => {
  let adapter;

  beforeEach(() => {
    adapter = new AirtableAdapter({ 
      apiKey: 'test-key', 
      baseId: 'base1' 
    });
  });

  it('syncs user data with Airtable', async () => {
    const result = await adapter.syncUserData();
    expect(result.success).toBe(true);
    expect(result.recordsUpdated).toBeGreaterThan(0);
  });

  it('handles API errors gracefully', async () => {
    server.use(
      rest.get('https://api.airtable.com/v0/base1/Users', (req, res, ctx) => {
        return res(ctx.status(429), ctx.json({
          error: { type: 'RATE_LIMIT_EXCEEDED' }
        }));
      })
    );

    await expect(adapter.getRecords('base1', 'Users')).rejects.toThrow('Rate limit exceeded');
  });
});
```

### 3. End-to-End Tests

#### Complete User Workflows
```javascript
// tests/e2e/textGenerator.spec.js
import { test, expect } from '@playwright/test';

test.describe('Text Generator Workflow', () => {
  test('user can generate and regenerate content', async ({ page }) => {
    await page.goto('/ai/text-generator');
    
    // Verify initial page load
    await expect(page.locator('h6:text("Text Generator")')).toBeVisible();
    await expect(page.locator('input[placeholder*="Message HowAIConnects"]')).toBeVisible();
    
    // Submit a prompt
    await page.fill('input[placeholder*="Message HowAIConnects"]', 'Write a product description for a smart watch');
    await page.click('button[type="submit"]');
    
    // Wait for response
    await expect(page.locator('.chat-response')).toBeVisible({ timeout: 10000 });
    
    // Test regenerate functionality
    await page.click('button:text("Regenerate")');
    await expect(page.locator('.chat-response')).toBeVisible({ timeout: 10000 });
    
    // Verify conversation history is updated
    const messages = await page.locator('.chat-message').count();
    expect(messages).toBeGreaterThan(1);
  });

  test('user can switch between AI generators', async ({ page }) => {
    await page.goto('/ai/text-generator');
    
    // Navigate to code generator
    await page.click('text=Code Generator');
    await expect(page).toHaveURL('/ai/code-generator');
    await expect(page.locator('h6:text("Code Generator")')).toBeVisible();
    
    // Navigate to image generator
    await page.click('text=Image Generator');
    await expect(page).toHaveURL('/ai/image-generator');
    await expect(page.locator('h6:text("Image Generator")')).toBeVisible();
  });
});

// tests/e2e/dashboard.spec.js
test.describe('Dashboard Functionality', () => {
  test('displays all key metrics on AI dashboard', async ({ page }) => {
    await page.goto('/');
    
    // Check main metrics are displayed
    await expect(page.locator('text=Total Users')).toBeVisible();
    await expect(page.locator('text=20,000')).toBeVisible();
    await expect(page.locator('text=Total Subscription')).toBeVisible();
    await expect(page.locator('text=15,000')).toBeVisible();
    
    // Verify charts are loaded
    await expect(page.locator('.sales-statistic-chart')).toBeVisible();
    await expect(page.locator('.users-overview-chart')).toBeVisible();
    
    // Test time period filters
    await page.selectOption('select:near(:text("Sales Statistic"))', 'Monthly');
    // Verify chart updates (would need to check for data changes)
  });

  test('can switch between dashboard types', async ({ page }) => {
    await page.goto('/dashboard/index2');
    await expect(page.locator('text=CRM')).toBeVisible();
    
    await page.goto('/dashboard/index3');
    await expect(page.locator('text=eCommerce')).toBeVisible();
    
    await page.goto('/dashboard/index4');
    await expect(page.locator('text=Cryptocurrency')).toBeVisible();
  });
});
```

### 4. Visual Regression Tests

#### Storybook Configuration
```javascript
// .storybook/main.js
module.exports = {
  stories: ['../wowdash-admin-dashboard/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    'chromatic'
  ],
};

// stories/TextGenerator.stories.js
import { TextGenerator } from '../wowdash-admin-dashboard/components/TextGenerator';

export default {
  title: 'AI Components/TextGenerator',
  component: TextGenerator,
  parameters: {
    layout: 'fullscreen',
  },
};

export const Default = {
  args: {
    history: [],
    isLoading: false,
  },
};

export const WithConversation = {
  args: {
    history: [
      { user: 'Write a product description', assistant: 'Here is a compelling product description...' }
    ],
    isLoading: false,
  },
};

export const Loading = {
  args: {
    history: [],
    isLoading: true,
  },
};
```

## 🔧 Test Implementation Plan

### Phase 1: Setup & Basic Tests (Week 1)
- [ ] Configure Jest and React Testing Library
- [ ] Set up MSW for API mocking
- [ ] Create test utilities and helpers
- [ ] Implement basic component unit tests

### Phase 2: Integration Tests (Week 2)
- [ ] Mock external API integrations
- [ ] Test adapter classes thoroughly
- [ ] Implement error handling tests
- [ ] Add performance testing basics

### Phase 3: E2E Testing (Week 3)
- [ ] Expand Playwright test coverage
- [ ] Test complete user workflows
- [ ] Add cross-browser testing
- [ ] Implement visual regression testing

### Phase 4: CI/CD Integration (Week 4)
- [ ] Set up GitHub Actions for testing
- [ ] Configure test reporting and coverage
- [ ] Add automated visual regression checks
- [ ] Implement performance monitoring

## 📊 Test Coverage Goals

### Minimum Coverage Targets
- **Unit Tests**: 80% line coverage
- **Integration Tests**: 60% of critical paths
- **E2E Tests**: 100% of primary user workflows
- **Visual Tests**: All major components and states

### Key Metrics to Track
- Test execution time
- Code coverage percentage
- Number of failing tests
- Visual regression detections
- Performance benchmark results

## 🚨 Testing Best Practices

### 1. Test Organization
```
tests/
├── unit/
│   ├── components/
│   ├── utils/
│   └── adapters/
├── integration/
│   ├── api/
│   └── workflows/
├── e2e/
│   ├── user-flows/
│   └── cross-browser/
└── visual/
    └── storybook/
```

### 2. Mock Strategy
- **External APIs**: Always mock in unit/integration tests
- **Browser APIs**: Mock localStorage, sessionStorage, etc.
- **Time-dependent functions**: Use fake timers
- **Random functions**: Mock for predictable tests

### 3. Test Data Management
```javascript
// tests/fixtures/index.js
export const mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  role: 'admin'
};

export const mockPromptHistory = [
  {
    id: 1,
    prompt: 'Test prompt',
    response: 'Test response',
    timestamp: '2024-01-01T00:00:00Z'
  }
];

export const mockDashboardData = {
  totalUsers: 20000,
  totalSubscriptions: 15000,
  totalIncome: 42000,
  // ... more mock data
};
```

## 🔍 Debugging and Troubleshooting

### Common Test Issues
1. **Async operations**: Use `waitFor` for async state changes
2. **External dependencies**: Ensure proper mocking
3. **DOM queries**: Use appropriate queries (getByRole, getByText, etc.)
4. **Test isolation**: Clean up after each test

### Debugging Tools
- React Developer Tools
- Jest debugging with `--inspect-brk`
- Playwright trace viewer
- Chrome DevTools for E2E debugging

This testing strategy ensures comprehensive coverage of the HowAIConnects platform while maintaining fast execution times and reliable results.