import { aktif, buka, expect, file, fixture, masuk, pdf, pratinjau, state, test, unduh } from './portal.mjs';

const rows = page => page.locator('main tbody tr');
const action = (row, name) => row.getByRole('button', { name, exact: true });
const searchTab = 'Cari Proposal & TA';

test.beforeEach(async ({ page }) => { await masuk(page); });

test('33. Semua berkas pribadi dan pedoman dapat dipratinjau dan diunduh sesuai ukuran', async ({ page }) => {
  const data = await state(page);
  const files = [...aktif(data).submissions, ...data.templates];
  await buka(page, 'Download Proposal');
  await expect(rows(page)).toHaveCount(files.length);
  for (const [index, item] of files.entries()) {
    const row = rows(page).nth(index);
    const download = await unduh(page, action(row, 'Unduh'));
    const preview = await pratinjau(page, action(row, 'Pratinjau'));
    expect(download.name).toBe(item.fileName);
    expect(preview.name).toBe(download.name);
    expect(preview.bytes.equals(download.bytes)).toBe(true);
    await expect(row.getByTitle(`${download.bytes.length.toLocaleString('id-ID')} byte`)).toBeVisible();
    if (item.id === 'tpl-01') expect(download.bytes.equals(pdf)).toBe(true);
  }
});

test('34. Unggahan proposal tersimpan utuh setelah muat ulang dan riwayat lama tetap tersedia', async ({ page }) => {
  const oldThesis = aktif(await state(page));
  const uploaded = Buffer.concat([pdf, Buffer.from('\r\n')]);
  const name = 'pengajuan-mahasiswa.pdf';
  await buka(page, 'Upload Proposal');
  await page.getByLabel('Jenis Pengajuan').selectOption('Judul Baru');
  await page.getByLabel('Bidang Minat').selectOption({ index: 1 });
  await page.getByLabel('Judul Tugas Akhir').fill('Pengujian penyimpanan berkas proposal');
  await page.getByLabel('Abstrak Singkat').fill('Pengujian membandingkan berkas asli dan salinan yang diunduh.');
  await action(page, 'Computer Vision').click();
  const advisor = page.locator('#prop-adv1 option:enabled:not([value=""])').first();
  await page.locator('#prop-adv1').selectOption(await advisor.getAttribute('value'));
  await action(page, 'Lanjut ke unggah berkas').click();
  await file(page, name, uploaded);
  await page.getByRole('checkbox').check();
  await action(page, 'Kirim proposal').click();
  await expect(page.getByRole('heading', { name: 'Proposal berhasil diunggah' })).toBeVisible();
  await page.reload();
  await buka(page, 'Download Proposal');
  const row = rows(page).filter({ hasText: name });
  for (const download of [
    await unduh(page, action(row, 'Unduh')),
    await pratinjau(page, action(row, 'Pratinjau')),
  ]) {
    expect(download.name).toBe(name);
    expect(download.bytes.equals(uploaded)).toBe(true);
  }
  await page.getByLabel('Riwayat pengajuan').selectOption(oldThesis.id);
  await expect(row).toHaveCount(0);
  for (const submission of oldThesis.submissions) {
    await expect(rows(page).filter({ hasText: submission.fileName })).toBeVisible();
  }
});

test('35. Sembilan kolom arsip menampilkan IPK dan hasil awal tanpa filter', async ({ page }) => {
  const { archive } = await state(page);
  await buka(page, searchTab);
  await expect(page.locator('main th')).toHaveText([
    'NRP', 'Nama', 'IPK', 'Judul', 'Pembimbing', 'Co-Pembimbing', 'Periode', 'Perpanjangan', 'Download',
  ]);
  await expect(page.locator('main input[type=checkbox]')).toHaveCount(0);
  await expect(page.getByText(`${archive.length} dokumen ditemukan`)).toBeVisible();
  await expect(rows(page)).toHaveCount(Math.min(archive.length, 5));
  await expect(rows(page).first().getByRole('cell').nth(2)).toHaveText(archive[0].ipk.toFixed(2));
});

