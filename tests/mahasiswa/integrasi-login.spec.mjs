import { test, expect, state } from './portal.mjs';

async function login(page, username, password) {
  await page.locator('#login-id').fill(username);
  await page.locator('#login-pw').fill(password);
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
}

test('Integrasi merge. Username Budi membuka mahasiswa atau dekan sesuai kredensial demo', async ({ page }) => {
  await page.goto('/');
  await login(page, 'budi.santoso', 'Demo#2026');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ringkasan Fakultas');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ringkasan Fakultas');
  await page.locator('header button[aria-expanded]').first().click();
  await page.getByRole('button', { name: 'Keluar', exact: true }).click();
  await login(page, 'budi.santoso', 'istts2026');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Dashboard Tugas Akhir');
  expect((await state(page)).accounts.mahasiswa.identifier).toBe('221116950');
  expect(await page.evaluate(() => localStorage.getItem('tuntas-proto-v2:persona'))).toBeNull();
});

test('Integrasi merge. Kaprodi baru dan akses cepat kaprodi lama membuka portal masing-masing', async ({ page }) => {
  await page.goto('/');
  await login(page, 'andi.wijaya', 'Demo#2026');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Dashboard Kaprodi');
  await page.locator('header button[aria-expanded]').first().click();
  await page.getByRole('button', { name: 'Keluar', exact: true }).click();
  await page.evaluate(() => localStorage.setItem('tuntas-proto-v2:persona', 'budi'));
  await page.getByRole('button', { name: /^Ketua Program Studi/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Dashboard Kaprodi');
  expect(await page.evaluate(() => localStorage.getItem('tuntas-proto-v2:persona'))).toBeNull();
});
