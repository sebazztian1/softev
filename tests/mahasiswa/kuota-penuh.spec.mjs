import { test, expect, masuk, buka, state, aktif, fixture, file } from './portal.mjs';

test('55. Akun skenario tersedia pada data lama dan Hendra mempunyai empat mahasiswa aktif', async ({ page }) => {
  await masuk(page);
  await fixture(page, saved => {
    saved.studentAccounts = saved.studentAccounts.filter(account => account.id !== 'usr-mhs-quota-01');
    saved.theses = saved.theses.filter(thesis => thesis.id !== 'ta-demo-quota-01');
  });
  await page.getByRole('button', { name: /Menu profil Kevin/ }).click();
  await page.getByRole('button', { name: 'Keluar', exact: true }).click();
  await page.locator('#login-id').fill('221116951');
  await page.locator('#login-pw').fill('istts2026');
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page.locator('main')).toContainText('Raka Pratama');
  expect(aktif(await state(page))).toBeUndefined();
  await page.reload();
  const saved = await state(page);
  expect(saved.accounts.mahasiswa.username).toBe('raka.pratama');
  const assigned = saved.theses.filter(thesis => !thesis.isArchived && thesis.status !== 'Ditolak' &&
    thesis.programStudi === 'S1 Informatika' && thesis.semester === saved.period.semesterLabel &&
    [thesis.advisor1Id, thesis.advisor2Id].includes('lec-01'));
  expect(new Set(assigned.map(thesis => thesis.studentId)).size).toBe(4);
  await buka(page, 'Upload Proposal');
  await expect(page.locator('#prop-adv1 option[value="lec-01"]')).toHaveJSProperty('disabled', true);
  await expect(page.locator('#prop-adv1 option[value="lec-01"]')).toContainText('kuota penuh');
});

test('56. Kuota penuh menolak pengajuan Raka dan pembimbing lain tetap bisa dipilih', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /^Mahasiswa — Kuota Pembimbing Penuh Raka/ }).click();
  await buka(page, 'Upload Proposal');
  const before = await state(page);
  await page.locator('#prop-title').fill('Pengajuan uji kuota Raka');
  await page.locator('#prop-field').selectOption('Rekayasa Perangkat Lunak');
  await page.locator('#prop-abstract').fill('Pengujian validasi kuota pembimbing pada pengajuan mahasiswa.');
  await page.getByRole('button', { name: 'IoT', exact: true }).click();
  // Exercise validation when a stale form or DOM manipulation selects a full option.
  await page.locator('#prop-adv1 option[value="lec-01"]').evaluate(option => { option.disabled = false; });
  await page.locator('#prop-adv1').selectOption('lec-01');
  await page.getByRole('button', { name: 'Lanjut ke unggah berkas' }).click();
  await expect(page.getByRole('alert')).toContainText('Kuota bimbingan Ir. Hendra Wijaya');
  await expect(page.getByRole('alert')).toContainText('sudah penuh');
  expect((await state(page)).theses).toEqual(before.theses);
  expect((await state(page)).notifications).toEqual(before.notifications);
  expect(aktif(await state(page))).toBeUndefined();
  await page.locator('#prop-adv1').selectOption('lec-02');
  await page.getByRole('button', { name: 'Lanjut ke unggah berkas' }).click();
  await file(page);
  await page.getByRole('main').getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Kirim proposal', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Proposal berhasil diunggah' })).toBeVisible();
  expect(aktif(await state(page)).advisor1Id).toBe('lec-02');
});
