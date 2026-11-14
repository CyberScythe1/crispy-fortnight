import { test, expect } from '@playwright/test';

test.describe('FS-04 Multi-Tenant Project Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Welcome back');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.click('button:has-text("Sign In")');
    await expect(page.locator('text=Invalid email address')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Welcome back')).toBeVisible();
  });
});

test.describe('FS-04 Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('/dashboard');
  });

  test('should display dashboard stats', async ({ page }) => {
    await expect(page.locator('text=Active Projects')).toBeVisible();
    await expect(page.locator('text=Open Issues')).toBeVisible();
    await expect(page.locator('text=Active Sprints')).toBeVisible();
    await expect(page.locator('text=Team Members')).toBeVisible();
  });

  test('should navigate to projects page', async ({ page }) => {
    await page.click('a[href="/projects"]');
    await expect(page).toHaveURL('/projects');
    await expect(page.locator('h1:has-text("Projects")')).toBeVisible();
  });
});

test.describe('FS-04 Projects', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('/dashboard');
    await page.click('a[href="/projects"]');
  });

  test('should display projects list', async ({ page }) => {
    await expect(page.locator('h1:has-text("Projects")')).toBeVisible();
    await expect(page.locator('button:has-text("Add Project")')).toBeVisible();
  });
});

test.describe('FS-04 Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('/dashboard');
  });

  test('should navigate via sidebar', async ({ page }) => {
    await page.click('a[href="/dashboard"]');
    await expect(page).toHaveURL('/dashboard');
    await page.click('a[href="/projects"]');
    await expect(page).toHaveURL('/projects');
  });

  test('should logout', async ({ page }) => {
    await page.click('button:has-text("Logout")');
    await expect(page).toHaveURL('/login');
  });
});