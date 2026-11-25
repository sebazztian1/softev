import { createHash } from 'node:crypto';
import { test, expect, masuk, buka, state, aktif, fixture, pdf, file, unduh } from './portal.mjs';

const tombol = (page, name) => page.getByRole('button', { name, exact: true });
const lanjut = (page) => tombol(page, 'Lanjut ke unggah berkas').click();
const kirim = (page) => tombol(page, 'Kirim proposal').click();
const bukti = (page) => page.getByRole('heading', { name: 'Proposal berhasil diunggah' });
const formulir = (page) => tombol(page, 'Download Formulir Proposal TA');

async function dataBaru(page, title = 'Pengajuan uji mahasiswa') {
  await page.locator('#prop-title').fill(title);
  await page.locator('#prop-field').selectOption('Rekayasa Perangkat Lunak');
  await page.locator('#prop-abstract').fill('Pengujian proses pengajuan tugas akhir.');
  await page.locator('#prop-adv1').selectOption('lec-01');
  await tombol(page, 'IoT').click();
}

async function unggah(page) {
  await file(page);
  await page.getByRole('main').getByRole('checkbox').check();
  await kirim(page);
  await expect(bukti(page)).toBeVisible();
}

async function proposalBaru(page, title) {
  await buka(page, 'Upload Proposal');
  await dataBaru(page, title);
  await lanjut(page);
  await unggah(page);
}

async function pilihTopik(page, field) {
  await buka(page, 'Rekomendasi Judul');
  await page.locator('#rec-field').selectOption(field);
  await tombol(page, 'Ajukan Topik').click();
  await expect(page.locator('#prop-title')).toBeVisible();
}

test.beforeEach(async ({ page }) => { await masuk(page); });

test('13. Formulir pengajuan resmi dapat diunduh langsung', async ({ page }) => {
  await buka(page, 'Upload Proposal');
  await expect(formulir(page)).toHaveCount(1);
  const { name, bytes } = await unduh(page, formulir(page));
  expect(name).toBe('F-048-Proposal-Tugas-Akhir-v6.pdf');
  expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
});

test('14. Formulir F-048 cocok dengan ukuran dan sidik berkas resmi', async ({ page }) => {
  await buka(page, 'Upload Proposal');
  const { bytes } = await unduh(page, formulir(page));
  const template = (await state(page)).templates.find((item) => item.id === 'tpl-01');
  expect(bytes.length).toBe(template.fileSize);
  expect(bytes.length).toBe(88728);
  expect(createHash('sha256').update(bytes).digest('hex')).toBe('9b72f9e2d5c4e561e674071b75de187bc6f5f9333c3908c81e96e800498f2501');
});

test('15. Tahap data dan unggah terpisah, fokus mengikuti langkah dan isian bertahan saat kembali', async ({ page }) => {
  await buka(page, 'Upload Proposal');
  await expect(page.locator('input[type=file]')).toHaveCount(0);
  await dataBaru(page);
  await lanjut(page);
  await expect(page.getByRole('heading', { name: 'Unggah dan konfirmasi berkas' })).toBeFocused();
  await expect(page.locator('#prop-title')).toHaveCount(0);
  await expect(page.locator('input[type=file]')).toHaveCount(1);
  await tombol(page, 'Kembali ke data').click();
  await expect(page.getByRole('heading', { name: 'Data proposal' })).toBeFocused();
  await expect(page.locator('#prop-title')).toHaveValue('Pengajuan uji mahasiswa');
  await expect(tombol(page, 'IoT')).toHaveAttribute('aria-pressed', 'true');
});

test('16. Form memerlukan metadata, tag, pembimbing berbeda, PDF, dan konfirmasi', async ({ page }) => {
  await buka(page, 'Upload Proposal');
  await lanjut(page);
  expect(await page.locator('#prop-title').evaluate((input) => input.validity.valueMissing)).toBe(true);
  await dataBaru(page);
  await page.locator('#prop-abstract').fill('');
  await lanjut(page);
  expect(await page.locator('#prop-abstract').evaluate((input) => input.validity.valueMissing)).toBe(true);
  await page.locator('#prop-abstract').fill('Abstrak.');
  await tombol(page, 'IoT').click();
  await lanjut(page);
  await expect(page.getByRole('alert')).toContainText('minimal satu tag');
  await tombol(page, 'IoT').click();
  await page.locator('#prop-adv2').selectOption('lec-01');
  await lanjut(page);
  await expect(page.getByRole('alert')).toContainText('harus berbeda');
  await page.locator('#prop-adv2').selectOption('');
  await lanjut(page);
  await kirim(page);
  await expect(page.getByRole('alert')).toContainText('Pilih berkas');
  await file(page);
  await kirim(page);
  await expect(page.getByRole('alert')).toContainText('Centang');
});

