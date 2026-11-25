import { test, expect, masuk, buka, state, aktif, fixture, file, pratinjau } from './portal.mjs';

const tabs = ['Dashboard', 'Upload Proposal', 'Upload Revisi', 'Hasil Sidang Proposal', 'Download Proposal', 'Cari Proposal & TA', 'Rekomendasi Judul'];
const button = (scope, name) => scope.getByRole('button', { name, exact: true });

async function login(page, id, password) {
  await page.locator('#login-id').fill(id);
  await page.locator('#login-pw').fill(password);
  await button(page, 'Masuk').click();
}

async function profil(page) {
  await page.getByRole('button', { name: /Kevin Hartanto.*@kevin/ }).click();
  await button(page, 'Ubah Profil').click();
  return page.getByRole('dialog');
}

test('01. Tampilkan dan sembunyikan kata sandi serta petunjuk bantuan', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Tampilkan kata sandi', { exact: true }).click();
  await expect(page.locator('#login-pw')).toHaveAttribute('type', 'text');
  await page.getByLabel('Sembunyikan kata sandi', { exact: true }).click();
  await expect(page.locator('#login-pw')).toHaveAttribute('type', 'password');
  await expect(page.getByText(/lupa kata sandi/i)).toContainText('Departemen IT');
});

test('02. Kredensial kosong, identitas asing dan sandi mahasiswa salah ditolak', async ({ page }) => {
  await page.goto('/');
  for (const [user, secret] of [['', ''], ['tidak-terdaftar', 'istts2026'], ['221116942', 'sandi-uji-salah']]) {
    await login(page, user, secret);
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.locator('#login-id')).toBeVisible();
  }
});

test('03. Login melalui NRP dan sesi bertahan setelah muat ulang', async ({ page }) => {
  await page.goto('/');
  await login(page, '221116942', 'istts2026');
  await expect(page.locator('main h1')).toHaveText('Dashboard Tugas Akhir');
  await page.reload();
  await expect(page.locator('main h1')).toHaveText('Dashboard Tugas Akhir');
  expect((await state(page)).currentRole).toBe('mahasiswa');
});

test('04. Hanya email profil dapat diubah dan nilainya tersimpan', async ({ page }) => {
  await masuk(page);
  const dlg = await profil(page);
  await expect(dlg.locator('input:disabled')).toHaveCount(5);
  await page.locator('#profile-email').fill('invalid');
  await button(dlg, 'Submit').click();
  expect(await page.locator('#profile-email').evaluate(el => el.validity.typeMismatch)).toBe(true);
  await page.locator('#profile-email').fill('mahasiswa@example.test');
  await button(dlg, 'Submit').click();
  await expect(dlg).toBeHidden();
  await page.reload();
  await profil(page);
  await expect(page.locator('#profile-email')).toHaveValue('mahasiswa@example.test');
});

test('05. Notifikasi membuka revisi dan tandai semua mengosongkan jumlah belum dibaca', async ({ page }) => {
  await masuk(page);
  const bell = button(page, 'Notifikasi');
  await bell.click();
  await page.getByRole('button', { name: /Pengingat Batas Unggah Revisi/ }).click();
  await expect(page.locator('main h1')).toHaveText('Upload Revisi');
  await bell.click();
  await button(page, 'Tandai semua dibaca').click();
  await expect(bell).toHaveText('');
  const data = await state(page);
  expect(data.notifications.filter(n => ['all', 'mahasiswa'].includes(n.targetRole) && !n.read)).toHaveLength(0);
});

test('06. Keluar dan masuk kembali dengan username', async ({ page }) => {
  await masuk(page);
  await page.getByRole('button', { name: /Kevin Hartanto.*@kevin/ }).click();
  await button(page, 'Keluar').click();
  await expect(page.locator('#login-id')).toBeVisible();
  await login(page, 'kevin.hartanto', 'istts2026');
  await expect(page.locator('main h1')).toHaveText('Dashboard Tugas Akhir');
});

