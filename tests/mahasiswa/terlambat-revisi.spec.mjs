import { test, expect, masuk, buka, state, aktif, fixture, file, pratinjau } from './portal.mjs';

async function keluar(page, name) {
  await page.getByRole('button', { name: new RegExp('Menu profil ' + name) }).click();
  await page.getByRole('button', { name: 'Keluar', exact: true }).click();
}

async function loginFira(page, identifier) {
  await page.locator('#login-id').fill(identifier);
  await page.locator('#login-pw').fill('istts2026');
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page.locator('main')).toContainText('Fira Anindya');
}

test('59. Akun terlambat revisi tersedia pada data lama dan riwayat proposalnya tetap dapat dibaca', async ({ page }) => {
  await masuk(page);
  const kevin = aktif(await state(page));
  await fixture(page, saved => {
    saved.studentAccounts = saved.studentAccounts.filter(account => account.id !== 'usr-mhs-late-revision-01');
    saved.theses = saved.theses.filter(thesis => thesis.studentId !== 'usr-mhs-late-revision-01');
  });
  await keluar(page, 'Kevin');
  await loginFira(page, '221116953');
  const thesis = aktif(await state(page));
  expect(thesis).toMatchObject({ studentName: 'Fira Anindya', status: 'Perlu Revisi', revisionDeadline: '2026-11-24T23:59:00+07:00' });
  await expect(page.getByRole('button', { name: 'Unggah Revisi', exact: true })).toBeDisabled();
  await buka(page, 'Upload Revisi');
  await expect(page.getByText('Batas waktu telah berakhir')).toBeVisible();
  await expect(page.locator('main form')).toHaveCount(0);
  await expect(page.locator('main')).toContainText(thesis.evaluations[0].notes);
  await page.reload();
  await expect(page.getByText('Batas waktu telah berakhir')).toBeVisible();
  await buka(page, 'Hasil Sidang Proposal');
  await expect(page.locator('main')).toContainText(thesis.title);
  await expect(page.locator('main')).toContainText(thesis.evaluations[0].notes);
  await buka(page, 'Download Proposal');
  await expect(page.locator('main')).toContainText('221116953_Fira_Anindya_Proposal_TA_v1.pdf');
  await expect(page.locator('main')).not.toContainText('Kevin Hartanto');
  const downloaded = await pratinjau(page, page.locator('tbody').first().getByRole('button', { name: 'Pratinjau', exact: true }));
  expect(downloaded.bytes.toString('latin1')).toContain('Fira Anindya');
  expect(downloaded.bytes.toString('latin1')).not.toContain('Kevin Hartanto');
  expect(aktif(await state(page))).toEqual(thesis);
  await keluar(page, 'Fira');
  await page.getByRole('button', { name: /^Mahasiswa Kevin Hartanto/ }).click();
  expect(aktif(await state(page))).toEqual(kevin);
  await buka(page, 'Upload Revisi');
  await expect(page.locator('main form')).toBeVisible();
  await keluar(page, 'Kevin');
  await loginFira(page, 'fira.anindya');
  expect(aktif(await state(page))).toEqual(thesis);
});

test('60. Akun akses cepat Fira menolak pengiriman revisi dari formulir sebelum tenggat', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /^Mahasiswa — Terlambat Upload Revisi Fira/ }).click();
  const initial = await state(page);
  const thesis = aktif(initial);
  const deadline = Date.parse(thesis.revisionDeadline);
  await page.clock.setFixedTime(new Date(deadline - 60_000));
  await buka(page, 'Upload Revisi');
  await expect(page.locator('main form')).toBeVisible();
  await page.locator('#rev-summary').fill('Pengiriman revisi dari formulir yang dibuka sebelum tenggat.');
  await file(page, '221116953_revisi.pdf');
  await page.clock.setFixedTime(new Date(deadline + 1000));
  await page.getByRole('button', { name: 'Unggah revisi', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Batas waktu unggah revisi telah berakhir');
  const saved = await state(page);
  expect(saved.theses).toEqual(initial.theses);
  expect(saved.notifications).toEqual(initial.notifications);
  expect(aktif(saved).revisionQrToken).toBeUndefined();
  await page.reload();
  await expect(page.getByText('Batas waktu telah berakhir')).toBeVisible();
  await expect(page.locator('main form')).toHaveCount(0);
});
