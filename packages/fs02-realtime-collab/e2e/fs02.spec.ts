import { test, expect } from '@playwright/test';

test.describe('FS-02 Real-Time Collaborative Workspace', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Welcome back');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.click('button:has-text("Sign In")');
    await expect(page.locator('text=Invalid email address')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'user@test.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Welcome back')).toBeVisible();
  });
});

test.describe('FS-02 Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'user@test.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('/dashboard');
  });

  test('should display dashboard stats', async ({ page }) => {
    await expect(page.locator('text=Workspaces')).toBeVisible();
    await expect(page.locator('text=Documents')).toBeVisible();
    await expect(page.locator('text=Team Members')).toBeVisible();
    await expect(page.locator('text=Recent Activity')).toBeVisible();
  });

  test('should navigate to workspaces', async ({ page }) => {
    await page.click('a[href="/workspaces"]');
    await expect(page).toHaveURL('/workspaces');
  });
});

test.describe('FS-02 Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'user@test.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('/dashboard');
  });

  test('should navigate via sidebar', async ({ page }) => {
    await page.click('a[href="/dashboard"]');
    await expect(page).toHaveURL('/dashboard');
    await page.click('a[href="/workspaces"]');
    await expect(page).toHaveURL('/workspaces');
  });

  test('should logout', async ({ page }) => {
    await page.click('button:has-text("Logout")');
    await expect(page).toHaveURL('/login');
  });
});