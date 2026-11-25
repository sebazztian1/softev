export type UserRole = 'mahasiswa' | 'dosen' | 'kaprodi';

export type AcademicStatus =
  | 'Menunggu Verifikasi'
  | 'Perlu Revisi'
  | 'Diterima'
  | 'Ditolak';

export type ThesisStage =
  | 'Pengajuan Proposal'
  | 'Verifikasi Kaprodi'
  | 'Sidang Proposal'
  | 'Revisi Proposal'
  | 'Pengesahan Akhir';

export interface UserAccount {
  id: string;
  role: UserRole;
  name: string;
  identifier: string; // NIM for mahasiswa, NIDN for dosen/kaprodi
  department: string;
  email: string;
  phone: string;
  initials: string;
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
  status: 'Tersedia' | 'Penuh';
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
  type: 'Proposal TA' | 'Laporan TA';
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
