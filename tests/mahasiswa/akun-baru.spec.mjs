import { test, expect, masuk, buka, state, aktif, fixture, file } from './portal.mjs';

async function keluar(page, name) {
  await page.getByRole('button', { name: new RegExp('Menu profil ' + name) }).click();
  await page.getByRole('button', { name: 'Keluar', exact: true }).click();
}

async function loginBudi(page, identifier = '221116950') {
  await page.locator('#login-id').fill(identifier);
  await page.locator('#login-pw').fill('istts2026');
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page.locator('main')).toContainText('Budi Santoso');
}

test('52. Akun baru tersedia pada penyimpanan lama dan masuk dengan NRP atau username', async ({ page }) => {
  await masuk(page);
  await fixture(page, data => { delete data.studentAccounts; });
  await keluar(page, 'Kevin');
  await loginBudi(page);
  await expect(page.locator('main')).toContainText('Belum ada berkas proposal');
  expect(aktif(await state(page))).toBeUndefined();
  await page.reload();
  await expect(page.locator('main')).toContainText('Budi Santoso');
  await keluar(page, 'Budi');
  await loginBudi(page, 'budi.santoso');
  expect((await state(page)).studentAccounts).toHaveLength(5);
});

test('53. Akses cepat akun baru menampilkan keadaan kosong di seluruh halaman pribadinya', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /^Mahasiswa — Belum Upload Proposal Budi/ }).click();
  await expect(page.locator('main')).toContainText('Belum ada berkas proposal');
  await page.getByRole('button', { name: 'Notifikasi', exact: true }).click();
  await expect(page.getByText('Belum ada notifikasi terbaru.')).toBeVisible();
  await page.getByRole('button', { name: 'Notifikasi', exact: true }).click();
  for (const tab of ['Upload Revisi', 'Hasil Sidang Proposal', 'Download Proposal']) {
    await buka(page, tab);
    await expect(page.locator('main')).toContainText('Belum ada');
    await expect(page.locator('main')).not.toContainText('Kevin Hartanto');
  }
});

test('54. Pengajuan perdana dan email akun baru tersimpan terpisah dari data Kevin', async ({ page }) => {
  await masuk(page);
  const kevin = aktif(await state(page));
  await keluar(page, 'Kevin');
  await loginBudi(page);
  await page.getByRole('button', { name: /Menu profil Budi/ }).click();
  await page.getByRole('button', { name: 'Ubah Profil', exact: true }).click();
  await page.locator('#profile-email').fill('budi.uji@example.test');
  await page.getByRole('dialog').getByRole('button', { name: 'Submit', exact: true }).click();
  await buka(page, 'Upload Proposal');
  await page.locator('#prop-title').fill('Pengajuan perdana Budi');
  await page.locator('#prop-field').selectOption('Rekayasa Perangkat Lunak');
  await page.locator('#prop-abstract').fill('Pengujian pengajuan pertama akun mahasiswa baru.');
  await page.locator('#prop-adv1').selectOption('lec-02');
  await page.getByRole('button', { name: 'IoT', exact: true }).click();
  await page.getByRole('button', { name: 'Lanjut ke unggah berkas' }).click();
  await file(page);
  await page.getByRole('main').getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Kirim proposal', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Proposal berhasil diunggah' })).toBeVisible();
  await page.reload();
  const budi = aktif(await state(page));
  expect(budi).toMatchObject({ studentName: 'Budi Santoso', studentNim: '221116950', status: 'Menunggu Verifikasi' });
  expect(budi.evaluations).toHaveLength(0);
  expect(budi.submissions).toHaveLength(1);
  expect((await state(page)).theses.find(thesis => thesis.id === kevin.id)).toEqual(kevin);
  await keluar(page, 'Budi');
  await page.getByRole('button', { name: /^Mahasiswa Kevin Hartanto/ }).click();
  expect(aktif(await state(page))).toEqual(kevin);
  await buka(page, 'Download Proposal');
  await expect(page.locator('main')).not.toContainText('Pengajuan perdana Budi');
  await keluar(page, 'Kevin');
  await loginBudi(page);
  expect((await state(page)).accounts.mahasiswa.email).toBe('budi.uji@example.test');
  expect(aktif(await state(page)).id).toBe(budi.id);
});
