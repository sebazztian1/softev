import jsQR from 'jsqr';
import { PNG } from 'pngjs';
import { aktif, buka, expect, file, fixture, masuk, pdf, pratinjau, state, test, unduh } from './portal.mjs';

test.beforeEach(async ({ page }) => {
  await masuk(page);
  await buka(page, 'Upload Revisi');
});

const submit = (page) => page.getByRole('button', { name: 'Unggah revisi', exact: true });
const choices = (page) => page.locator('summary').filter({ hasText: 'Jenis pengerjaan dan pembimbing' });
const dropzone = (page) => page.getByRole('button', { name: /Tarik & lepaskan file revisi/ });

async function upload(page, name) {
  await page.locator('#rev-summary').fill('Perbaikan Bab 3 sesuai catatan penguji.');
  await file(page, name, pdf);
  await submit(page).click();
  await expect(page.getByRole('heading', { name: 'Revisi menunggu verifikasi' })).toBeVisible();
}

async function readQr(page) {
  const screenshot = await page.getByRole('img', { name: /Kode QR ISTTS/ }).screenshot();
  const { data, width, height } = PNG.sync.read(screenshot);
  return jsQR(new Uint8ClampedArray(data), width, height)?.data;
}

test('26. Profil, periode, kuota dan tenggat revisi tersedia serta ringkasan dan berkas wajib', async ({ page }) => {
  const saved = await state(page);
  const student = saved.accounts.mahasiswa;
  const main = page.getByRole('main');
  await expect(main).toContainText(student.name);
  await expect(main).toContainText(saved.period.semesterLabel);
  await expect(main).toContainText('Batas akhir revisi');
  await expect(main).toContainText(aktif(saved).evaluations[0].notes);
  await main.locator('summary').filter({ hasText: 'Profil mahasiswa' }).click();
  for (const value of [student.username, student.identifier, student.email, student.department, student.ipk.toFixed(2)]) {
    await expect(main.getByText(value, { exact: false }).first()).toBeVisible();
  }
  await choices(page).click();
  await expect(main.getByText(/Maksimal 4 bimbingan per dosen/)).toBeVisible();
  await submit(page).click();
  expect(await page.locator('#rev-summary').evaluate((el) => el.validity.valueMissing)).toBe(true);
  await page.locator('#rev-summary').fill('Perbaikan Bab 3');
  await submit(page).click();
  await expect(page.getByRole('status')).toContainText('Pilih berkas revisi');
  expect(aktif(await state(page)).submissions).toEqual(aktif(saved).submissions);
});

test('27. Jenis pengerjaan dan pembimbing dapat diubah, kuota ditegakkan dan perpanjangan dikunci', async ({ page }) => {
  await fixture(page, (saved) => {
    saved.lecturers.find((lecturer) => lecturer.id === 'lec-04').maxQuota = 0;
  }, 'upload-revisi');
  await choices(page).click();
  await expect(page.locator('#rev-advisor1Id option[value="lec-04"]')).toHaveJSProperty('disabled', true);
  await page.locator('#rev-advisor1Id option[value="lec-04"]').evaluate((option) => { option.disabled = false; });
  await page.locator('#rev-advisor1Id').selectOption('lec-04');
  await page.locator('#rev-summary').fill('Penyesuaian judul dan pembimbing.');
  await file(page, 'perpanjangan.pdf', pdf);
  await submit(page).click();
  await expect(page.getByRole('status')).toContainText('sudah penuh');
  await page.locator('#rev-advisor2Id').selectOption('');
  await page.locator('#rev-advisor1Id').selectOption('lec-02');
  await page.locator('#rev-type').selectOption('Perpanjangan');
  await page.locator('#rev-title').fill('Penyesuaian judul penelitian');
  await expect(page.getByText(/judul dan pembimbing akan terkunci/)).toBeVisible();
  await submit(page).click();
  await expect(page.getByRole('heading', { name: 'Revisi menunggu verifikasi' })).toBeVisible();
  await page.reload();
  const revised = aktif(await state(page));
  expect(revised).toMatchObject({
    newTitle: 'Penyesuaian judul penelitian', submissionType: 'Perpanjangan', advisor1Id: 'lec-02', advisor2Id: '',
  });
  await fixture(page, (saved) => { Object.assign(aktif(saved), revised, { status: 'Perlu Revisi' }); }, 'upload-revisi');
  await choices(page).click();
  await expect(page.getByText(revised.newTitle, { exact: true })).toBeVisible();
  await expect(page.getByText('Judul dan pembimbing terkunci untuk perpanjangan ini.')).toBeVisible();
  await expect(page.locator('#rev-type, #rev-title, #rev-advisor1Id, #rev-advisor2Id')).toHaveCount(0);
});

test('28. Berkas revisi selain PDF dan PDF di atas 20 MiB ditolak', async ({ page }) => {
  const before = aktif(await state(page)).submissions;
  await file(page, 'bukan-pdf.txt', Buffer.from('teks'), 'text/plain');
  await expect(page.getByRole('alert')).toContainText('Hanya berkas');
  await file(page, 'terlalu-besar.pdf', Buffer.alloc(20 * 1024 * 1024 + 1));
  await expect(page.getByRole('alert')).toContainText('melebihi');
  await expect(dropzone(page)).toBeVisible();
  expect(aktif(await state(page)).submissions).toEqual(before);
});

