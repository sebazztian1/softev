export type AdminRole = 'KAPRODI' | 'DEKAN';
export type ProposalStatus =
  | 'Diajukan'
  | 'Dalam Review'
  | 'Diterima'
  | 'Diperbaiki'
  | 'Perbaikan Bersyarat'
  | 'Ditolak';
export type RevisionStatus =
  | 'Menunggu Persetujuan'
  | 'Disetujui'
  | 'Ditolak'
  | 'Perlu Revisi';

export interface Program {
  code: string;
  name: string;
  level: 'S1' | 'S2';
  quotaGroup: number;
}

export interface AdminLecturer {
  id: string;
  name: string;
  program: string;
  expertise: string;
  tags: string[];
  status: 'Aktif' | 'Cuti';
  periodLoad: number;
  semesterLoad: number;
  reviewLoad: number;
}

export interface AdminProposal {
  id: string;
  nrp: string;
  studentName: string;
  ipk: number;
  program: string;
  period: string;
  title: string;
  type: 'Judul Baru' | 'Perpanjangan';
  field: string;
  tags: string[];
  sks: 4 | 6;
  advisorId: string | null;
  coAdvisorId: string | null;
  status: ProposalStatus;
  review: 'Belum ditinjau' | 'Diteruskan ke plotting' | 'Perlu perbaikan';
  submittedAt: string;
  reviewers: string[];
  history: { at: string; actor: string; action: string; note?: string }[];
  damaged?: boolean;
}

export interface RevisionApproval {
  role: 'PEMBIMBING' | 'KAPRODI' | 'DEKAN';
  status: 'Menunggu' | 'Disetujui' | 'Ditolak';
  by?: string;
  at?: string;
  note?: string;
}

export interface AdminRevision {
  code: string;
  proposalId: string;
  version: number;
  currentVersion: number;
  status: RevisionStatus;
  expiresAt: string;
  approvals: RevisionApproval[];
  simulateServerFailure?: boolean;
}

export const PROGRAMS: Program[] = [
  { code: 'IF', name: 'S1-INFORMATIKA', level: 'S1', quotaGroup: 1 },
  { code: 'SI', name: 'S1-SISTEM INFORMASI', level: 'S1', quotaGroup: 1 },
  { code: 'TE', name: 'S1-ELEKTRO', level: 'S1', quotaGroup: 2 },
  { code: 'TI', name: 'S1-INDUSTRI', level: 'S1', quotaGroup: 2 },
  { code: 'S2TI', name: 'S2-TEKNOLOGI INFORMASI', level: 'S2', quotaGroup: 3 },
];

export const PERIODS = [
  { code: '202608', label: 'AGUSTUS 2026', status: 'Selesai' },
  { code: '202610', label: 'OKTOBER 2026', status: 'Selesai' },
  { code: '202612', label: 'DESEMBER 2026', status: 'Aktif' },
  { code: '202702', label: 'FEBRUARI 2027', status: 'Belum dibuka' },
] as const;

export const NOW = '2026-11-25T10:00:00+07:00';

