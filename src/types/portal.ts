export type UserRole = 'mahasiswa' | 'dosen' | 'kaprodi';

export type DosenStructuralRole =
  | 'reviewer-proposal'
  | 'promotor-s3'
  | 'koordinator-jadwal';

export type AcademicStatus =
  | 'Menunggu Verifikasi'
  | 'Perlu Revisi'
  | 'Diperbaiki'
  | 'Perbaikan Bersyarat'
  | 'Diterima'
  | 'Ditolak';

export type ThesisStage =
  | 'Pengajuan Proposal'
  | 'Verifikasi Kaprodi'
  | 'Sidang Proposal'
  | 'Revisi Proposal'
  | 'Pengesahan Akhir';

export type DoctoralStage =
  | 'Ujian Kualifikasi'
  | 'Proposal Disertasi'
  | 'Seminar Hasil Riset'
  | 'Ujian Tertutup'
  | 'Sidang Terbuka';

export interface UserAccount {
  id: string;
  role: UserRole;
  username: string;
  name: string;
  identifier: string; // NIM for mahasiswa, NIDN for dosen/kaprodi
  department: string;
  email: string;
  phone: string;
  initials: string;
  structuralRoles?: DosenStructuralRole[];
}

export interface LecturerProfile {
  id: string;
  name: string;
  nidn: string;
  expertise: string;
  maxQuota: number;
}

export interface SubmissionFile {
  id: string;
  kind: 'proposal' | 'revisi' | 'koreksi';
  versionLabel: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy: string;
  summary: string;
  hasRealBlob: boolean;
  revisionQrToken?: string;
  pdfTitle?: string;
  pdfLines?: string[];
}

export interface EvaluationRecord {
  id: string;
  evaluatorId: string;
  evaluatorName: string;
  evaluatorRole: 'Pembimbing 1' | 'Pembimbing 2' | 'Penguji 1' | 'Penguji 2' | 'Kaprodi';
  stage: ThesisStage;
  status: AcademicStatus;
  notes: string;
  evaluatedAt: string;
  score?: number;
  correctionFile?: SubmissionFile;
}

export interface DefenseRubricScore {
  perumusanMasalah: number; // bobot 25%
  tinjauanPustaka: number; // bobot 20%
  metodologi: number; // bobot 35%
  presentasiTanyaJawab: number; // bobot 20%
  totalScore: number;
  grade: string;
}

export interface DefenseSchedule {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm - HH:mm WIB
  room: string;
  examiner1Id: string;
  examiner2Id: string;
}

export interface ThesisRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentNim: string;
  programStudi: string;
  semester: string;
  title: string;
  field: string;
  abstract: string;
  stage: ThesisStage;
  status: AcademicStatus;
  advisor1Id: string;
  advisor2Id: string;
  proposedAdvisor1Id?: string;
  proposedAdvisor2Id?: string;
  revisionQrToken?: string;
  submissions: SubmissionFile[];
  evaluations: EvaluationRecord[];
  defenseSchedule?: DefenseSchedule;
  defenseScore?: DefenseRubricScore;
  revisionDeadline?: string;
  updatedAt: string;
}

export interface TopicRecommendation {
  id: string;
  title: string;
  field: string;
  lecturerId: string;
  lecturerName: string;
  quota: number;
  takenCount: number;
  status: 'Tersedia' | 'Reserved' | 'Penuh';
  reservedByName?: string;
  reservedByNim?: string;
  description: string;
  prerequisites: string;
  createdAt: string;
}

export interface ArchiveEntry {
  id: string;
  title: string;
  studentName: string;
  studentNim: string;
  year: number;
  field: string;
  type: 'Proposal TA' | 'Laporan TA' | 'Tesis S2' | 'Disertasi S3';
  advisor1Name: string;
  advisor2Name: string;
  keywords: string[];
  abstract: string;
}

export interface OfficialTemplate {
  id: string;
  title: string;
  category: string;
  version: string;
  fileName: string;
  fileSize: number;
  updatedAt: string;
  description: string;
  pdfLines: string[];
}

export interface NotificationItem {
  id: string;
  targetRole: UserRole | 'all';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  targetTab?: string;
  targetSubTab?: string;
  targetThesisId?: string;
}

export interface AcademicPeriod {
  semesterLabel: string;
  proposalDeadline: string;
  defenseWindow: string;
  revisionDeadline: string;
  maxAdvisorQuota: number;
}

export interface PreviewFilePayload {
  id: string;
  fileName: string;
  title: string;
  subtitle: string;
  lines: string[];
  hasRealBlob: boolean;
}

export interface DoctoralLogEntry {
  id: string;
  date: string;
  topic: string;
  progressSummary: string;
  publicationNote?: string;
  status: 'Menunggu Verifikasi' | 'Disetujui' | 'Perlu Revisi';
  promoterNote?: string;
}

export interface DoctoralStudentRecord {
  id: string;
  name: string;
  nim: string;
  programStudi: string;
  dissertationTitle: string;
  lecturerRole: 'Promotor' | 'Ko-Promotor';
  partnerName: string;
  currentStage: DoctoralStage;
  stageStatus: AcademicStatus;
  logBooks: DoctoralLogEntry[];
  updatedAt: string;
}

export interface LecturerScheduleItem {
  id: string;
  dayOfWeek: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  title: string;
  category: 'Mengajar' | 'Bimbingan' | 'Sidang Terkonfirmasi';
  room: string;
  thesisId?: string;
}

export interface CandidateDefenseSlot {
  id: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  room: string;
}
