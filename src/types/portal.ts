export type UserRole = 'mahasiswa' | 'dosen' | 'kaprodi' | 'dekan';

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
  | 'Ujian Kelayakan'
  | 'Sidang Tertutup'
  | 'Promosi Terbuka';

export interface UserAccount {
  id: string;
  role: UserRole;
  username: string;
  name: string;
  identifier: string; // NRP/NIM for mahasiswa, NIDN for dosen/kaprodi
  department: string;
  email: string;
  phone: string;
  initials: string;
  ipk?: number;
  structuralRoles?: DosenStructuralRole[];
}

export interface LecturerProfile {
  id: string;
  name: string;
  nidn: string;
  expertise: string;
  tags: string[];
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
  evaluatorRole:
    | 'Pembimbing 1'
    | 'Pembimbing 2'
    | 'Penguji 1'
    | 'Penguji 2'
    | 'Penguji 3'
    | 'Penguji 4'
    | 'Kaprodi';
  stage: ThesisStage;
  status: AcademicStatus;
  notes: string;
  requirements?: string[];
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
  ipk: number;
  programStudi: string;
  semester: string;
  submissionType: 'Judul Baru' | 'Perpanjangan';
  title: string;
  newTitle?: string;
  field: string;
  tags: string[];
  sksWeight: number;
  abstract: string;
  stage: ThesisStage;
  status: AcademicStatus;
  advisor1Id: string;
  advisor2Id: string;
  proposedAdvisor1Id?: string;
  proposedAdvisor2Id?: string;
  proposalReviewers: string[]; // max 4
  taExaminers: string[]; // max 4, min 2 from proposalReviewers
  skIssued?: boolean;
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
  ipk: number;
  year: number;
  semester: string;
  isExtension: boolean;
  field: string;
  tags: string[];
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
  managedBy: string;
}

export interface MaxQuotaSetting {
  department: string;
  maxPerPeriod: number;
  maxPerSemester: number;
}

export interface BaaRoomSlot {
  id: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  room: string;
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

export interface DoctoralPublication {
  id: string;
  title: string;
  journal: string;
  indexType: 'Scopus Q1' | 'Scopus Q2' | 'WoS';
  status: 'Published' | 'Accepted' | 'Under Review';
  year: number;
}

export interface DoctoralStudentRecord {
  id: string;
  name: string;
  nim: string;
  programStudi: string;
  dissertationTitle: string;
  lecturerRole: 'Promotor' | 'Ko-Promotor';
  partnerName: string;
  externalExaminer: string;
  currentStage: DoctoralStage;
  stageStatus: AcademicStatus;
  logBooks: DoctoralLogEntry[];
  publications: DoctoralPublication[];
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