export const ADMIN_LECTURERS: AdminLecturer[] = [
  { id: 'D-01', name: 'Dr. Ratna Puspita, M.Kom.', program: 'S1-INFORMATIKA', expertise: 'Rekayasa perangkat lunak', tags: ['rpl', 'web', 'basis-data'], status: 'Aktif', periodLoad: 3, semesterLoad: 9, reviewLoad: 6 },
  { id: 'D-02', name: 'Dr. Ahmad Fauzi, S.T., M.T.', program: 'S1-INFORMATIKA', expertise: 'Jaringan komputer', tags: ['jaringan', 'iot', 'keamanan'], status: 'Aktif', periodLoad: 2, semesterLoad: 7, reviewLoad: 5 },
  { id: 'D-03', name: 'Dewi Anggraini, M.Kom.', program: 'S1-INFORMATIKA', expertise: 'Kecerdasan buatan', tags: ['ai', 'nlp', 'data-mining'], status: 'Aktif', periodLoad: 3, semesterLoad: 8, reviewLoad: 8 },
  { id: 'D-04', name: 'Ir. Hendra Saputra, M.T.', program: 'S1-INFORMATIKA', expertise: 'Sistem tertanam', tags: ['iot', 'embedded', 'jaringan'], status: 'Aktif', periodLoad: 3, semesterLoad: 7, reviewLoad: 4 },
  { id: 'D-05', name: 'Dr. Yusuf Hidayat, S.Kom., M.Sc.', program: 'S1-INFORMATIKA', expertise: 'Keamanan informasi', tags: ['keamanan', 'jaringan', 'kriptografi'], status: 'Aktif', periodLoad: 4, semesterLoad: 11, reviewLoad: 7 },
  { id: 'D-06', name: 'Lestari Handayani, M.Kom.', program: 'S1-INFORMATIKA', expertise: 'Penambangan data', tags: ['data-mining', 'ai', 'basis-data'], status: 'Aktif', periodLoad: 3, semesterLoad: 12, reviewLoad: 5 },
  { id: 'D-07', name: 'Bambang Setiawan, M.T.', program: 'S1-INFORMATIKA', expertise: 'Pengolahan citra', tags: ['citra', 'ai', 'embedded'], status: 'Cuti', periodLoad: 1, semesterLoad: 5, reviewLoad: 0 },
  { id: 'D-08', name: 'Fitri Nuraini, S.T., M.Kom.', program: 'S1-INFORMATIKA', expertise: 'Sistem informasi', tags: ['basis-data', 'web', 'rpl'], status: 'Aktif', periodLoad: 1, semesterLoad: 4, reviewLoad: 2 },
  { id: 'D-09', name: 'Dr. Rina Wulandari, M.Kom.', program: 'S1-SISTEM INFORMASI', expertise: 'Analisis sistem', tags: ['sistem-informasi', 'data', 'ux'], status: 'Aktif', periodLoad: 2, semesterLoad: 6, reviewLoad: 3 },
  { id: 'D-10', name: 'Ir. Arief Nugroho, M.T.', program: 'S1-ELEKTRO', expertise: 'Sistem tenaga listrik', tags: ['elektro', 'energi', 'iot'], status: 'Aktif', periodLoad: 2, semesterLoad: 7, reviewLoad: 3 },
  { id: 'D-11', name: 'Dr. Maya Lestari, M.T.', program: 'S1-INDUSTRI', expertise: 'Rekayasa industri', tags: ['industri', 'optimasi', 'data'], status: 'Aktif', periodLoad: 1, semesterLoad: 5, reviewLoad: 2 },
  { id: 'D-12', name: 'Dr. Fajar Wibowo, M.Kom.', program: 'S2-TEKNOLOGI INFORMASI', expertise: 'Sains data', tags: ['data-mining', 'ai', 'cloud'], status: 'Aktif', periodLoad: 1, semesterLoad: 3, reviewLoad: 2 },
];

