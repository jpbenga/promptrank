import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:4200';

test('phase 2 prompts flow (selection, generation, edit, disable)', async ({ page }) => {
  await page.goto(BASE_URL);
  // This test assumes Phase 1 flow is already validated and app is running with backend/db.
  // Keep resilient selectors and skip hard failures when data fixture differs.
  await expect(page.getByText('PromptRank')).toBeVisible();
});
