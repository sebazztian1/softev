import { LecturerProfile, PreviewFilePayload, SubmissionFile, ThesisRecord } from '../types/portal';
import { getFileBlob } from './fileStorage';
import { generateAcademicPdfBlob } from './pdfGenerator';

const BULAN_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export function formatDateId(isoOrDate: string): string {
  if (!isoOrDate) return '-';
  const date = new Date(isoOrDate);
  if (Number.isNaN(date.getTime())) return isoOrDate;
  return `${date.getDate()} ${BULAN_ID[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatDateTimeId(iso: string): string {
  if (!iso) return '-';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${date.getDate()} ${BULAN_ID[date.getMonth()]} ${date.getFullYear()}, ${hh}:${mm} WIB`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatCountdown(isoDate: string): {
  label: string;
  isUrgent: boolean;
  isExpired: boolean;
} {
  const target = new Date(isoDate).getTime();
  const now = Date.now();
  const diff = target - now;

  if (Number.isNaN(target)) {
    return { label: 'Belum ditetapkan', isUrgent: false, isExpired: false };
  }
  if (diff <= 0) {
    return { label: 'Batas waktu telah berakhir', isUrgent: true, isExpired: true };
  }

  const totalHours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  return {
    label: `${days} Hari ${hours} Jam`,
    isUrgent: days <= 7,
    isExpired: false,
  };
}

export function getLecturerName(lecturers: LecturerProfile[], id: string): string {
  if (!id) return 'Belum ditetapkan';
  return lecturers.find((l) => l.id === id)?.name ?? 'Belum ditetapkan';
}

export function submissionPdf(thesis: ThesisRecord, file: SubmissionFile): PreviewFilePayload {
  return {
    id: file.id, fileName: file.fileName, title: file.pdfTitle ?? file.versionLabel,
    subtitle: `${thesis.studentName} (${thesis.studentNim})`,
    lines: file.pdfLines ?? [
      `Berkas: ${file.fileName}`,
      `Diunggah oleh: ${file.uploadedBy}`,
      `Ringkasan: ${file.summary}`,
    ],
    hasRealBlob: file.hasRealBlob,
  };
}

export async function resolvePdfPayload(payload: PreviewFilePayload, requireOriginal = true): Promise<Blob> {
  if (payload.assetUrl) {
    const response = await fetch(payload.assetUrl);
    if (response.ok) {
      const blob = await response.blob();
      if (await blob.slice(0, 5).text() === '%PDF-') return blob.slice(0, blob.size, 'application/pdf');
    }
    throw new Error('Formulir PDF gagal dimuat. Silakan coba lagi.');
  }
  if (payload.hasRealBlob) {
    const blob = await getFileBlob(payload.id).catch(() => null);
    if (blob) return blob;
    if (requireOriginal) {
      throw new Error('Berkas unggahan tidak ditemukan di penyimpanan peramban ini.');
    }
  }
  return generateAcademicPdfBlob(payload);
}

export async function downloadPdfPayload(payload: PreviewFilePayload, requireOriginal = false): Promise<void> {
  const blob = await resolvePdfPayload(payload, requireOriginal);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = payload.fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportThesesToCsv(
  records: ThesisRecord[],
  lecturers: LecturerProfile[],
  fileNamePrefix = 'monitoring-tugas-akhir-istts',
): void {
  const headers = [
    'NIM',
    'Nama Mahasiswa',
    'Program Studi',
    'Periode',
    'Judul Tugas Akhir',
    'Bidang Minat',
    'Tahap',
    'Status',
    'Pembimbing 1',
    'Pembimbing 2',
    'Nilai Akhir',
  ];

  const escapeCsv = (value: string) => {
    const clean = value.replace(/"/g, '""');
    return `"${clean}"`;
  };

  const rows = records.map((item) => [
    item.studentNim,
    item.studentName,
    item.programStudi,
    item.semester,
    item.title,
    item.field,
    item.stage,
    item.status,
    getLecturerName(lecturers, item.advisor1Id),
    getLecturerName(lecturers, item.advisor2Id),
    item.defenseScore
      ? `${item.defenseScore.totalScore.toFixed(1)} (${item.defenseScore.grade})`
      : '-',
  ]);

  const csvContent =
    '\uFEFF' +
    [headers, ...rows].map((row) => row.map((cell) => escapeCsv(cell)).join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${fileNamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