test('29. Seret-lepas PDF menyimpan versi, ringkasan, status dan token setelah muat ulang', async ({ page }) => {
  await dropzone(page).evaluate((element, bytes) => {
    const transfer = new DataTransfer();
    transfer.items.add(new File([new Uint8Array(bytes)], 'revisi-seret.pdf', { type: 'application/pdf' }));
    element.dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true }));
  }, Array.from(pdf));
  await expect(page.getByRole('button', { name: 'Hapus File' })).toBeVisible();
  await page.locator('#rev-summary').fill('Ringkasan revisi hasil sidang.');
  await submit(page).click();
  await expect(page.getByRole('heading', { name: 'Revisi menunggu verifikasi' })).toBeVisible();
  await page.reload();
  await expect(submit(page)).toHaveCount(0);
  const thesis = aktif(await state(page));
  expect(thesis).toMatchObject({ status: 'Menunggu Verifikasi', revisionQrToken: 'ISTTS-REV-221116942-V2' });
  expect(thesis.submissions[0]).toMatchObject({
    kind: 'revisi', fileName: 'revisi-seret.pdf', versionLabel: 'Revisi v2.0',
    summary: 'Ringkasan revisi hasil sidang.', fileSize: pdf.length, revisionQrToken: thesis.revisionQrToken,
  });
});

test('30. QR pada layar terdekode menjadi token yang unik lintas pengajuan mahasiswa', async ({ page }) => {
  expect(await readQr(page)).toBe(aktif(await state(page)).revisionQrToken);
  await fixture(page, (saved) => {
    const old = aktif(saved);
    old.isArchived = true;
    old.submissions[0].revisionQrToken = 'ISTTS-REV-221116942-V7';
    saved.theses.unshift({
      ...old, id: 'pengajuan-berikutnya', isArchived: false, revisionQrToken: undefined,
      submissions: old.submissions.filter((item) => item.kind === 'proposal'),
    });
  }, 'upload-revisi');
  await upload(page, 'revisi-judul-berikutnya.pdf');
  const next = aktif(await state(page));
  expect(next.submissions[0].versionLabel).toBe('Revisi v1.0');
  expect(next.revisionQrToken).toBe('ISTTS-REV-221116942-V8');
  await expect(page.getByText(next.revisionQrToken, { exact: true })).toBeVisible();
  expect(await readQr(page)).toBe(next.revisionQrToken);
});

test('31. Revisi yang diunduh dan dipratinjau sama persis dengan berkas unggahan', async ({ page }) => {
  await upload(page, 'verifikasi-unduhan.pdf');
  await page.reload();
  await buka(page, 'Download Proposal');
  const row = page.getByRole('row').filter({ hasText: 'verifikasi-unduhan.pdf' });
  const direct = await unduh(page, row.getByRole('button', { name: 'Unduh', exact: true }));
  expect(direct.name).toBe('verifikasi-unduhan.pdf');
  expect(direct.bytes.equals(pdf)).toBe(true);
  const preview = await pratinjau(page, row.getByRole('button', { name: 'Pratinjau' }));
  expect(preview.name).toBe(direct.name);
  expect(preview.bytes.equals(pdf)).toBe(true);
});

test('32. Tenggat memblokir unggahan dari formulir lama dan menutup formulir saat dibuka ulang', async ({ page }) => {
  const before = aktif(await state(page));
  await page.locator('#rev-summary').fill('Revisi mendekati tenggat.');
  await file(page, 'terlambat.pdf', pdf);
  await page.clock.setSystemTime(new Date(Date.parse(before.revisionDeadline) + 1));
  await submit(page).click();
  await expect(page.getByRole('status')).toContainText('Batas waktu unggah revisi telah berakhir');
  expect(aktif(await state(page)).submissions).toEqual(before.submissions);
  await page.reload();
  await expect(page.getByText('Batas waktu telah berakhir', { exact: true })).toBeVisible();
  await expect(submit(page)).toHaveCount(0);
});

test('47. Area seret-lepas menandai drag, menerima PDF tepat 20 MiB dan dapat dikosongkan', async ({ page }) => {
  const area = dropzone(page);
  const borderColor = () => area.evaluate((element) => getComputedStyle(element).borderTopColor);
  const initial = await borderColor();
  await area.dispatchEvent('dragover');
  await expect.poll(borderColor).not.toBe(initial);
  await area.dispatchEvent('dragleave');
  await expect.poll(borderColor).toBe(initial);
  const exactPdf = Buffer.alloc(20 * 1024 * 1024, 0x20);
  pdf.copy(exactPdf);
  await file(page, 'ukuran-batas.pdf', exactPdf);
  await expect(page.getByText(/Siap diunggah/)).toBeVisible();
  await page.getByRole('button', { name: 'Hapus File' }).click();
  await expect(area).toBeVisible();
  await expect(page.getByText('ukuran-batas.pdf')).toHaveCount(0);
});