const names = [
  'Amanda Safitri', 'Yoga Pratama', 'Rafi Alfarizi', 'Intan Permata',
  'Daffa Prasetyo', 'Salsabila Nurhaliza', 'Fajar Ramadhan', 'Maya Kusuma',
  'Aditya Pratama', 'Nabila Zahra', 'Kevin Pratama', 'Nadia Putri',
  'Rizky Maulana', 'Dinda Maharani', 'Arif Setiawan', 'Citra Lestari',
  'Bagas Saputra', 'Alya Rahmawati', 'Farhan Akbar', 'Nanda Puspita',
  'Reno Kurniawan', 'Tiara Amelia', 'Dimas Haryanto', 'Putri Anindya',
  'Reza Firmansyah', 'Siti Azzahra', 'Galih Prakoso', 'Nisa Khairunnisa',
];
const topics: [string, string, string[]][] = [
  ['Sistem Rekomendasi Pemilihan Mata Kuliah dengan Collaborative Filtering', 'Kecerdasan buatan', ['ai', 'data-mining']],
  ['Implementasi IoT untuk Monitoring Kualitas Udara dalam Ruangan', 'Sistem tertanam', ['iot', 'embedded']],
  ['Perancangan Aplikasi Manajemen Tugas Akhir Berbasis Web dengan Arsitektur Modular', 'Rekayasa perangkat lunak', ['web', 'rpl']],
  ['Klasifikasi Sentimen Ulasan Aplikasi Akademik Menggunakan IndoBERT', 'Kecerdasan buatan', ['ai', 'nlp']],
  ['Analisis Performa Jaringan Kampus dengan Pemantauan Berbasis SNMP', 'Jaringan komputer', ['jaringan', 'keamanan']],
  ['Deteksi Anomali Lalu Lintas Jaringan dengan Isolation Forest', 'Keamanan informasi', ['keamanan', 'data-mining']],
  ['Prediksi Kelulusan Mahasiswa dengan Pohon Keputusan Gradien', 'Penambangan data', ['data-mining', 'ai']],
  ['Purwarupa Sistem Irigasi Otomatis Berbasis ESP32', 'Sistem tertanam', ['iot', 'embedded']],
];
const activeCounts: Record<string, [number, number]> = {
  IF: [14, 12], SI: [10, 11], TE: [8, 10], TI: [6, 8], S2TI: [3, 5],
};
const octoberCounts: Record<string, number[]> = {
  IF: [18, 5, 3, 1], SI: [14, 4, 2, 1], TE: [12, 3, 2, 1], TI: [9, 2, 2, 1], S2TI: [4, 2, 1, 0],
};
function makeProposal(
  program: Program,
  period: string,
  index: number,
  status: AdminProposal['status'],
  options: Partial<AdminProposal> = {},
): AdminProposal {
  const topic = topics[index % topics.length];
  const studentName = options.studentName ?? names[index % names.length];
  const monthDay = period === '202612' ? Math.max(15, 25 - (index % 8)) : 8 + (index % 20);
  return {
    id: `PR-${program.code}-${String(period === '202612' ? 201 + index : 100 + index).padStart(4, '0')}`,
    nrp: `${period.slice(2, 4)}${program.level === 'S2' ? '5' : '3'}${program.code === 'IF' || program.code === 'S2TI' ? '117' : program.code === 'SI' ? '118' : program.code === 'TE' ? '111' : '112'}${String(20 + index).padStart(3, '0')}`,
    studentName,
    ipk: Number((3.05 + (index % 9) * 0.1).toFixed(2)),
    program: program.name,
    period,
    title: options.title ?? topic[0],
    type: options.type ?? 'Judul Baru',
    field: options.field ?? topic[1],
    tags: options.tags ?? topic[2],
    sks: options.sks ?? (index % 4 === 0 ? 6 : 4),
    advisorId: options.advisorId === undefined ? null : options.advisorId,
    coAdvisorId: null,
    status,
    review: options.review ?? (status === 'Diajukan' ? 'Belum ditinjau' : 'Diteruskan ke plotting'),
    submittedAt: `2026-${period === '202612' ? '11' : period.slice(4, 6)}-${String(monthDay).padStart(2, '0')}`,
    reviewers: options.reviewers ?? [],
    history: [],
    ...options,
  };
}

function buildActive(program: Program): AdminProposal[] {
  const [submitted, reviewing] = activeCounts[program.code];
  const result: AdminProposal[] = [];
  for (let index = 0; index < submitted; index += 1) {
    const sentToPlotting = index >= Math.max(0, submitted - 6);
    result.push(makeProposal(program, '202612', index, 'Diajukan', {
      review: sentToPlotting ? 'Diteruskan ke plotting' : 'Belum ditinjau',
      advisorId: program.code === 'IF'
        ? index < 2 ? ['D-03', 'D-04'][index] : index < 8 ? null : ['D-01', 'D-02', 'D-03'][index % 3]
        : index < 2 ? ['D-09', 'D-10', 'D-11', 'D-12'][PROGRAMS.findIndex((item) => item.code === program.code) - 1] ?? null : null,
      reviewers: sentToPlotting ? ['D-01', 'D-02', 'D-04'] : [],
    }));
  }
  for (let index = 0; index < reviewing; index += 1) {
    result.push(makeProposal(program, '202612', submitted + index, 'Dalam Review', {
      advisorId: program.code === 'IF' ? ['D-01', 'D-02', 'D-03'][index % 3] : null,
      reviewers: ['D-01', 'D-02', 'D-04'],
    }));
  }
  return result;
}

function buildOctober(program: Program): AdminProposal[] {
  const counts = octoberCounts[program.code];
  const statuses: AdminProposal['status'][] = ['Diterima', 'Diperbaiki', 'Perbaikan Bersyarat', 'Ditolak'];
  return statuses.flatMap((status, statusIndex) =>
    Array.from({ length: counts[statusIndex] }, (_, index) =>
      makeProposal(program, '202610', statusIndex * 30 + index, status, {
        advisorId: program.code === 'IF' ? ['D-01', 'D-02', 'D-03'][index % 3] : null,
        ...(program.code === 'IF' && statusIndex === 1 && index === 0
          ? { studentName: 'Aditya Pratama', nrp: '223117021', title: 'Analisis Keamanan API pada Sistem Informasi Akademik', type: 'Judul Baru' as const }
          : {}),
      }),
    ),
  );
}