test('17. Format PDF, batas tepat 20 MiB, penghapusan dan deteksi isi palsu', async ({ page }) => {
  await buka(page, 'Upload Proposal');
  await dataBaru(page);
  await lanjut(page);
  await file(page, 'salah.txt', Buffer.from('salah'), 'text/plain');
  await expect(page.getByRole('alert')).toContainText('Hanya berkas');
  const limit = 20 * 1024 * 1024;
  await file(page, 'besar.pdf', Buffer.alloc(limit + 1));
  await expect(page.getByRole('alert')).toContainText('melebihi');
  await file(page, 'batas.pdf', Buffer.concat([pdf, Buffer.alloc(limit - pdf.length)]));
  await expect(page.getByText(/20\.00 MB/)).toBeVisible();
  await tombol(page, 'Hapus File').click();
  await expect(page.locator('input[type=file]')).toHaveCount(1);
  const original = await state(page);
  await file(page, 'samaran.pdf', Buffer.from('Ini bukan PDF.'));
  if (await tombol(page, 'Hapus File').isVisible()) {
    await page.getByRole('main').getByRole('checkbox').check();
    await kirim(page);
  }
  await expect(page.getByRole('alert')).toContainText('Isi berkas');
  expect((await state(page)).theses).toEqual(original.theses);
});

test('18. Mahasiswa dapat mengirim proposal tanpa co-pembimbing', async ({ page }) => {
  await buka(page, 'Upload Proposal');
  await expect(page.locator('#prop-adv2')).toHaveValue('');
  await dataBaru(page);
  await lanjut(page);
  await unggah(page);
  expect(aktif(await state(page)).advisor2Id).toBe('');
});

test('19. Identitas, pembimbing, berkas, waktu dan riwayat tercantum sesudah pengajuan', async ({ page }) => {
  const original = await state(page);
  await buka(page, 'Upload Proposal');
  await dataBaru(page, 'Proposal bukti akademik');
  await page.locator('#prop-adv2').selectOption('lec-02');
  await lanjut(page);
  await unggah(page);
  const receipt = page.locator('main section').filter({ has: bukti(page) });
  for (const value of [original.accounts.mahasiswa.name, original.accounts.mahasiswa.identifier,
    'Proposal bukti akademik', original.lecturers[0].name, original.lecturers[1].name, original.period.semesterLabel, 'Waktu unggah', 'uji.pdf']) {
    await expect(receipt).toContainText(value);
  }
  await expect(bukti(page)).toBeFocused();
  await tombol(page, 'Lihat riwayat berkas').click();
  await page.reload();
  await expect(page.getByRole('row', { name: /uji\.pdf/ })).toBeVisible();
  expect(aktif(await state(page)).submissions[0].fileSize).toBe(pdf.length);
});

test('20. Judul baru mempunyai hasil kosong dan hasil lama tetap dapat dibuka', async ({ page }) => {
  const previous = aktif(await state(page));
  await proposalBaru(page, 'Judul baru terpisah');
  const saved = await state(page);
  const latest = aktif(saved);
  expect(latest.id).not.toBe(previous.id);
  expect(latest.evaluations).toEqual([]);
  expect(latest.defenseScore).toBeUndefined();
  expect(latest.revisionQrToken).toBeUndefined();
  expect(saved.theses.find((item) => item.id === previous.id)).toEqual({ ...previous, isArchived: true });
  await buka(page, 'Hasil Sidang Proposal');
  await expect(page.getByText('Belum dinilai', { exact: true })).toBeVisible();
  await page.locator('#hasil-pengajuan').selectOption(previous.id);
  await expect(page.getByText(previous.evaluations[0].notes, { exact: true })).toBeVisible();
});

