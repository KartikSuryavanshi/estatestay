import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

test.describe('EstateStay guest booking', () => {
  test.beforeEach(async () => {
    const checkIn = new Date('2026-11-20T00:00:00Z'); const checkOut = new Date('2026-11-22T00:00:00Z');
    await prisma.booking.deleteMany({ where: { checkIn, checkOut } });
    const rooms = await prisma.roomCategory.findMany();
    for (const room of rooms) for (const date of [checkIn, new Date('2026-11-21T00:00:00Z')]) await prisma.websiteAllotment.update({ where: { roomCategoryId_date: { roomCategoryId: room.id, date } }, data: { allotment: 8, blackout: false } });
  });
  test.afterAll(async () => prisma.$disconnect());
  test('homepage, search, mobile booking UI and payment confirmation', async ({ page }) => {
    await page.goto('/'); await expect(page).toHaveTitle(/EstateStay/i); await expect(page.getByText('Stay where')).toBeVisible();
    await page.getByLabel('Check in').fill('2026-11-20'); await page.getByLabel('Check out').fill('2026-11-22'); await page.getByRole('link', { name: /check availability/i }).click();
    await expect(page).toHaveURL(/rooms/); await expect(page.getByText('Private Estate Villa')).toBeVisible();
    await page.getByRole('link', { name: /book this room/i }).last().click(); await expect(page.getByText('Shape your stay.')).toBeVisible();
    await page.getByRole('button', { name: /continue to details/i }).click(); await page.getByLabel('FULL NAME').fill('Playwright Guest'); await page.getByLabel('EMAIL').fill('playwright@example.com'); await page.getByLabel('PHONE').fill('+919999999999'); await page.getByRole('button', { name: /continue to payment/i }).click(); await page.getByRole('button', { name: /pay & confirm/i }).click();
    await expect(page).toHaveURL(/confirmation/); await expect(page.getByText('Your stay is confirmed')).toBeVisible();
  });
});

test.describe('EstateStay staff operations', () => {
  async function login(page: any) { await page.goto('/staff'); await page.getByLabel('Email').fill('stay@estatestay.example'); await page.getByLabel('Password').fill('estate2026'); await page.getByRole('button', { name: /sign in/i }).click(); await expect(page.getByText('Live operations')).toBeVisible(); }
  test('staff login, dashboard alerts, acknowledgement, enquiries and logout', async ({ page }) => {
    await login(page); await expect(page.getByRole('heading', { name: 'Complaint alerts' })).toBeVisible(); const acknowledge = page.getByTestId('acknowledge-alert').first(); if (await acknowledge.count()) { await acknowledge.click(); await expect(page.getByText('No unread complaint alerts.')).toBeVisible(); }
    await page.getByRole('button', { name: 'Enquiries' }).click(); await expect(page.getByText('Enquiry inbox')).toBeVisible(); await page.getByRole('button', { name: 'EDIT' }).first().click(); await page.getByLabel('Reply draft').fill('Approved draft from Playwright.'); await page.getByRole('button', { name: /save draft/i }).click();
    await page.getByRole('button', { name: 'Rates & allotment' }).click(); await expect(page.getByText('Live inventory controls')).toBeVisible(); await page.getByRole('button', { name: 'SAVE' }).first().click(); await expect(page.getByText('Saved successfully')).toBeVisible();
    await page.getByRole('button', { name: /sign out/i }).click(); await expect(page.getByText('Sign in to dashboard')).toBeVisible();
  });
  test('unauthorized users see login', async ({ page }) => { await page.goto('/staff'); await expect(page.getByText('Sign in to dashboard')).toBeVisible(); });
});