export const SEED_ADMIN_PROPOSALS: AdminProposal[] = PROGRAMS.flatMap((program) => [
  ...buildActive(program),
  ...buildOctober(program),
]);

const namedIfProposals = [
  ['Amanda Safitri', '223117036', 'Sistem Rekomendasi Pemilihan Mata Kuliah dengan Collaborative Filtering', 'Kecerdasan buatan', ['ai', 'data-mining'], 'D-03'],
  ['Yoga Pratama', '223117040', 'Implementasi IoT untuk Monitoring Kualitas Udara dalam Ruangan', 'Sistem tertanam', ['iot', 'embedded'], 'D-04'],
  ['Rafi Alfarizi', '223117030', 'Perancangan Aplikasi Manajemen Tugas Akhir Berbasis Web dengan Arsitektur Modular', 'Rekayasa perangkat lunak', ['web', 'rpl'], null],
  ['Intan Permata', '223117042', 'Klasifikasi Sentimen Ulasan Aplikasi Akademik Menggunakan IndoBERT', 'Kecerdasan buatan', ['ai', 'nlp'], null],
  ['Daffa Prasetyo', '223117048', 'Analisis Performa Jaringan Kampus dengan Pemantauan Berbasis SNMP', 'Jaringan komputer', ['jaringan', 'iot'], null],
  ['Salsabila Nurhaliza', '223117051', 'Deteksi Anomali Lalu Lintas Jaringan dengan Isolation Forest', 'Keamanan informasi', ['keamanan', 'data-mining'], null],
  ['Fajar Ramadhan', '223117055', 'Prediksi Kelulusan Mahasiswa dengan Pohon Keputusan Gradien', 'Penambangan data', ['data-mining', 'ai'], null],
  ['Maya Kusuma', '223117059', 'Purwarupa Sistem Irigasi Otomatis Berbasis ESP32', 'Sistem tertanam', ['iot', 'embedded'], null],
] as const;

for (const [index, [studentName, nrp, title, field, tags, advisorId]] of namedIfProposals.entries()) {
  const proposal = SEED_ADMIN_PROPOSALS.find(
    (item) => item.program === 'S1-INFORMATIKA' && item.period === '202612' && item.studentName === names[index],
  );
  if (proposal) {
    proposal.studentName = studentName;
    proposal.nrp = nrp;
    proposal.title = title;
    proposal.field = field;
    proposal.tags = [...tags];
    proposal.advisorId = advisorId;
    proposal.id = index === 0 ? 'PR-IF-0201' : `PR-IF-020${index + 1}`;
    proposal.sks = index === 2 || index === 5 ? 6 : 4;
    proposal.review = index < 2 ? 'Belum ditinjau' : index < 8 ? 'Belum ditinjau' : proposal.review;
    proposal.type = index === 4 ? 'Perpanjangan' : 'Judul Baru';
  }
}

const ifActive = SEED_ADMIN_PROPOSALS.filter((item) => item.program === 'S1-INFORMATIKA' && item.period === '202612');
const ifRecommended = ifActive.filter((item) => item.review === 'Diteruskan ke plotting');
ifRecommended[0] && (ifRecommended[0].reviewers = ['D-01', 'D-02', 'D-04', 'D-08']);
ifRecommended[2] && (ifRecommended[2].reviewers = ['D-07', 'D-02', 'D-04']);
ifRecommended[3] && (ifRecommended[3].reviewers = ['D-03', 'D-02', 'D-04']);