test('21. Perpanjangan terkunci sesudah dikirim termasuk sesudah masuk kembali ke formulir', async ({ page }) => {
  await buka(page, 'Upload Proposal');
  await page.locator('#prop-type').selectOption('Perpanjangan');
  await expect(page.getByText('Peringatan Pengajuan Perpanjangan')).toBeVisible();
  await page.locator('#prop-title').fill('Perpanjangan pertama');
  await page.locator('#prop-adv2').selectOption('');
  await lanjut(page);
  await unggah(page);
  await buka(page, 'Dashboard');
  await buka(page, 'Upload Proposal');
  await page.reload();
  await expect(page.locator('#prop-type')).toHaveValue('Perpanjangan');
  await expect(page.locator('#prop-title')).toHaveValue('Perpanjangan pertama');
  await expect(page.locator('#prop-title')).not.toBeEditable();
  await expect(page.locator('#prop-adv1')).toBeDisabled();
  await expect(page.locator('#prop-adv2')).toBeDisabled();
  await page.locator('#prop-type').selectOption('Judul Baru');
  await page.locator('#prop-type').selectOption('Perpanjangan');
  await expect(page.locator('#prop-title')).not.toBeEditable();
  expect(aktif(await state(page)).title).toBe('Perpanjangan pertama');
});

test('22. Kuota empat mahasiswa unik memperhitungkan pembimbing dan co-pembimbing aktif per periode', async ({ page }) => {
  const penuh = (s) => {
    const student = s.accounts.mahasiswa;
    s.theses = s.theses.filter((t) => t.studentId !== student.id).slice(0, 4)
      .map((t) => ({ ...t, semester: s.period.semesterLabel, programStudi: student.department, status: 'Diterima', advisor1Id: 'lec-03', advisor2Id: 'lec-04' }));
  };
  const option = (id) => page.locator(`#prop-adv1 option[value="${id}"]`);
  await fixture(page, penuh, 'upload-proposal');
  await expect(option('lec-03')).toBeDisabled();
  await expect(page.locator('#prop-adv2 option[value="lec-04"]')).toBeDisabled();
  await fixture(page, (s) => {
    penuh(s);
    const removed = s.theses.pop();
    s.theses.push({ ...removed, isArchived: true }, { ...removed, id: 'periode-lama', semester: 'Genap 2025/2026' },
      { ...removed, id: 'ditolak', status: 'Ditolak' }, { ...s.theses[0], id: 'duplikat' });
  }, 'upload-proposal');
  await expect(option('lec-03')).toBeEnabled();
});

test('40. Rekomendasi memfilter bidang dan status, menampilkan detail dan menangani hasil kosong', async ({ page }) => {
  const { topics } = await state(page);
  await buka(page, 'Rekomendasi Judul');
  await expect(page.getByText(`${topics.length} topik`, { exact: true })).toBeVisible();
  const chosen = topics[0];
  await page.locator('#rec-field').selectOption(chosen.field);
  await page.locator('#rec-status').selectOption(chosen.status);
  await tombol(page, 'Lihat Detail').click();
  await expect(page.getByRole('dialog')).toContainText(chosen.prerequisites);
  await expect(page.getByRole('dialog')).toContainText(`${chosen.quota - chosen.takenCount} dari ${chosen.quota} tempat`);
  await tombol(page, 'Tutup').click();
  await page.locator('#rec-status').selectOption('Penuh');
  await expect(page.getByText(/Tidak ada topik/)).toBeVisible();
  await page.locator('#rec-field').selectOption('Semua');
  await expect(tombol(page, 'Ajukan Topik')).toBeDisabled();
  await page.locator('#rec-status').selectOption('Reserved');
  await expect(tombol(page, 'Sudah Reserved')).toBeDisabled();
});