test('07. Tab Dashboard desktop 1440 px menerima klik di tengah', async ({ page }) => {
  await masuk(page);
  const nav = page.getByRole('navigation', { name: 'Navigasi utama' });
  expect(await nav.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await buka(page, 'Hasil Sidang Proposal');
  await buka(page, 'Dashboard');
  await expect(button(page.getByRole('navigation'), 'Dashboard')).toHaveAttribute('aria-current', 'page');
});

test('08. Enam menu desktop dan logo kembali ke dasbor', async ({ page }) => {
  await masuk(page);
  for (const tab of tabs.slice(1)) await buka(page, tab);
  await page.getByRole('button', { name: /Portal Upload Tugas Akhir.*ISTTS/ }).click();
  await expect(page.locator('main h1')).toHaveText('Dashboard Tugas Akhir');
});

test('09. Ketujuh tujuan berfungsi dari menu seluler 390 px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await masuk(page);
  const menu = await page.getByRole('button', { name: 'Menu navigasi' }).boundingBox();
  expect(menu.x + menu.width).toBeLessThanOrEqual(390);
  for (const tab of tabs) {
    await buka(page, tab);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  }
});

test('10. Identitas, status, periode, progres, pedoman dan catatan pada dasbor', async ({ page }) => {
  await masuk(page);
  const data = await state(page);
  const ta = aktif(data);
  const main = page.locator('main');
  for (const item of [data.accounts.mahasiswa.identifier, ta.status, ta.evaluations[0].notes, 'Hari']) {
    await expect(main).toContainText(item);
  }
  await expect(main.getByText(ta.newTitle, { exact: true })).toBeVisible();
  await expect(main.locator('th[scope=row]')).toHaveCount(2);
  await main.locator('summary').filter({ hasText: 'Tahap saat ini' }).click();
  await expect(main.getByText('Judul pengajuan awal · ' + ta.title)).toBeVisible();
  await expect(main.locator('[aria-current=step]')).toContainText(ta.stage);
  await main.locator('summary').filter({ hasText: 'Pedoman Pengajuan Proposal' }).click();
  await expect(page.getByText(/Lengkapi formulir proposal serta Bab/)).toBeVisible();
});

test('11. Dasbor menampilkan ruang, jam dan tanggal sidang mahasiswa', async ({ page }) => {
  await masuk(page);
  const schedule = aktif(await state(page)).defenseSchedule;
  await expect(page.getByText(schedule.room, { exact: true })).toBeVisible();
  await expect(page.getByText(schedule.time, { exact: true })).toBeVisible();
  await expect(page.locator('main')).toContainText('18 November 2026');
});

test('12. Aksi periode, riwayat, pratinjau dan tindakan berikutnya', async ({ page }) => {
  await masuk(page);
  const main = page.locator('main');
  await pratinjau(page, button(main, 'Pratinjau'));
  for (const [action, tab] of [['Upload Proposal', 'Upload Proposal'], ['Upload Revisi', 'Upload Revisi'], ['Lihat Semua Berkas', 'Download Proposal'], ['Unggah Revisi', 'Upload Revisi']]) {
    await button(main, action).click();
    await expect(main.locator('h1')).toHaveText(tab);
    await buka(page, 'Dashboard');
  }
});

test('23. Hasil sidang meliputi kedua judul, empat penguji, nilai, syarat dan jadwal', async ({ page }) => {
  await masuk(page);
  const data = await state(page);
  const ta = aktif(data);
  await buka(page, 'Hasil Sidang Proposal');
  for (const summary of ['Judul sebelum penyesuaian', 'Syarat perbaikan']) {
    await page.locator('summary').filter({ hasText: summary }).click();
  }
  const main = page.locator('main');
  for (const text of [ta.title, ta.newTitle, ta.semester, ta.defenseSchedule.room, ta.defenseScore.grade,
    ...[ta.advisor1Id, ta.advisor2Id].map(id => data.lecturers.find(l => l.id === id).name),
    ...ta.evaluations.flatMap(e => [e.notes, ...(e.requirements ?? [])])]) {
    await expect(main).toContainText(text);
  }
  await expect(main.locator('tbody tr')).toHaveCount(4);
});

test('24. Pratinjau dan unduh lampiran koreksi penguji', async ({ page }) => {
  await masuk(page);
  await buka(page, 'Hasil Sidang Proposal');
  const result = await pratinjau(page, button(page, 'Lihat Koreksi').first());
  expect(result.name).toBe(aktif(await state(page)).evaluations.find(e => e.correctionFile).correctionFile.fileName);
});