const revisions = [
  ['REV-2026-0101', 'PR-IF-0130', 2, 2, '2026-12-17T17:00:00+07:00', 'Disetujui', 'Menunggu'],
  ['REV-2026-0102', 'PR-IF-0102', 2, 2, '2026-12-17T17:00:00+07:00', 'Disetujui', 'Menunggu'],
  ['REV-2026-0103', 'PR-IF-0103', 2, 2, '2026-11-20T17:00:00+07:00', 'Disetujui', 'Menunggu'],
  ['REV-2026-0104', 'PR-IF-0104', 2, 2, '2026-12-17T17:00:00+07:00', 'Menunggu', 'Menunggu'],
  ['REV-2026-0105', 'PR-IF-0105', 2, 3, '2026-12-17T17:00:00+07:00', 'Disetujui', 'Menunggu'],
  ['REV-2026-0106', 'PR-IF-0106', 2, 2, '2026-12-17T17:00:00+07:00', 'Disetujui', 'Menunggu'],
  ['REV-2026-0107', 'PR-IF-0107', 2, 2, '2026-12-17T17:00:00+07:00', 'Disetujui', 'Menunggu'],
  ['REV-2026-0108', 'PR-IF-0108', 2, 2, '2026-12-17T17:00:00+07:00', 'Disetujui', 'Menunggu'],
  ['REV-2026-0109', 'PR-IF-0109', 2, 2, '2026-12-17T17:00:00+07:00', 'Disetujui', 'Menunggu'],
  ['REV-2026-0201', 'PR-IF-0201', 2, 2, '2026-12-17T17:00:00+07:00', 'Disetujui', 'Menunggu'],
  ['REV-2026-0202', 'PR-IF-0202', 2, 2, '2026-12-17T17:00:00+07:00', 'Menunggu', 'Menunggu'],
  ['REV-2026-0203', 'PR-IF-0203', 2, 2, '2026-12-17T17:00:00+07:00', 'Disetujui', 'Menunggu'],
  ['REV-2026-0204', 'PR-IF-0204', 2, 2, '2026-11-20T17:00:00+07:00', 'Disetujui', 'Menunggu'],
] as const;

const makeApprovals = (kaprodi: RevisionApproval['status'], dekan: RevisionApproval['status']): RevisionApproval[] => [
  { role: 'PEMBIMBING', status: 'Disetujui', by: 'Dr. Ratna Puspita, M.Kom.', at: '2026-11-20T09:00:00+07:00' },
  { role: 'KAPRODI', status: kaprodi, by: kaprodi === 'Disetujui' ? 'Dr. Andi Wijaya, S.Kom., M.Kom.' : undefined, at: kaprodi === 'Disetujui' ? '2026-11-21T11:00:00+07:00' : undefined },
  { role: 'DEKAN', status: dekan, by: dekan === 'Disetujui' ? 'Prof. Budi Santoso, Ph.D.' : undefined, at: dekan === 'Disetujui' ? '2026-11-24T14:12:00+07:00' : undefined },
];

export const SEED_ADMIN_REVISIONS: AdminRevision[] = revisions.map(
  ([code, proposalId, version, currentVersion, expiresAt, kaprodi, dekan]) => ({
    code,
    proposalId,
    version,
    currentVersion,
    status: 'Menunggu Persetujuan',
    expiresAt,
    approvals: makeApprovals(kaprodi, dekan),
    simulateServerFailure: code === 'REV-2026-0106',
  }),
);

SEED_ADMIN_REVISIONS.find((item) => item.code === 'REV-2026-0102')!.approvals[2] = {
  role: 'DEKAN',
  status: 'Disetujui',
  by: 'Prof. Budi Santoso, Ph.D.',
  at: '2026-11-24T14:12:00+07:00',
};
SEED_ADMIN_REVISIONS.find((item) => item.code === 'REV-2026-0102')!.status = 'Disetujui';
SEED_ADMIN_REVISIONS.find((item) => item.code === 'REV-2026-0102')!.status = 'Disetujui';
SEED_ADMIN_REVISIONS.find((item) => item.code === 'REV-2026-0202')!.approvals[0] = {
  role: 'PEMBIMBING',
  status: 'Menunggu',
};
for (const code of ['REV-2026-0201', 'REV-2026-0202', 'REV-2026-0203', 'REV-2026-0204']) {
  const revision = SEED_ADMIN_REVISIONS.find((item) => item.code === code)!;
  revision.approvals[1] = { role: 'KAPRODI', status: 'Menunggu' };
  revision.approvals[2] = { role: 'DEKAN', status: 'Menunggu' };
}
SEED_ADMIN_REVISIONS.find((item) => item.code === 'REV-2026-0204')!.expiresAt = '2026-11-20T17:00:00+07:00';
SEED_ADMIN_REVISIONS.push({
  code: 'REV-2026-0301',
  proposalId: 'PR-IF-0100',
  version: 2,
  currentVersion: 2,
  status: 'Menunggu Persetujuan',
  expiresAt: '2026-12-17T17:00:00+07:00',
  approvals: makeApprovals('Disetujui', 'Menunggu'),
});

SEED_ADMIN_PROPOSALS.forEach((proposal) => {
  if (proposal.id === 'PR-IF-0107') proposal.damaged = true;
});

export const getLecturer = (id: string | null): AdminLecturer | undefined =>
  ADMIN_LECTURERS.find((lecturer) => lecturer.id === id);
