import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

export { expect, test };
export const pdf = await readFile(new URL('../../src/assets/F-048-Proposal-Tugas-Akhir-v6.pdf', import.meta.url));
const key = 'istts_portal_ta_state_v3';

export async function masuk(page) {
  await page.route(/^https:\/\/fonts\.(?:googleapis|gstatic)\.com\//, route => route.abort());
  await page.goto('/');
  await page.getByRole('button', { name: /^Mahasiswa Kevin Hartanto/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Dashboard Tugas Akhir');
}

export async function buka(page, tab) {
  const menu = page.getByRole('button', { name: 'Menu navigasi' });
  if (await menu.isVisible()) await menu.click();
  await page.locator('header').getByRole('button', { name: tab, exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(tab === 'Dashboard' ? 'Dashboard Tugas Akhir' : tab);
}

export const state = page => page.evaluate(k => JSON.parse(localStorage.getItem(k)), key);
export const aktif = data => data.theses.find(t => t.studentId === data.accounts.mahasiswa.id && !t.isArchived);

export async function fixture(page, mutate, tab = 'dashboard') {
  const data = await state(page);
  data.currentRole = 'mahasiswa';
  data.activeTab = tab;
  data.focusedThesisId = null;
  await mutate(data);
  await page.evaluate(([k, value]) => localStorage.setItem(k, JSON.stringify(value)), [key, data]);
  await page.reload();
  await expect(page.locator('main h1')).toBeVisible();
}

export async function file(page, name = 'uji.pdf', bytes = pdf, mime = 'application/pdf') {
  await page.locator('input[type=file]').setInputFiles({ name, mimeType: mime, buffer: bytes });
}

export async function unduh(page, button) {
  const [download] = await Promise.all([page.waitForEvent('download'), button.click()]);
  expect(await download.failure()).toBeNull();
  const bytes = await readFile(await download.path());
  expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
  return { name: download.suggestedFilename(), bytes };
}

export async function pratinjau(page, button) {
  await button.click();
  const dialog = page.getByRole('dialog');
  const frame = dialog.locator('iframe');
  await expect(frame).toBeVisible();
  const bytes = await frame.evaluate(async el => Array.from(new Uint8Array(await (await fetch(el.src)).arrayBuffer())));
  const downloaded = await unduh(page, dialog.getByRole('button', { name: 'Unduh Berkas' }));
  expect(downloaded.bytes.equals(Buffer.from(bytes))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  return downloaded;
}