test('25. Aksi hasil sidang sesuai status dan menampilkan maksimal empat penilai', async ({ page }) => {
  await masuk(page);
  await buka(page, 'Hasil Sidang Proposal');
  await button(page, 'Unggah Revisi Sidang').click();
  await expect(page.locator('main h1')).toHaveText('Upload Revisi');
  await fixture(page, data => {
    const ta = aktif(data);
    ta.status = 'Diterima';
    const entry = ta.evaluations[0];
    ta.evaluations.unshift({ ...entry, id: 'qa-kaprodi', evaluatorRole: 'Kaprodi', notes: 'Catatan uji Kaprodi' });
    ta.evaluations.push({ ...entry, id: 'qa-lima', evaluatorId: 'qa-penguji', notes: 'Catatan uji tambahan' });
  }, 'hasil-sidang');
  await expect(page.locator('main tbody tr')).toHaveCount(4);
  await expect(page.locator('main')).not.toContainText(/Catatan uji Kaprodi|Catatan uji tambahan/);
  await button(page, 'Unduh Berkas Proposal').click();
  await expect(page.locator('main h1')).toHaveText('Download Proposal');
});

test('44. Mahasiswa tanpa pengajuan bisa memulai proposal perdana', async ({ page }) => {
  await masuk(page);
  await fixture(page, data => { data.theses = data.theses.filter(t => t.studentId !== data.accounts.mahasiswa.id); });
  await expect(page.locator('main')).toContainText('Belum ada berkas');
  for (const tab of ['Upload Revisi', 'Hasil Sidang Proposal', 'Download Proposal']) {
    await buka(page, tab);
    await expect(page.locator('main')).toContainText('Belum ada');
    await button(page.locator('main'), 'Unggah Proposal').click();
    await expect(page.locator('#prop-title')).toBeVisible();
  }
  await page.locator('#prop-title').fill('Pengajuan pertama untuk pengujian');
  await page.locator('#prop-abstract').fill('Uji pengajuan perdana mahasiswa.');
  await page.locator('#prop-field').selectOption({ index: 1 });
  const eligible = await page.locator('#prop-adv1 option:enabled').evaluateAll(options => options.find(o => o.value).value);
  await page.locator('#prop-adv1').selectOption(eligible);
  await button(page, 'IoT').click();
  await button(page, 'Lanjut ke unggah berkas').click();
  await file(page);
  await page.getByRole('checkbox').check();
  await button(page, 'Kirim proposal').click();
  await expect(page.getByRole('heading', { name: 'Proposal berhasil diunggah' })).toBeVisible();
  const ta = aktif(await state(page));
  expect(ta.submissions[0].versionLabel).toBe('Proposal v1.0');
  expect(ta.evaluations).toHaveLength(0);
});

test('48. Empat status keputusan sidang ditampilkan sesuai data', async ({ page }) => {
  await masuk(page);
  for (const status of ['Diterima', 'Diperbaiki', 'Perbaikan Bersyarat', 'Ditolak']) {
    await fixture(page, data => { aktif(data).status = status; }, 'hasil-sidang');
    await expect(page.locator('main section').first()).toContainText(status);
  }
});

test('49. Notifikasi jadwal membuka dasbor dengan ruang dan waktu yang sesuai', async ({ page }) => {
  await masuk(page);
  const { time, room } = aktif(await state(page)).defenseSchedule;
  await fixture(page, data => {
    data.notifications.unshift({ id: 'qa-jadwal', targetRole: 'mahasiswa', title: 'Jadwal Sidang Proposal Ditetapkan',
      message: time + ' · ' + room, createdAt: new Date().toISOString(), read: false, targetTab: 'dashboard' });
  }, 'hasil-sidang');
  await button(page, 'Notifikasi').click();
  const notice = page.getByRole('button', { name: /Jadwal Sidang Proposal Ditetapkan/ });
  await expect(notice).toContainText(time);
  await expect(notice).toContainText(room);
  await notice.click();
  await expect(page.locator('main h1')).toHaveText('Dashboard Tugas Akhir');
  await expect(page.locator('main')).toContainText(room);
});

test('50. Akses cepat mahasiswa membuka identitas yang benar', async ({ page }) => {
  await masuk(page);
  await expect(page.locator('main')).toContainText('Kevin Hartanto');
  expect((await state(page)).currentRole).toBe('mahasiswa');
});

test('51. Kalender mahasiswa menampilkan sidang serta tenggat proposal dan revisi', async ({ page }) => {
  await masuk(page);
  const { time, room } = aktif(await state(page)).defenseSchedule;
  await button(page, 'Buka kalender').click();
  const calendar = page.getByRole('dialog', { name: 'Kalender akademik mahasiswa' });
  await expect(calendar.getByRole('listitem')).toHaveCount(3);
  for (const text of [time, room, 'Pengajuan proposal', 'Unggah revisi']) await expect(calendar).toContainText(text);
  await page.keyboard.press('Escape');
  await expect(calendar).toBeHidden();
});
