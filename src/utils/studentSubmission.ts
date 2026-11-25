import type { AcademicPeriod, LecturerProfile, MaxQuotaSetting, ThesisRecord, UserAccount } from '../types/portal';

type Student = Pick<UserAccount, 'id' | 'department'>;

export async function validateStudentPdf(file: File, maxSizeMb = 20): Promise<string | null> {
  if (!file.name.toLowerCase().endsWith('.pdf')) return 'Hanya berkas berformat .PDF yang diperbolehkan.';
  if (file.size > maxSizeMb * 1024 * 1024) return `Ukuran berkas melebihi batas maksimal ${maxSizeMb} MB.`;
  if (await file.slice(0, 5).text() !== '%PDF-') return 'Isi berkas tidak dikenali sebagai dokumen PDF.';
  return null;
}

export function advisorQuotaFull(
  lecturer: LecturerProfile,
  theses: ThesisRecord[],
  student: Student,
  period: AcademicPeriod,
  maxQuotas: MaxQuotaSetting[],
): boolean {
  const setting = maxQuotas.find((item) => item.department === student.department);
  const limit = Math.min(
    lecturer.maxQuota,
    setting?.maxPerPeriod ?? period.maxAdvisorQuota,
    setting?.maxPerSemester ?? Infinity,
  );
  const assigned = new Set(
    theses.filter((thesis) =>
      !thesis.isArchived && thesis.status !== 'Ditolak' && thesis.studentId !== student.id &&
      thesis.programStudi === student.department && thesis.semester === period.semesterLabel &&
      (thesis.advisor1Id === lecturer.id || thesis.advisor2Id === lecturer.id),
    ).map((thesis) => thesis.studentId),
  );
  return assigned.size >= limit;
}

export function getAdvisorQuotaError(
  advisor1Id: string,
  advisor2Id: string,
  lecturers: LecturerProfile[],
  theses: ThesisRecord[],
  student: Student,
  period: AcademicPeriod,
  maxQuotas: MaxQuotaSetting[],
): string | null {
  if (!advisor1Id) return 'Pilih dosen pembimbing utama.';
  if (advisor1Id === advisor2Id) return 'Dosen pembimbing dan co-pembimbing harus berbeda.';
  for (const id of [advisor1Id, advisor2Id].filter(Boolean)) {
    const lecturer = lecturers.find((item) => item.id === id);
    if (!lecturer) return 'Dosen yang dipilih tidak tersedia.';
    if (advisorQuotaFull(lecturer, theses, student, period, maxQuotas)) {
      return `Kuota bimbingan ${lecturer.name} sudah penuh untuk periode ini.`;
    }
  }
  return null;
}