test('36. NRP, nama, judul, pembimbing, jenis dan seluruh tag menyaring arsip', async ({ page }) => {
  const { archive } = await state(page);
  const first = archive[0];
  await buka(page, searchTab);
  const query = page.getByLabel('Cari dalam arsip');
  for (const value of [first.studentNim, first.studentName.toLowerCase(), first.title]) {
    await query.fill(value);
    await expect(rows(page)).toHaveCount(1);
    await expect(rows(page).first()).toContainText(first.studentNim);
  }
  await query.fill('');
  for (const advisor of [first.advisor1Name, first.advisor2Name]) {
    await page.locator('#archive-adv').selectOption(advisor);
    const matching = archive.filter(item => [item.advisor1Name, item.advisor2Name].includes(advisor));
    await expect(page.getByText(`${matching.length} dokumen ditemukan`)).toBeVisible();
  }
  await page.locator('#archive-type').selectOption(first.type);
  await action(page, 'Filter lanjutan').click();
  for (const tag of first.tags) await action(page, tag).click();
  const matching = archive.filter(item => [item.advisor1Name, item.advisor2Name].includes(first.advisor2Name)
    && item.type === first.type && first.tags.every(tag => item.tags.includes(tag)));
  await expect(rows(page).locator('td:first-child')).toHaveText(matching.slice(0, 5).map(item => item.studentNim));
  await query.fill('kata-yang-tidak-tercantum');
  await expect(rows(page)).toHaveCount(0);
  await expect(page.getByText(/Tidak ditemukan dokumen/)).toBeVisible();
});

test('37. Jumlah baris, lompat halaman dan batas nomor halaman konsisten', async ({ page }) => {
  const { archive } = await state(page);
  await buka(page, searchTab);
  const jump = page.locator('#jump-page');
  const last = Math.ceil(archive.length / 5);
  await jump.fill(String(last));
  await expect(rows(page).locator('td:first-child')).toHaveText(archive.slice((last - 1) * 5).map(item => item.studentNim));
  await jump.fill('999');
  await expect(jump).toHaveValue(String(last));
  await jump.fill('0');
  await expect(jump).toHaveValue('1');
  for (const size of [10, 25, 5]) {
    await page.locator('#show-entries').selectOption(String(size));
    await expect(rows(page)).toHaveCount(Math.min(size, archive.length));
    await expect(jump).toHaveValue('1');
  }
});

test('38. Detail arsip memuat abstrak dan menawarkan PDF yang sama dengan unduhan langsung', async ({ page }) => {
  const { archive: [first] } = await state(page);
  await buka(page, searchTab);
  const row = rows(page).first();
  await action(row, 'Detail').click();
  const detail = page.getByRole('dialog', { name: 'Detail Dokumen Arsip' });
  await expect(detail).toContainText(first.title);
  await expect(detail).toContainText(first.abstract);
  const preview = await pratinjau(page, action(detail, 'Pratinjau Dokumen PDF'));
  const direct = await unduh(page, action(row, 'Unduh'));
  expect(preview.bytes.equals(direct.bytes)).toBe(true);
  expect(preview.name).toBe(direct.name);
  expect(direct.name).toContain(first.studentNim);
});

test('39. Periode, jurusan, perpanjangan dan isi abstrak membatasi hasil secara bersamaan', async ({ page }) => {
  await fixture(page, data => {
    data.archive[0].programStudi = data.accounts.mahasiswa.department;
  }, 'cari-proposal');
  const { archive } = await state(page);
  const first = archive[0];
  await action(page, 'Filter lanjutan').click();
  const program = page.getByLabel('Jurusan / program studi');
  await program.selectOption('Belum tercatat');
  await expect(rows(page).filter({ hasText: first.studentNim })).toHaveCount(0);
  await expect(page.getByText(`${archive.length - 1} dokumen ditemukan`)).toBeVisible();
  await program.selectOption(first.programStudi);
  await page.getByLabel('Periode semester').selectOption(first.semester);
  const extension = page.getByLabel('Perpanjangan', { exact: true });
  await extension.selectOption(first.isExtension ? 'ya' : 'tidak');
  await page.getByLabel('Cari dalam arsip').fill(first.abstract);
  await expect(rows(page)).toHaveCount(1);
  await expect(rows(page).first()).toContainText(first.studentNim);
  await extension.selectOption(first.isExtension ? 'tidak' : 'ya');
  await expect(rows(page)).toHaveCount(0);
  await action(page, 'Hapus semua filter').click();
  await expect(page.getByText(`${archive.length} dokumen ditemukan`)).toBeVisible();
});