test('41. Pilihan topik terisi, bertahan setelah refresh dan jatah dihitung sekali sampai terkirim', async ({ page }) => {
  const { topics } = await state(page);
  const topic = topics[0];
  await buka(page, 'Rekomendasi Judul');
  await page.locator('#rec-field').selectOption(topic.field);
  await tombol(page, 'Lihat Detail').click();
  await tombol(page, 'Ajukan Topik Ini').click();
  await expect(page.locator('#prop-title')).toHaveValue(topic.title);
  await page.reload();
  await expect(page.locator('#prop-adv1')).toHaveValue(topic.lecturerId);
  await expect(page.locator('#prop-abstract')).toHaveValue(topic.description);
  const withDraft = await state(page);
  expect(withDraft.pendingTopic.topicId).toBe(topic.id);
  expect(withDraft.topics.find((item) => item.id === topic.id)).toMatchObject({ status: 'Reserved', takenCount: topic.takenCount + 1 });
  await buka(page, 'Rekomendasi Judul');
  await tombol(page, 'Lanjutkan pengajuan').click();
  await tombol(page, 'IoT').click();
  await lanjut(page);
  await unggah(page);
  const committed = await state(page);
  expect(committed.pendingTopic).toBeNull();
  expect(committed.topics.find((item) => item.id === topic.id).takenCount).toBe(topic.takenCount + 1);
});

test('42. Seluruh topik yang tersedia membawa bidang aslinya dan mengganti topik melepas reservasi awal', async ({ page }) => {
  const { topics } = await state(page);
  let previous;
  for (const topic of topics.filter((item) => item.status === 'Tersedia')) {
    await pilihTopik(page, topic.field);
    await expect(page.locator('#prop-field')).toHaveValue(topic.field);
    await expect(page.locator('#prop-title')).toHaveValue(topic.title);
    if (previous) expect((await state(page)).topics.find((item) => item.id === previous.id)).toEqual(previous);
    previous = topic;
  }
});

test('43. Bersihkan Pilihan mengembalikan isian dan kuota draf setelah muat ulang', async ({ page }) => {
  const original = await state(page);
  await pilihTopik(page, 'Sistem Terdistribusi');
  await page.reload();
  await tombol(page, 'Bersihkan Pilihan').click();
  for (const id of ['prop-title', 'prop-adv1', 'prop-field', 'prop-abstract']) {
    await expect(page.locator('#' + id)).toHaveValue('');
  }
  const saved = await state(page);
  expect(saved.pendingTopic).toBeNull();
  expect(saved.topics).toEqual(original.topics);
  await page.reload();
  await expect(tombol(page, 'Bersihkan Pilihan')).toHaveCount(0);
});

test('45. Tenggat yang terlewati menutup formulir dan mencegah kirim dari langkah unggah yang terbuka', async ({ page }) => {
  const initialDeadline = (await state(page)).period.proposalDeadline;
  await fixture(page, (s) => { s.period.proposalDeadline = '2000-01-01T00:00:00Z'; }, 'upload-proposal');
  await expect(page.getByText('Batas waktu telah berakhir')).toBeVisible();
  await expect(page.locator('main form')).toHaveCount(0);
  await fixture(page, (s) => { s.period.proposalDeadline = initialDeadline; }, 'upload-proposal');
  const before = await state(page);
  await dataBaru(page);
  await lanjut(page);
  await file(page);
  await page.getByRole('main').getByRole('checkbox').check();
  await page.clock.setFixedTime(new Date(Date.parse(before.period.proposalDeadline) + 1000));
  await kirim(page);
  await expect(page.getByText(/Batas waktu.*berakhir/).first()).toBeVisible();
  expect((await state(page)).theses).toEqual(before.theses);
});

test('46. Portal lokal menyimpan notifikasi konfirmasi rinci tanpa klaim pengiriman email', async ({ page }) => {
  await proposalBaru(page, 'Konfirmasi lokal');
  const saved = await state(page);
  const notice = saved.notifications.find((item) => item.targetRole === 'mahasiswa' && item.targetThesisId === aktif(saved).id);
  expect(notice.title).toBe('Bukti pengajuan proposal');
  for (const value of ['Konfirmasi lokal', 'uji.pdf', saved.lecturers[0].name, saved.period.semesterLabel]) expect(notice.message).toContain(value);
  expect(notice.read).toBe(false);
  await expect(page.locator('main')).not.toContainText(/email.*(dikirim|terkirim)/i);
  await page.reload();
  await page.getByRole('button', { name: 'Notifikasi', exact: true }).click();
  await expect(page.getByText('Bukti pengajuan proposal', { exact: true })).toBeVisible();
  await expect(page.getByText(notice.message, { exact: true })).toBeVisible();
});
