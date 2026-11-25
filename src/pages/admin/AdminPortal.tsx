import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardList,
  FileCheck2,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { Footer } from '../../components/layout/Footer';
import { IsttsLogo } from '../../components/ui/IsttsLogo';
import { usePortal } from '../../context/PortalContext';
import {
  AdminLecturer,
  AdminProposal,
  AdminRevision,
  NOW,
  PERIODS,
  PROGRAMS,
  ProposalStatus,
  RevisionApproval,
  SEED_ADMIN_PROPOSALS,
  SEED_ADMIN_REVISIONS,
  ADMIN_LECTURERS,
  getLecturer,
} from '../../types/adminPortal';
import { formatDateId } from '../../utils/format';

type Props = { onExit: () => void };
type ModalState = 'assign' | 'confirm-approval' | 'reviewers' | null;

const KAPRODI_MENU = [
  ['Ringkasan Prodi', '/kaprodi', LayoutDashboard],
  ['Pengajuan Judul', '/kaprodi/pengajuan', ClipboardList],
  ['Penugasan Pembimbing', '/kaprodi/penugasan', Users],
  ['Plotting Reviewer', '/kaprodi/reviewer', FileCheck2],
  ['Plotting Penguji TA', '/kaprodi/penguji', ShieldCheck],
  ['Hasil Sidang Proposal', '/kaprodi/hasil-sidang', FileText],
  ['Jadwal Sidang', '/kaprodi/jadwal', CalendarDays],
  ['Approve Revisi (QR)', '/kaprodi/approve', Check],
  ['Kuota Bimbingan', '/kaprodi/kuota', Users],
  ['Laporan', '/kaprodi/laporan', ClipboardList],
  ['Dokumen & Panduan', '/kaprodi/dokumen', BookOpen],
] as const;
const DEKAN_MENU = [
  ['Dashboard Fakultas', '/dekan', LayoutDashboard],
  ['Daftar Proposal TA/Tesis', '/dekan/proposal', ClipboardList],
  ['Approve Revisi (QR)', '/dekan/approve', Check],
  ['Monitoring', '/dekan/monitoring', FileCheck2],
] as const;

const STATUS_CLASSES: Record<ProposalStatus | 'Menunggu Persetujuan' | 'Disetujui' | 'Tersedia' | 'Hampir Penuh' | 'Penuh' | 'Cuti', string> = {
  Diajukan: 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]',
  'Dalam Review': 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]',
  Diterima: 'border-[#86EFAC] bg-[#DCFCE7] text-[#15803D]',
  Diperbaiki: 'border-[#FDBA74] bg-[#FFEDD5] text-[#C2410C]',
  'Perbaikan Bersyarat': 'border-[#FDBA74] bg-[#FFEDD5] text-[#C2410C]',
  Ditolak: 'border-[#FCA5A5] bg-[#FEE2E2] text-[#B91C1C]',
  'Menunggu Persetujuan': 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]',
  Disetujui: 'border-[#86EFAC] bg-[#DCFCE7] text-[#15803D]',
  Tersedia: 'border-[#86EFAC] bg-[#DCFCE7] text-[#15803D]',
  'Hampir Penuh': 'border-[#FDBA74] bg-[#FFEDD5] text-[#C2410C]',
  Penuh: 'border-[#FCA5A5] bg-[#FEE2E2] text-[#B91C1C]',
  Cuti: 'border-[#FCA5A5] bg-[#FEE2E2] text-[#B91C1C]',
};

function readSeed<T>(key: string, seed: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return seed;
  try {
    return JSON.parse(raw) as T;
  } catch {
    localStorage.removeItem(key);
    return seed;
  }
}

function writeDownload(name: string, content: string, type = 'text/plain'): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

const Pill: React.FC<{ children: React.ReactNode; tone?: string }> = ({ children, tone }) => (
  <span className={`inline-flex items-center rounded-full border px-3 py-1 label-md ${tone ?? STATUS_CLASSES[children as keyof typeof STATUS_CLASSES] ?? 'border-[#E2E8F0] bg-[#F1F5F9] text-[#475569]'}`}>
    {children}
  </span>
);

const Panel: React.FC<{ title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }> = ({
  title, action, children, className = '',
}) => (
  <section className={`overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 ${className}`}>
    <div className="flex items-center justify-between gap-3 border-b border-[#E2E8F0] px-5 py-4">
      <h2 className="headline-sm text-[#0B1C30]">{title}</h2>
      {action}
    </div>
    {children}
  </section>
);

const ErrorBlock: React.FC<{ message: string; onRetry?: () => void; children?: React.ReactNode }> = ({
  message, onRetry, children,
}) => (
  <div role="alert" className="m-5 rounded-lg border border-[#FCA5A5] bg-[#FEE2E2] p-4 text-[#B91C1C]">
    <p className="body-medium">{message}</p>
    <div className="mt-3 flex flex-wrap gap-2">
      {children}
      {onRetry && <button className="btn-secondary" type="button" onClick={onRetry}>Coba Lagi</button>}
    </div>
  </div>
);

const Empty: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex min-h-36 flex-col items-center justify-center gap-3 px-5 py-8 text-center text-[#475569]">
    <FileText className="h-7 w-7 text-[#94A3B8] stroke-[1.5]" aria-hidden="true" />
    <p className="body-base">{children}</p>
  </div>
);

const Pagination: React.FC<{ total: number; page: number; size: number; onPage: (page: number) => void; onSize: (size: number) => void }> = ({
  total, page, size, onPage, onSize,
}) => {
  const pages = Math.max(1, Math.ceil(total / size));
  const start = total === 0 ? 0 : (page - 1) * size + 1;
  const end = Math.min(page * size, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0] px-5 py-3">
      <div className="flex items-center gap-2">
        <label className="label-sm text-[#475569]" htmlFor="page-size">Jumlah entri</label>
        <select id="page-size" className="input-field h-9 w-20" value={size} onChange={(e) => { onSize(Number(e.target.value)); onPage(1); }}>
          {[10, 25, 50, 100].map((n) => <option key={n}>{n}</option>)}
        </select>
        <span className="code-meta text-[#475569]">Menampilkan {start} sampai {end} dari {total} data</span>
      </div>
      <div className="flex items-center gap-1">
        <button type="button" className="btn-secondary h-9 px-2" onClick={() => onPage(1)} disabled={page === 1}>Pertama</button>
        <button type="button" className="btn-secondary h-9 px-2" onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1}>Sebelumnya</button>
        <span className="px-2 label-md text-[#0F2A66]">{page} / {pages}</span>
        <button type="button" className="btn-secondary h-9 px-2" onClick={() => onPage(Math.min(pages, page + 1))} disabled={page === pages}>Berikutnya</button>
        <button type="button" className="btn-secondary h-9 px-2" onClick={() => onPage(pages)} disabled={page === pages}>Terakhir</button>
      </div>
    </div>
  );
};

const Dialog: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(15,42,102,0.5)] p-4" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-[#E2E8F0] bg-white shadow-level-4" onClick={(event) => event.stopPropagation()}>
      <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-4">
        <h2 className="headline-sm">{title}</h2>
        <button type="button" onClick={onClose} className="rounded-lg p-2 text-[#475569] hover:bg-[#F1F5F9]" aria-label="Tutup dialog"><X className="h-5 w-5" /></button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

const ReviewActions: React.FC<{
  proposal: AdminProposal;
  onForward: () => void;
  onRequestChanges: (note: string) => void;
}> = ({ proposal, onForward, onRequestChanges }) => {
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState<'forward' | 'changes' | null>(null);
  return (
    <div className="space-y-4 p-5">
      <p className="body-base">Status tinjauan: {proposal.review}</p>
      <div>
        <label htmlFor="review-note" className="mb-1.5 block label-md">Catatan Perbaikan</label>
        <textarea id="review-note" className="textarea-field" rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Catatan wajib diisi untuk permintaan perbaikan." />
      </div>
      {error && <p className="body-base text-[#B91C1C]" role="alert">{error}</p>}
      <div className="flex flex-wrap justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={() => setConfirmation('changes')}>Minta Perbaikan</button>
        <button type="button" className="btn-primary" onClick={() => setConfirmation('forward')}>Teruskan ke Plotting</button>
      </div>
      {confirmation && (
        <Dialog title="Konfirmasi Tinjauan Pengajuan" onClose={() => setConfirmation(null)}>
          <p className="body-base">{confirmation === 'forward' ? 'Teruskan pengajuan' : 'Minta perbaikan untuk pengajuan'} {proposal.studentName}: {proposal.title}</p>
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={() => setConfirmation(null)}>Batal</button>
            <button type="button" className="btn-primary" onClick={() => {
              if (confirmation === 'changes' && (note.trim().length < 10 || note.trim().length > 500)) {
                setError('E-VAL-003 — Catatan wajib diisi dengan 10 sampai 500 karakter.');
                setConfirmation(null);
                return;
              }
              setConfirmation(null);
              if (confirmation === 'forward') onForward();
              else onRequestChanges(note.trim());
            }}>Ya, Simpan Keputusan</button>
          </div>
        </Dialog>
      )}
    </div>
  );
};

export const AdminPortal: React.FC<Props> = ({ onExit }) => {
  const { showToast } = usePortal();
  const [role, setRole] = useState<'KAPRODI' | 'DEKAN'>(() =>
    (localStorage.getItem('tuntas-proto-v2:role') as 'KAPRODI' | 'DEKAN') || 'KAPRODI',
  );
  const persona = localStorage.getItem('tuntas-proto-v2:persona') ?? 'andi';
  const isDualRole = persona === 'budi';
  const currentProgram = persona === 'budi' && role === 'KAPRODI' ? 'S1-ELEKTRO' : 'S1-INFORMATIKA';
  const defaultName = persona === 'budi' ? 'Prof. Budi Santoso, Ph.D.' : 'Dr. Andi Wijaya, S.Kom., M.Kom.';
  const [profileName, setProfileName] = useState(() => localStorage.getItem(`tuntas-proto-v2:${persona}:profile-name`) ?? defaultName);
  const [profileEmail, setProfileEmail] = useState(() => localStorage.getItem(`tuntas-proto-v2:${persona}:profile-email`) ?? (persona === 'budi' ? 'budi.santoso@istts.ac.id' : 'andi.wijaya@istts.ac.id'));
  const [route, setRoute] = useState(() => {
    const path = window.location.pathname;
    return path.startsWith('/dekan') || path.startsWith('/kaprodi') ? path : role === 'DEKAN' ? '/dekan' : '/kaprodi';
  });
  const [proposals, setProposals] = useState<AdminProposal[]>(() => {
    if (new URLSearchParams(window.location.search).get('reset') === '1') {
      localStorage.removeItem('tuntas-proto-v2:proposals');
      localStorage.removeItem('tuntas-proto-v2:revisions');
      return SEED_ADMIN_PROPOSALS;
    }
    return readSeed('tuntas-proto-v2:proposals', SEED_ADMIN_PROPOSALS);
  });
  const [revisions, setRevisions] = useState<AdminRevision[]>(() => {
    if (new URLSearchParams(window.location.search).get('reset') === '1') return SEED_ADMIN_REVISIONS;
    return readSeed('tuntas-proto-v2:revisions', SEED_ADMIN_REVISIONS);
  });
  const [lecturers, setLecturers] = useState<AdminLecturer[]>(() =>
    readSeed('tuntas-proto-v2:lecturers', ADMIN_LECTURERS),
  );
  const [period, setPeriod] = useState('202612');
  const [programFilter, setProgramFilter] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedProposal, setSelectedProposal] = useState<AdminProposal | null>(null);
  const [selectedRevision, setSelectedRevision] = useState<AdminRevision | null>(null);
  const [selectedLecturer, setSelectedLecturer] = useState('');
  const [selectedCoAdvisor, setSelectedCoAdvisor] = useState('');
  const [assignmentError, setAssignmentError] = useState('');
  const [modal, setModal] = useState<ModalState>(null);
  const [revisionCode, setRevisionCode] = useState('');
  const [revisionNote, setRevisionNote] = useState('');
  const [decision, setDecision] = useState<'Disetujui' | 'Ditolak'>('Disetujui');
  const [revisionError, setRevisionError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [mobileNav, setMobileNav] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [quotaPeriod, setQuotaPeriod] = useState(4);
  const [quotaSemester, setQuotaSemester] = useState(12);
  const [quotaSettings, setQuotaSettings] = useState<Record<number, { period: number; semester: number }>>(() =>
    readSeed('tuntas-proto-v2:quotas', {
      1: { period: 4, semester: 12 },
      2: { period: 4, semester: 12 },
      3: { period: 4, semester: 12 },
    }),
  );
  const [quotaConfirmed, setQuotaConfirmed] = useState(false);
  const [reviewerProposal, setReviewerProposal] = useState<AdminProposal | null>(null);
  const [reviewerSelection, setReviewerSelection] = useState<string[]>([]);
  const [reportTab, setReportTab] = useState(new URLSearchParams(window.location.search).get('tab') ?? 'bimbingan');
  const [reportFilter, setReportFilter] = useState('Tanpa Filter');

  useEffect(() => {
    localStorage.setItem('tuntas-proto-v2:proposals', JSON.stringify(proposals));
    localStorage.setItem('tuntas-proto-v2:revisions', JSON.stringify(revisions));
    localStorage.setItem('tuntas-proto-v2:lecturers', JSON.stringify(lecturers));
    localStorage.setItem('tuntas-proto-v2:quotas', JSON.stringify(quotaSettings));
  }, [proposals, revisions, lecturers, quotaSettings]);

  useEffect(() => {
    const onPopState = () => setRoute(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('simulate')?.startsWith('load:')) {
      const panel = params.get('simulate')!.slice(5);
      setLoadError(panel);
    }
    const reset = params.get('reset');
    if (reset === '1') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const activeMenu = role === 'KAPRODI' ? KAPRODI_MENU : DEKAN_MENU;
  const title = profileName;
  const identifier = persona === 'budi' ? 'budi.santoso' : 'andi.wijaya';
  const activeGroupId = PROGRAMS.find((item) => item.name === currentProgram)?.quotaGroup ?? 1;
  const activeQuota = quotaSettings[activeGroupId] ?? { period: 4, semester: 12 };
  useEffect(() => {
    setQuotaPeriod(activeQuota.period);
    setQuotaSemester(activeQuota.semester);
  }, [activeGroupId, activeQuota.period, activeQuota.semester]);
  const scopedProposals = useMemo(
    () => proposals.filter((item) => item.program === currentProgram),
    [proposals, currentProgram],
  );

  const go = (path: string) => {
    setRoute(path);
    setMobileNav(false);
    setLoadError('');
    window.history.pushState({}, '', path);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };
  const setRoleAndRoute = (nextRole: 'KAPRODI' | 'DEKAN') => {
    setRole(nextRole);
    localStorage.setItem('tuntas-proto-v2:role', nextRole);
    go(nextRole === 'DEKAN' ? '/dekan' : '/kaprodi');
  };
  const logout = () => {
    localStorage.removeItem('tuntas-proto-v2:persona');
    localStorage.removeItem('tuntas-proto-v2:role');
    onExit();
  };
  const getProposal = (id: string) => proposals.find((item) => item.id === id);
  const periodLabel = PERIODS.find((item) => item.code === period)?.label ?? period;
  const visibleProposals = proposals.filter((item) => item.period === period);
  const kaprodiRows = visibleProposals.filter((item) => item.program === currentProgram);
  const decanRevisions = revisions.filter((item) => {
    const proposal = getProposal(item.proposalId);
    return new Date(item.expiresAt).getTime() >= new Date(NOW).getTime()
      && item.version === item.currentVersion
      && item.code !== 'REV-2026-0301'
      && (role === 'DEKAN'
        ? item.approvals[2]?.status === 'Menunggu' && item.approvals[1]?.status === 'Disetujui' && Boolean(proposal)
        : item.approvals[1]?.status === 'Menunggu' && proposal?.program === currentProgram);
  });

  const updateProposal = (id: string, update: (proposal: AdminProposal) => AdminProposal) => {
    setProposals((current) => current.map((proposal) => proposal.id === id ? update(proposal) : proposal));
  };
  const setProposalReview = (id: string, next: AdminProposal['review'], note = '') => {
    updateProposal(id, (proposal) => ({
      ...proposal,
      review: next,
      history: [...proposal.history, { at: NOW, actor: title, action: next, note }],
    }));
    setSelectedProposal(null);
    showToast(next === 'Diteruskan ke plotting' ? 'Pengajuan diteruskan ke plotting reviewer.' : 'Catatan perbaikan disimpan.');
  };
  const assignmentSubmit = () => {
    if (!selectedProposal || !selectedLecturer) return;
    const lecturer = lecturers.find((item) => item.id === selectedLecturer);
    if (!lecturer) return;
    if (selectedProposal.type === 'Perpanjangan') {
      setAssignmentError('E-BIZ-018 — Pengajuan perpanjangan tidak dapat diubah judul atau dosen pembimbingnya.');
      return;
    }
    if (lecturer.status === 'Cuti') {
      setAssignmentError(`E-BIZ-002 — ${lecturer.name} sedang berstatus cuti dan tidak dapat ditetapkan sebagai pembimbing.`);
      return;
    }
    if (lecturer.periodLoad >= activeQuota.period) {
      setAssignmentError(`E-BIZ-001 — ${lecturer.name} telah mencapai kuota bimbingan periode ${periodLabel} (${lecturer.periodLoad} dari ${activeQuota.period}). Pilih dosen pembimbing lain atau ubah kuota pada menu Kuota Bimbingan.`);
      return;
    }
    if (lecturer.semesterLoad >= activeQuota.semester) {
      setAssignmentError(`E-BIZ-003 — ${lecturer.name} telah mencapai kuota bimbingan semester Gasal 2026/2027 (${lecturer.semesterLoad} dari ${activeQuota.semester}).`);
      return;
    }
    if (selectedCoAdvisor === selectedLecturer) {
      setAssignmentError('E-VAL-004 — Co-pembimbing tidak boleh sama dengan pembimbing.');
      return;
    }
    if (new URLSearchParams(window.location.search).get('simulate') === 'network') {
      setAssignmentError('E-NET-001 — Koneksi gagal. Penetapan belum tersimpan.');
      return;
    }
    if (lecturer.periodLoad === activeQuota.period - 1) {
      setSaveMessage(`W-BIZ-003 — Beban bimbingan ${lecturer.name} akan mencapai batas kuota setelah penetapan ini (${activeQuota.period} dari ${activeQuota.period}).`);
    }
    updateProposal(selectedProposal.id, (proposal) => ({
      ...proposal,
      advisorId: lecturer.id,
      coAdvisorId: selectedCoAdvisor || null,
      history: [...proposal.history, { at: NOW, actor: title, action: `Pembimbing ditetapkan: ${lecturer.name}` }],
    }));
    setLecturers((items) => items.map((item) => item.id === lecturer.id
      ? { ...item, periodLoad: item.periodLoad + 1, semesterLoad: item.semesterLoad + 1 }
      : item));
    setModal(null);
    setSelectedProposal(null);
    setSelectedLecturer('');
    setSelectedCoAdvisor('');
    setAssignmentError('');
    showToast('Pembimbing berhasil ditetapkan.');
  };

  const openRevision = (code: string) => {
    setRevisionError('');
    setSaveMessage('');
    const revision = revisions.find((item) => item.code === code);
    if (!revision) {
      setRevisionError(`E-REV-001 — Kode ${code || 'kosong'} tidak dikenali.`);
      return;
    }
    const proposal = getProposal(revision.proposalId);
    if (!proposal) {
      setRevisionError(`E-NF-404 — Data revisi ${code} tidak ditemukan atau telah dihapus.`);
      return;
    }
    if (role === 'KAPRODI' && currentProgram !== proposal.program) {
      setRevisionError(`E-REV-004 — Revisi ini milik ${proposal.program}. Peran aktif Anda (Kaprodi ${currentProgram}) bukan approver revisi ini.`);
      return;
    }
    const stageIndex = role === 'KAPRODI' ? 1 : 2;
    if (new Date(revision.expiresAt).getTime() < new Date(NOW).getTime()) {
      setRevisionError(`E-REV-002 — Kode ${code} telah kedaluwarsa pada ${formatDateId(revision.expiresAt)}. Mintalah kode baru kepada mahasiswa atau pembimbing.`);
      return;
    }
    if (revision.approvals[stageIndex]?.status !== 'Menunggu') {
      const approval = revision.approvals[stageIndex];
      setRevisionError(`E-REV-003 — Tahap ${role} untuk revisi ini telah ${approval.status.toLowerCase()} oleh ${approval.by ?? 'approver sebelumnya'}${approval.at ? ` pada ${formatDateId(approval.at)}` : ''}.`);
      return;
    }
    if (revision.approvals[stageIndex - 1]?.status !== 'Disetujui') {
      setRevisionError(`E-REV-006 — Persetujuan tahap ${role === 'DEKAN' ? 'Kaprodi' : 'Pembimbing'} belum selesai. Tahap ${role} dapat diproses setelahnya.`);
      return;
    }
    if (revision.version !== revision.currentVersion) {
      setRevisionError(`E-REV-005 — Versi dokumen yang Anda lihat (${revision.version}) sudah tidak terbaru. Versi terbaru adalah ${revision.currentVersion}.`);
      return;
    }
    setSelectedRevision(revision);
    setRevisionCode(code);
    go(`/${role.toLowerCase()}/approve/${code}`);
  };

  const performDecision = () => {
    if (!selectedRevision) return;
    const existing = revisions.find((item) => item.code === selectedRevision.code);
    const stageIndex = role === 'KAPRODI' ? 1 : 2;
    const stage = existing?.approvals[stageIndex];
    const priorStage = existing?.approvals[stageIndex - 1];
    if (!existing || !stage) {
      setRevisionError(`E-REV-001 — Kode ${selectedRevision.code} tidak dikenali.`);
      setModal(null);
      return;
    }
    if (new Date(existing.expiresAt).getTime() < new Date(NOW).getTime()) {
      setRevisionError(`E-REV-002 — Kode ${existing.code} telah kedaluwarsa pada ${formatDateId(existing.expiresAt)}. Mintalah kode baru kepada mahasiswa atau pembimbing.`);
      setModal(null);
      return;
    }
    if (stage.status !== 'Menunggu') {
      setRevisionError(`E-REV-003 — Tahap ${role} untuk revisi ini telah ${stage.status.toLowerCase()} oleh ${stage.by ?? 'approver sebelumnya'}${stage.at ? ` pada ${formatDateId(stage.at)}` : ''}.`);
      setModal(null);
      return;
    }
    if (priorStage?.status !== 'Disetujui') {
      setRevisionError(`E-REV-006 — Persetujuan tahap ${role === 'DEKAN' ? 'Kaprodi' : 'Pembimbing'} belum selesai. Tahap ${role} dapat diproses setelahnya.`);
      setModal(null);
      return;
    }
    if (existing.version !== existing.currentVersion) {
      setRevisionError(`E-REV-005 — Versi dokumen yang Anda lihat (${existing.version}) sudah tidak terbaru. Versi terbaru adalah ${existing.currentVersion}.`);
      setModal(null);
      return;
    }
    if (decision === 'Ditolak' && (revisionNote.trim().length < 10 || revisionNote.trim().length > 500)) {
      setRevisionError('E-VAL-003 — Catatan wajib diisi dengan 10 sampai 500 karakter.');
      setModal(null);
      return;
    }
    const simulation = new URLSearchParams(window.location.search).get('simulate');
    if (existing.simulateServerFailure && !existing.approvals[stageIndex].note) {
      setRevisions((items) => items.map((item) => item.code === existing.code
        ? { ...item, simulateServerFailure: false }
        : item));
      setRevisionError('E-SRV-001 — Terjadi gangguan pada server. Perubahan belum tersimpan. Coba lagi beberapa saat.');
      setModal(null);
      return;
    }
    if (simulation === 'server' || simulation === 'network') {
      setRevisionError(simulation === 'network'
        ? 'E-NET-001 — Koneksi gagal. Perubahan belum tersimpan.'
        : 'E-SRV-001 — Terjadi gangguan pada server. Perubahan belum tersimpan. Coba lagi beberapa saat.');
      setModal(null);
      return;
    }
    const savedAt = NOW;
    const nextApproval: RevisionApproval = {
      ...stage,
      status: decision,
      by: title,
      at: savedAt,
      note: revisionNote.trim() || undefined,
    };
    setRevisions((items) => items.map((item) => item.code === existing.code
      ? {
          ...item,
          status: decision === 'Disetujui' && stageIndex === 2 ? 'Disetujui' : decision === 'Ditolak' ? 'Ditolak' : item.status,
          approvals: item.approvals.map((approval, index) => index === stageIndex ? nextApproval : approval),
        }
      : item));
    setModal(null);
    setRevisionError('');
    if (simulation === 'timeout-after-commit' && existing.code === 'REV-2026-0108') {
      setRevisionError('E-NET-002 — Server tidak merespons dalam batas waktu. Perubahan mungkin belum tersimpan.');
      setSaveMessage(`Keputusan tersimpan pada ${formatDateId(savedAt)}.`);
      return;
    }
    setSaveMessage(`Keputusan ${decision.toLowerCase()} tersimpan pada ${formatDateId(savedAt)}.`);
    showToast(`Revisi ${decision.toLowerCase()} disimpan.`);
  };

  const retryRevision = () => {
    const latest = revisions.find((item) => item.code === selectedRevision?.code);
    const index = role === 'KAPRODI' ? 1 : 2;
    if (latest?.approvals[index].status === decision) {
      setRevisionError('');
      setSaveMessage(`Keputusan Anda telah tersimpan pada ${formatDateId(latest.approvals[index].at ?? NOW)}.`);
      return;
    }
    setRevisionError('');
    setModal('confirm-approval');
  };

  const currentTitle = activeMenu.find((item) => item[1] === route)?.[0]
    ?? (route.includes('/approve/') ? 'Detail Persetujuan Revisi' : role === 'DEKAN' ? 'Ringkasan Fakultas' : 'Ringkasan Program Studi');
  const isDashboard = route === '/dekan' || route === '/kaprodi';
  const menu = activeMenu;
  const showApprovalDetail = route.includes('/approve/');

  const renderPeriodPicker = (includeProgram = false) => (
    <div className="flex flex-wrap items-end gap-3">
      {includeProgram && (
        <div>
          <label htmlFor="program-filter" className="mb-1.5 block label-md text-[#0B1C30]">Program Studi</label>
          <select id="program-filter" className="input-field min-w-56" value={programFilter} onChange={(event) => setProgramFilter(event.target.value)}>
            <option value="">Pilih Program Studi</option>
            {PROGRAMS.map((program) => <option key={program.code}>{program.name}</option>)}
          </select>
        </div>
      )}
      <div>
        <label htmlFor="period-filter" className="mb-1.5 block label-md text-[#0B1C30]">Periode</label>
        <select id="period-filter" className="input-field min-w-48" value={period} onChange={(event) => setPeriod(event.target.value)}>
          {PERIODS.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
        </select>
      </div>
      <button type="button" className="btn-secondary" onClick={() => { setPage(1); setLoadError(''); }}>Tampilkan</button>
    </div>
  );

  const renderDashboard = () => {
    const source = role === 'DEKAN' ? visibleProposals : kaprodiRows;
    const submitted = source.filter((item) => item.status === 'Diajukan');
    const reviewing = source.filter((item) => item.status === 'Dalam Review');
    const unassigned = source.filter((item) => item.period === '202612' && !item.advisorId);
    const unseen = source.filter((item) => item.status === 'Diajukan' && item.review === 'Belum ditinjau');
    const waiting = decanRevisions.length;
    const scheduled = role === 'DEKAN' ? 5 : 16;
    const loadKey = role === 'DEKAN' ? 'progres' : 'beban';
    const cardData = role === 'DEKAN'
      ? [
          ['Proposal periode ini', source.length],
          ['Diajukan', submitted.length],
          ['Dalam Review', reviewing.length],
          ['Menunggu persetujuan Anda', waiting],
        ]
      : [
          ['Mahasiswa tugas akhir', source.length],
          ['Pengajuan judul baru', unseen.length],
          ['Belum ada pembimbing', unassigned.length],
          ['Sidang terjadwal', scheduled],
        ];
    const progressRows = role === 'DEKAN' ? PROGRAMS : PROGRAMS.filter((item) => item.name === currentProgram);
    const expiredEmpty = period === '202702';
    return (
      <div className="space-y-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <h1 className="headline-lg">{role === 'DEKAN' ? 'Ringkasan Fakultas' : 'Ringkasan Program Studi'}</h1>
          {renderPeriodPicker()}
        </div>
        {period === '202612' && role === 'KAPRODI' && (
          <div className="rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-[#92400E]">
            <p className="body-medium">Batas akhir upload proposal DESEMBER 2026: 7 jam.</p>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cardData.map(([label, count]) => (
            <section key={label} className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-level-1">
              <p className="label-md text-[#475569]">{label}</p>
              <p className="mt-2 font-['Manrope'] text-3xl font-bold text-[#0F2A66]">{expiredEmpty ? 0 : count}</p>
              {role === 'KAPRODI' && label === 'Sidang terjadwal' && <p className="code-meta mt-1 text-[#475569]">12 sidang proposal pada 2 Des 2026</p>}
            </section>
          ))}
        </div>
        {expiredEmpty ? <Empty>Tidak ada proposal pada periode FEBRUARI 2027.</Empty> : (
          role === 'DEKAN' ? (
            <div className="grid gap-6 xl:grid-cols-12">
              <Panel title="Progres per Jurusan" className="xl:col-span-8">
                {loadError === loadKey ? <ErrorBlock message="E-NET-003 — Data progres gagal dimuat." onRetry={() => setLoadError('')} /> : (
                  <div className="divide-y divide-[#E2E8F0]">
                    {progressRows.map((program) => {
                      const rows = source.filter((item) => item.program === program.name);
                      const groups: [ProposalStatus, number][] = [
                        ['Diajukan', rows.filter((item) => item.status === 'Diajukan').length],
                        ['Dalam Review', rows.filter((item) => item.status === 'Dalam Review').length],
                        ['Diterima', rows.filter((item) => item.status === 'Diterima').length],
                        ['Diperbaiki', rows.filter((item) => item.status === 'Diperbaiki' || item.status === 'Perbaikan Bersyarat').length],
                        ['Ditolak', rows.filter((item) => item.status === 'Ditolak').length],
                      ];
                      return (
                        <div key={program.code} className="px-5 py-4">
                          <div className="mb-2 flex justify-between gap-3"><span className="body-medium">{program.name}</span><span className="code-meta">{rows.length} / {rows.length}</span></div>
                          <div className="flex h-3 overflow-hidden rounded-full bg-[#F1F5F9]" aria-label={`Progres ${program.name}`}>
                            {groups.map(([status, count]) => <span key={status} title={`${status}: ${count}`} style={{ width: `${rows.length ? count / rows.length * 100 : 0}%` }} className={status === 'Diajukan' || status === 'Dalam Review' ? 'bg-[#1D4ED8]' : status === 'Diterima' ? 'bg-[#15803D]' : status === 'Ditolak' ? 'bg-[#B91C1C]' : 'bg-[#D97706]'} />)}
                          </div>
                          <p className="code-meta mt-2 text-[#475569]">{groups.map(([status, count]) => `${status} ${count}`).join(' · ')}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Panel>
              <Panel title="Persetujuan Revisi Menunggu" className="xl:col-span-4" action={<button className="body-semibold text-[#0284C7]" onClick={() => go('/dekan/approve')}>Buka antrean</button>}>
                {loadError === 'persetujuan' ? <ErrorBlock message="E-NET-003 — Data persetujuan gagal dimuat." onRetry={() => setLoadError('')} /> : decanRevisions.slice(0, 5).length === 0 ? <Empty>Tidak ada permintaan persetujuan revisi yang menunggu.</Empty> : (
                  <div className="divide-y divide-[#E2E8F0]">
                    {decanRevisions.slice(0, 5).map((revision) => {
                      const proposal = getProposal(revision.proposalId);
                      return proposal && <button key={revision.code} className="w-full px-5 py-4 text-left hover:bg-[#F8FAFC]" onClick={() => openRevision(revision.code)}>
                        <p className="body-semibold">{proposal.studentName} <span className="code-meta font-normal">({proposal.nrp})</span></p>
                        <p className="code-meta mt-1 text-[#475569]">{proposal.program} · {proposal.title.slice(0, 56)}</p>
                        <p className="code-meta mt-1 text-[#475569]">Batas {formatDateId(revision.expiresAt)}</p>
                      </button>;
                    })}
                  </div>
                )}
              </Panel>
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-2">
              <Panel title="Penugasan Pembimbing" action={<Pill>{unassigned.length} mahasiswa</Pill>}>
                {loadError === loadKey ? <ErrorBlock message="E-NET-003 — Data beban bimbingan gagal dimuat." onRetry={() => setLoadError('')} /> : unassigned.length === 0 ? <Empty>Semua mahasiswa sudah memiliki dosen pembimbing.</Empty> : (
                  <div className="divide-y divide-[#E2E8F0]">
                    {unassigned.slice(0, 3).map((proposal) => <div key={proposal.id} className="flex items-center justify-between gap-4 px-5 py-4">
                      <div><p className="body-semibold">{proposal.studentName} <span className="code-meta font-normal">({proposal.nrp})</span></p><p className="code-meta mt-1 text-[#475569]">{proposal.field} · {formatDateId(proposal.submittedAt)}</p></div>
                      <button type="button" className="btn-secondary shrink-0" onClick={() => { setSelectedProposal(proposal); setSelectedLecturer(''); setSelectedCoAdvisor(''); setAssignmentError(''); setModal('assign'); }}>Pilih Dosen</button>
                    </div>)}
                    <div className="px-5 py-3"><button className="body-semibold text-[#0284C7]" onClick={() => go('/kaprodi/penugasan')}>Lihat semua penugasan</button></div>
                  </div>
                )}
              </Panel>
              <Panel title="Beban Bimbingan Dosen" action={<button className="body-semibold text-[#0284C7]" onClick={() => go('/kaprodi/kuota')}>Lihat seluruh dosen</button>}>
                {loadError === loadKey ? <ErrorBlock message="E-NET-003 — Data beban bimbingan gagal dimuat." onRetry={() => setLoadError('')} /> : (
                  <div className="divide-y divide-[#E2E8F0]">
                    {lecturers.filter((item) => item.program === currentProgram).sort((a, b) => b.periodLoad - a.periodLoad).slice(0, 5).map((lecturer) => (
                      <div key={lecturer.id} className="px-5 py-3">
                        <div className="flex justify-between gap-3"><span className="body-medium">{lecturer.name}</span><span className="code-meta">{lecturer.periodLoad} / {activeQuota.period} · {lecturer.semesterLoad} / {activeQuota.semester}</span></div>
                        <div className="mt-2 h-2 rounded-full bg-[#F1F5F9]"><div className={`h-2 rounded-full ${lecturer.periodLoad >= activeQuota.period ? 'bg-[#B91C1C]' : lecturer.periodLoad / activeQuota.period >= 0.75 ? 'bg-[#D97706]' : 'bg-[#0F2A66]'}`} style={{ width: `${Math.min(100, lecturer.periodLoad / activeQuota.period * 100)}%` }} /></div>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
              <Panel title="Pengajuan Judul Terbaru" action={<button className="body-semibold text-[#0284C7]" onClick={() => go('/kaprodi/pengajuan')}>Lihat {unseen.length} pengajuan</button>}>
                <div className="divide-y divide-[#E2E8F0]">
                  {unseen.slice(0, 2).map((proposal) => <div key={proposal.id} className="flex items-start justify-between gap-3 px-5 py-4"><div><p className="body-semibold">{proposal.studentName} · {formatDateId(proposal.submittedAt)}</p><p className="body-base mt-1">{proposal.title}</p></div><button className="body-semibold text-[#0284C7]" onClick={() => { setSelectedProposal(proposal); go('/kaprodi/pengajuan'); }}>Tinjau</button></div>)}
                  {unseen.length === 0 && <Empty>Tidak ada pengajuan judul baru yang menunggu tinjauan.</Empty>}
                </div>
              </Panel>
              <Panel title="Agenda Sidang Prodi" action={<button className="body-semibold text-[#0284C7]" onClick={() => go('/kaprodi/jadwal')}>Atur jadwal sidang</button>}>
                <div className="divide-y divide-[#E2E8F0]">
                  {source.filter((item) => item.status === 'Dalam Review').slice(0, 2).map((proposal, index) => <div key={proposal.id} className="px-5 py-4"><p className="body-semibold">{index === 0 ? '2 Des 2026, 08.00' : '2 Des 2026, 09.30'} · {proposal.studentName}</p><p className="code-meta mt-1 text-[#475569]">Sidang Proposal · Ruang A.20{index + 1}</p></div>)}
                </div>
              </Panel>
            </div>
          )
        )}
      </div>
    );
  };

  const proposalForRoute = route.startsWith('/kaprodi/pengajuan/')
    ? getProposal(route.split('/').pop() ?? '')
    : undefined;

  const renderProposalList = (forDean: boolean) => {
    const filtered = proposals.filter((proposal) => {
      const inProgram = forDean ? !programFilter || proposal.program === programFilter : proposal.program === currentProgram;
      const matchesQuery = !query || [proposal.studentName, proposal.nrp, proposal.title].some((value) => value.toLowerCase().includes(query.toLowerCase()));
      return inProgram && proposal.period === period && matchesQuery;
    });
    const rows = filtered.slice((page - 1) * pageSize, page * pageSize);
    if (forDean && !programFilter) {
      return (
        <div className="space-y-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <h1 className="headline-lg">Daftar Proposal TA/Tesis</h1>
            {renderPeriodPicker(true)}
          </div>
          <Panel title="Daftar Proposal">
            <Empty>Pilih program studi dan periode untuk menampilkan daftar proposal.</Empty>
          </Panel>
        </div>
      );
    }
    return (
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <h1 className="headline-lg">{forDean ? 'Daftar Proposal TA/Tesis' : 'Pengajuan Judul'}</h1>
          {renderPeriodPicker(forDean)}
        </div>
        {!forDean && (
          <div className="max-w-md">
            <label htmlFor="proposal-search" className="mb-1.5 block label-md">Pencarian</label>
            <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-[#94A3B8]" /><input id="proposal-search" className="input-field pl-9" placeholder="Nama, NRP, atau judul" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></div>
          </div>
        )}
        <Panel title={forDean ? `${programFilter} · ${periodLabel}` : `${currentProgram} · ${periodLabel}`}>
          {loadError === (forDean ? 'daftar-proposal' : 'pengajuan') ? (
            <ErrorBlock message="E-NET-003 — Data daftar proposal gagal dimuat." onRetry={() => setLoadError('')} />
          ) : filtered.length === 0 ? <Empty>Tidak ada proposal yang sesuai dengan periode dan filter yang dipilih.</Empty> : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead><tr className="bg-[#F1F5F9]">
                    {(forDean ? ['NRP', 'Nama', 'IPK', 'Judul', 'Pembimbing', 'Co-Pembimbing', 'Periode', 'Perpanjangan', 'Unduh'] : ['Mahasiswa', 'Judul', 'Jenis', 'Bidang', 'Tanggal', 'Status Proposal', 'Tinjauan', 'Aksi']).map((header) => <th key={header} className={`px-4 py-3 label-md uppercase text-[#475569] ${header === 'NRP' || header === 'IPK' ? 'text-right' : ''}`}>{header}</th>)}
                  </tr></thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {rows.map((proposal, index) => (
                      <tr key={proposal.id} className={index % 2 ? 'bg-[#F8FAFC]' : 'bg-white'}>
                        {forDean ? (
                          <>
                            <td className="whitespace-nowrap px-4 py-3 text-right code-meta">{proposal.nrp}</td>
                            <td className="px-4 py-3 body-base">{proposal.studentName}</td>
                            <td className="px-4 py-3 text-right code-meta">{proposal.ipk.toFixed(2)}</td>
                            <td className="min-w-72 px-4 py-3 body-base">{proposal.title}</td>
                            <td className="px-4 py-3 body-base">{getLecturer(proposal.advisorId)?.name ?? '—'}</td>
                            <td className="px-4 py-3 body-base">{getLecturer(proposal.coAdvisorId)?.name ?? '—'}</td>
                            <td className="whitespace-nowrap px-4 py-3 code-meta">{PERIODS.find((item) => item.code === proposal.period)?.label}</td>
                            <td className="px-4 py-3 body-base">{proposal.type === 'Perpanjangan' ? 'Ya' : 'Tidak'}</td>
                            <td className="px-4 py-3 text-right"><button type="button" className="body-semibold text-[#0284C7]" onClick={() => {
                              if (proposal.damaged) {
                                setRevisionError(`E-DL-002 — Berkas proposal ${proposal.nrp} tidak dapat dibuka karena rusak.`);
                                return;
                              }
                              writeDownload(`${proposal.nrp}_Proposal.pdf`, `Proposal Tugas Akhir\n${proposal.studentName}\n${proposal.nrp}\n${proposal.title}`);
                            }}>Unduh</button></td>
                          </>
                        ) : (
                          <>
                            <td className="whitespace-nowrap px-4 py-3"><p className="body-semibold">{proposal.studentName}</p><p className="code-meta text-[#475569]">{proposal.nrp}</p></td>
                            <td className="min-w-64 px-4 py-3 body-base">{proposal.title}</td>
                            <td className="px-4 py-3 body-base">{proposal.type}</td>
                            <td className="px-4 py-3 body-base">{proposal.field}</td>
                            <td className="whitespace-nowrap px-4 py-3 code-meta">{formatDateId(proposal.submittedAt)}</td>
                            <td className="px-4 py-3"><Pill>{proposal.status}</Pill></td>
                            <td className="px-4 py-3 body-base">{proposal.review}</td>
                            <td className="px-4 py-3 text-right"><button type="button" className="body-semibold text-[#0284C7]" onClick={() => { setSelectedProposal(proposal); go(`/kaprodi/pengajuan/${proposal.id}`); }}>Tinjau</button></td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination total={filtered.length} page={page} size={pageSize} onPage={setPage} onSize={setPageSize} />
            </>
          )}
        </Panel>
        {revisionError.startsWith('E-DL-002') && <ErrorBlock message={revisionError} onRetry={() => setRevisionError('')} />}
      </div>
    );
  };

  const renderProposalDetail = () => {
    if (!proposalForRoute) return <ErrorBlock message="E-NF-404 — Pengajuan yang diminta tidak ditemukan atau telah dihapus." onRetry={() => go('/kaprodi/pengajuan')} />;
    const proposal = proposalForRoute;
    return (
      <div className="space-y-6">
        <button type="button" className="inline-flex items-center gap-2 body-semibold text-[#0284C7]" onClick={() => go('/kaprodi/pengajuan')}><ArrowLeft className="h-4 w-4" />Kembali ke Pengajuan Judul</button>
        <h1 className="headline-lg">Detail Pengajuan Judul</h1>
        {proposal.type === 'Perpanjangan' && <div className="rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3 text-[#1E40AF]">Judul dan dosen pembimbing tidak dapat diubah setelah pengajuan dikirim.</div>}
        <Panel title="Data Pengajuan">
          <dl className="grid gap-x-8 gap-y-4 p-5 sm:grid-cols-2">
            <div><dt className="label-md text-[#475569]">Mahasiswa</dt><dd className="body-medium">{proposal.studentName} · {proposal.nrp}</dd></div>
            <div><dt className="label-md text-[#475569]">IPK dan Program Studi</dt><dd className="body-medium">{proposal.ipk.toFixed(2)} · {proposal.program}</dd></div>
            <div className="sm:col-span-2"><dt className="label-md text-[#475569]">Judul</dt><dd className="body-medium">{proposal.title}</dd></div>
            <div><dt className="label-md text-[#475569]">Jenis dan Bobot</dt><dd className="body-medium">{proposal.type} · {proposal.sks} SKS</dd></div>
            <div><dt className="label-md text-[#475569]">Bidang dan Tag</dt><dd className="body-medium">{proposal.field} · {proposal.tags.join(', ')}</dd></div>
            <div><dt className="label-md text-[#475569]">Pembimbing</dt><dd className="body-medium">{getLecturer(proposal.advisorId)?.name ?? 'Belum ditetapkan'}</dd></div>
            <div><dt className="label-md text-[#475569]">Co-Pembimbing</dt><dd className="body-medium">{getLecturer(proposal.coAdvisorId)?.name ?? 'Belum ditetapkan'}</dd></div>
            <div><dt className="label-md text-[#475569]">Status Proposal</dt><dd className="mt-1"><Pill>{proposal.status}</Pill></dd></div>
            <div><dt className="label-md text-[#475569]">Tinjauan Kaprodi</dt><dd className="body-medium">{proposal.review}</dd></div>
          </dl>
          <div className="border-t border-[#E2E8F0] px-5 py-4">
            <p className="label-md text-[#475569]">Berkas Proposal</p>
            <p className="mt-1 body-base">{proposal.nrp}_Proposal.pdf · 2,8 MB · {formatDateId(proposal.submittedAt)}</p>
          </div>
          <div className="border-t border-[#E2E8F0] px-5 py-4">
            <h3 className="headline-sm">Riwayat</h3>
            {proposal.history.length === 0 ? <p className="body-base mt-2 text-[#475569]">Belum ada perubahan pada pengajuan ini.</p> : proposal.history.map((item, index) => <p key={`${item.at}-${index}`} className="mt-2 body-base">{formatDateId(item.at)} · {item.actor} · {item.action}{item.note ? ` — ${item.note}` : ''}</p>)}
          </div>
        </Panel>
        {proposal.status === 'Diajukan' && (
          <Panel title="Tinjauan Kaprodi">
            <ReviewActions proposal={proposal} onForward={() => {
              if (proposal.id === 'PR-IF-0201' && !proposal.history.some((item) => item.action.includes('Muat ulang'))) {
                setRevisionError('E-STALE-001 — Data ini telah diperbarui oleh pihak lain pada 25 Nov 2026, 09.45 WIB. Muat ulang untuk melihat versi terbaru. Keputusan Anda belum tersimpan.');
              } else {
                setProposalReview(proposal.id, 'Diteruskan ke plotting');
              }
            }} onRequestChanges={(note) => setProposalReview(proposal.id, 'Perlu perbaikan', note)} />
            {revisionError.startsWith('E-STALE') && <div className="m-5"><ErrorBlock message={revisionError} onRetry={() => { setRevisionError(''); updateProposal(proposal.id, (item) => ({ ...item, history: [...item.history, { at: NOW, actor: title, action: 'Muat ulang detail' }] })); }}> <button className="btn-secondary" onClick={() => { setRevisionError(''); updateProposal(proposal.id, (item) => ({ ...item, history: [...item.history, { at: NOW, actor: title, action: 'Muat ulang detail' }] })); }}>Muat Ulang Detail</button></ErrorBlock></div>}
          </Panel>
        )}
      </div>
    );
  };

  const renderAssignments = () => {
    const unassigned = scopedProposals.filter((item) => item.period === period && !item.advisorId);
    const visible = unassigned.slice((page - 1) * pageSize, page * pageSize);
    return (
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><h1 className="headline-lg">Penugasan Pembimbing</h1>{renderPeriodPicker()}</div>
        <Panel title="Mahasiswa Belum Memiliki Pembimbing" action={<Pill>{unassigned.length} mahasiswa</Pill>}>
          {loadError === 'penugasan' ? <ErrorBlock message="E-NET-003 — Data penugasan gagal dimuat." onRetry={() => setLoadError('')} /> : unassigned.length === 0 ? <Empty>Semua mahasiswa sudah memiliki dosen pembimbing.</Empty> : (
            <>
              <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-[#F1F5F9]">{['Mahasiswa', 'Judul', 'Bidang', 'Tanggal Pengajuan', 'Aksi'].map((cell) => <th key={cell} className="px-5 py-3 label-md uppercase text-[#475569]">{cell}</th>)}</tr></thead><tbody className="divide-y divide-[#E2E8F0]">{visible.map((proposal) => <tr key={proposal.id}><td className="px-5 py-4 body-medium">{proposal.studentName}<div className="code-meta text-[#475569]">{proposal.nrp}</div></td><td className="min-w-64 px-5 py-4 body-base">{proposal.title}</td><td className="px-5 py-4 body-base">{proposal.field}</td><td className="px-5 py-4 code-meta">{formatDateId(proposal.submittedAt)}</td><td className="px-5 py-4 text-right"><button className="btn-secondary" onClick={() => { setSelectedProposal(proposal); setSelectedLecturer(''); setSelectedCoAdvisor(''); setAssignmentError(''); setModal('assign'); }}>Pilih Dosen</button></td></tr>)}</tbody></table></div>
              <Pagination total={unassigned.length} page={page} size={pageSize} onPage={setPage} onSize={setPageSize} />
            </>
          )}
        </Panel>
      </div>
    );
  };

  const renderApprovalQueue = () => (
    <div className="space-y-6">
      <h1 className="headline-lg">Approve Revisi (QR)</h1>
      <Panel title="Periksa Kode Revisi">
        <form className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end" onSubmit={(event) => { event.preventDefault(); openRevision(revisionCode.trim()); }}>
          <div className="flex-1"><label htmlFor="revision-code" className="mb-1.5 block label-md">Kode Revisi</label><input id="revision-code" className="input-field" placeholder="Masukkan kode revisi" value={revisionCode} onChange={(event) => setRevisionCode(event.target.value)} /></div>
          <button type="submit" className="btn-primary">Periksa Kode</button>
        </form>
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-5">
          <p className="body-base text-[#475569]">Pindai kode QR atau masukkan kode secara manual.</p>
          <button type="button" className="btn-secondary" onClick={async () => {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
              stream.getTracks().forEach((track) => track.stop());
              setCameraError('Pemindai kamera belum tersedia. Masukkan kode secara manual.');
            } catch {
              setCameraError('E-CAM-001 — Kamera tidak dapat diakses. Izinkan akses kamera pada peramban atau masukkan kode secara manual.');
            }
          }}>Aktifkan Pemindai Kamera</button>
        </div>
        {cameraError && <p role="alert" className="px-5 pb-4 body-base text-[#B91C1C]">{cameraError}</p>}
      </Panel>
      {revisionError && !showApprovalDetail && <ErrorBlock message={revisionError} onRetry={() => setRevisionError('')} />}
      <Panel title="Antrean Persetujuan">
        {loadError === 'persetujuan' ? <ErrorBlock message="E-NET-003 — Data antrean persetujuan gagal dimuat." onRetry={() => setLoadError('')} /> : decanRevisions.length === 0 ? <Empty>Tidak ada permintaan persetujuan revisi yang menunggu.</Empty> : (
          <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-[#F1F5F9]">{['Mahasiswa', 'Jurusan', 'Judul', 'Versi', 'Batas Kedaluwarsa', 'Aksi'].map((item) => <th key={item} className="px-5 py-3 label-md uppercase text-[#475569]">{item}</th>)}</tr></thead><tbody className="divide-y divide-[#E2E8F0]">{decanRevisions.map((revision) => { const proposal = getProposal(revision.proposalId); return proposal && <tr key={revision.code}><td className="px-5 py-4 body-medium">{proposal.studentName}<div className="code-meta text-[#475569]">{proposal.nrp}</div></td><td className="px-5 py-4 body-base">{proposal.program}</td><td className="min-w-64 px-5 py-4 body-base">{proposal.title}</td><td className="px-5 py-4 body-base">v{revision.version}</td><td className="px-5 py-4 code-meta">{formatDateId(revision.expiresAt)}</td><td className="px-5 py-4 text-right"><button type="button" className="btn-secondary" onClick={() => openRevision(revision.code)}>Buka</button></td></tr>; })}</tbody></table></div>
        )}
      </Panel>
    </div>
  );

  const renderApprovalDetail = () => {
    const code = route.split('/').pop() ?? '';
    const revision = revisions.find((item) => item.code === code) ?? selectedRevision;
    const proposal = revision ? getProposal(revision.proposalId) : undefined;
    if (!revision || !proposal) return <ErrorBlock message={`E-REV-001 — Kode ${code} tidak dikenali.`} onRetry={() => go(`/${role.toLowerCase()}/approve`)} />;
    if (role === 'KAPRODI' && proposal.program !== currentProgram) {
      return <ErrorBlock message={`E-REV-004 — Revisi ini milik ${proposal.program}. Peran aktif Anda (Kaprodi ${currentProgram}) bukan approver revisi ini.`} onRetry={() => go('/kaprodi/approve')} />;
    }
    if (!saveMessage) {
      const stageIndex = role === 'KAPRODI' ? 1 : 2;
      if (new Date(revision.expiresAt).getTime() < new Date(NOW).getTime()) {
        return <ErrorBlock message={`E-REV-002 — Kode ${code} telah kedaluwarsa pada ${formatDateId(revision.expiresAt)}. Mintalah kode baru kepada mahasiswa atau pembimbing.`} onRetry={() => go(`/${role.toLowerCase()}/approve`)} />;
      }
      if (revision.approvals[stageIndex]?.status !== 'Menunggu') {
        const approval = revision.approvals[stageIndex];
        return <ErrorBlock message={`E-REV-003 — Tahap ${role} untuk revisi ini telah ${approval.status.toLowerCase()} oleh ${approval.by ?? 'approver sebelumnya'}${approval.at ? ` pada ${formatDateId(approval.at)}` : ''}.`} onRetry={() => go(`/${role.toLowerCase()}/approve`)} />;
      }
      if (revision.approvals[stageIndex - 1]?.status !== 'Disetujui') {
        return <ErrorBlock message={`E-REV-006 — Persetujuan tahap ${role === 'DEKAN' ? 'Kaprodi' : 'Pembimbing'} belum selesai. Tahap ${role} dapat diproses setelahnya.`} onRetry={() => go(`/${role.toLowerCase()}/approve`)} />;
      }
      if (revision.version !== revision.currentVersion) {
        return <ErrorBlock message={`E-REV-005 — Versi dokumen yang Anda lihat (${revision.version}) sudah tidak terbaru. Versi terbaru adalah ${revision.currentVersion}.`} onRetry={() => go(`/${role.toLowerCase()}/approve`)} />;
      }
    }
    const myStage = role === 'KAPRODI' ? revision.approvals[1] : revision.approvals[2];
    const enabled = myStage?.status === 'Menunggu' && new Date(revision.expiresAt).getTime() >= new Date(NOW).getTime();
    return (
      <div className="space-y-6">
        <button type="button" className="inline-flex items-center gap-2 body-semibold text-[#0284C7]" onClick={() => go(`/${role.toLowerCase()}/approve`)}><ArrowLeft className="h-4 w-4" />Kembali ke Antrean</button>
        <h1 className="headline-lg">Detail Persetujuan Revisi</h1>
        {revisionError && <ErrorBlock message={revisionError} onRetry={retryRevision} />}
        {saveMessage && <div role="status" className="rounded-lg border border-[#86EFAC] bg-[#DCFCE7] px-4 py-3 text-[#15803D]">{saveMessage}</div>}
        <Panel title="Data Revisi">
          <dl className="grid gap-4 p-5 sm:grid-cols-2">
            <div><dt className="label-md text-[#475569]">Mahasiswa</dt><dd className="body-medium">{proposal.studentName} · {proposal.nrp}</dd></div>
            <div><dt className="label-md text-[#475569]">Jurusan</dt><dd className="body-medium">{proposal.program}</dd></div>
            <div className="sm:col-span-2"><dt className="label-md text-[#475569]">Judul</dt><dd className="body-medium">{proposal.title}</dd></div>
            <div><dt className="label-md text-[#475569]">Versi dokumen</dt><dd className="body-medium">v{revision.version}</dd></div>
            <div><dt className="label-md text-[#475569]">Status revisi</dt><dd className="mt-1"><Pill>{revision.status}</Pill></dd></div>
            <div><dt className="label-md text-[#475569]">Kode dan kedaluwarsa</dt><dd className="body-medium">{revision.code} · {formatDateId(revision.expiresAt)}</dd></div>
            <div><dt className="label-md text-[#475569]">Berkas</dt><dd className="body-medium"><button className="text-[#0284C7]" onClick={() => writeDownload(`${proposal.nrp}_Revisi_v${revision.version}.pdf`, `Revisi proposal\n${proposal.studentName}\n${proposal.title}`)}>Unduh Dokumen</button></dd></div>
          </dl>
          <div className="border-t border-[#E2E8F0] px-5 py-4">
            <h2 className="headline-sm">Rantai Persetujuan</h2>
            <ol className="mt-4 grid gap-3 md:grid-cols-3">
              {revision.approvals.map((approval) => <li key={approval.role} className="border-l-2 border-[#E2E8F0] pl-3">
                <p className="label-md text-[#475569]">{approval.role === 'PEMBIMBING' ? 'Pembimbing' : approval.role === 'KAPRODI' ? 'Kaprodi' : 'Dekan'}</p>
                <div className="mt-1"><Pill>{approval.status === 'Disetujui' ? 'Disetujui' : approval.status === 'Ditolak' ? 'Ditolak' : 'Menunggu Persetujuan'}</Pill></div>
                {approval.by && <p className="code-meta mt-1 text-[#475569]">{approval.by} · {formatDateId(approval.at ?? NOW)}</p>}
                {approval.note && <p className="code-meta mt-1 text-[#475569]">{approval.note}</p>}
              </li>)}
            </ol>
          </div>
          {enabled && (
            <div className="border-t border-[#E2E8F0] px-5 py-4">
              <label htmlFor="revision-note" className="mb-1.5 block label-md">Catatan</label>
              <textarea id="revision-note" className="textarea-field" rows={3} maxLength={500} placeholder="Catatan opsional untuk keputusan." value={revisionNote} onChange={(event) => setRevisionNote(event.target.value)} />
              <div className="mt-4 flex flex-wrap justify-end gap-3">
                <button type="button" className="btn-secondary text-[#B91C1C]" onClick={() => { setDecision('Ditolak'); setModal('confirm-approval'); }}>Tolak Revisi</button>
                <button type="button" className="btn-primary" onClick={() => { setDecision('Disetujui'); setModal('confirm-approval'); }}>Setujui Revisi</button>
              </div>
            </div>
          )}
        </Panel>
      </div>
    );
  };

  const renderQuota = () => {
    const requestedGroup = new URLSearchParams(window.location.search).get('group');
    const activeGroup = PROGRAMS.find((item) => item.name === currentProgram)?.quotaGroup;
    if (requestedGroup && Number(requestedGroup) !== activeGroup) {
      return <div className="space-y-6"><h1 className="headline-lg">Kuota Bimbingan</h1><ErrorBlock message={`E-AUTH-403 — Anda tidak memiliki wewenang untuk mengakses Grup Kuota ${requestedGroup} dengan peran aktif Kaprodi ${currentProgram}.`} onRetry={() => go('/kaprodi')} /></div>;
    }
    const scopedLecturers = lecturers.filter((item) => item.program === currentProgram);
    const quotaStatus = (lecturer: AdminLecturer) => lecturer.status === 'Cuti'
      ? 'Cuti'
      : lecturer.periodLoad >= activeQuota.period || lecturer.semesterLoad >= activeQuota.semester
        ? 'Penuh'
        : lecturer.periodLoad / activeQuota.period >= 0.75 || lecturer.semesterLoad / activeQuota.semester >= 0.75
          ? 'Hampir Penuh'
          : 'Tersedia';
    const save = () => {
      if (!Number.isInteger(quotaPeriod) || quotaPeriod < 1 || quotaPeriod > 20 || !Number.isInteger(quotaSemester) || quotaSemester < 1 || quotaSemester > 60) {
        setRevisionError('E-VAL-001 — Maksimum kuota harus berupa bilangan bulat dalam rentang yang ditentukan.');
        return;
      }
      if (quotaSemester < quotaPeriod) {
        setRevisionError('E-BIZ-009 — Maksimum per semester tidak boleh lebih kecil dari maksimum per periode.');
        return;
      }
      const impacted = lecturers.filter((item) => {
        const group = PROGRAMS.find((program) => program.name === item.program)?.quotaGroup;
        return group === activeGroupId && (item.periodLoad > quotaPeriod || item.semesterLoad > quotaSemester);
      });
      if (impacted.length) {
        setRevisionError(`E-BIZ-008 — Kuota baru lebih kecil dari bimbingan aktif: ${impacted.map((item) => `${item.name} ${item.periodLoad}/${item.semesterLoad}`).join(', ')}.`);
        return;
      }
      setRevisionError('');
      setQuotaConfirmed(true);
    };
    return (
      <div className="space-y-6">
        <h1 className="headline-lg">Kuota Bimbingan</h1>
        <Panel title="Pengaturan Kuota">
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <div><label className="mb-1.5 block label-md">Group ID</label><input className="input-field" value={PROGRAMS.find((item) => item.name === currentProgram)?.quotaGroup ?? 1} readOnly /></div>
            <div><label className="mb-1.5 block label-md">Jurusan dalam grup</label><input className="input-field" value={PROGRAMS.filter((item) => item.quotaGroup === PROGRAMS.find((program) => program.name === currentProgram)?.quotaGroup).map((item) => item.name).join(', ')} readOnly /></div>
            <div><label htmlFor="quota-period" className="mb-1.5 block label-md">Maksimum Proposal/Dosen/Periode</label><input id="quota-period" className="input-field" type="number" min={1} max={20} value={quotaPeriod} onChange={(event) => setQuotaPeriod(Number(event.target.value))} /></div>
            <div><label htmlFor="quota-semester" className="mb-1.5 block label-md">Maksimum Proposal/Dosen/Semester</label><input id="quota-semester" className="input-field" type="number" min={1} max={60} value={quotaSemester} onChange={(event) => setQuotaSemester(Number(event.target.value))} /><p className="code-meta mt-1 text-[#475569]">Dihitung dari seluruh periode dalam satu semester.</p></div>
          </div>
          {revisionError && <ErrorBlock message={revisionError} onRetry={() => setRevisionError('')} />}
          <div className="flex justify-end border-t border-[#E2E8F0] px-5 py-4"><button className="btn-primary" type="button" onClick={save}>Simpan Pengaturan</button></div>
        </Panel>
        <Panel title="Beban Bimbingan Dosen">
          <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-[#F1F5F9]">{['Dosen', 'Bidang', 'Periode', 'Semester', 'Status'].map((item) => <th className="px-5 py-3 label-md uppercase text-[#475569]" key={item}>{item}</th>)}</tr></thead><tbody className="divide-y divide-[#E2E8F0]">{scopedLecturers.map((lecturer) => <tr key={lecturer.id}><td className="px-5 py-4 body-medium">{lecturer.name}</td><td className="px-5 py-4 body-base">{lecturer.expertise}</td><td className="px-5 py-4 code-meta">{lecturer.periodLoad} / {activeQuota.period}</td><td className="px-5 py-4 code-meta">{lecturer.semesterLoad} / {activeQuota.semester}</td><td className="px-5 py-4"><Pill>{quotaStatus(lecturer)}</Pill></td></tr>)}</tbody></table></div>
        </Panel>
        {quotaConfirmed && <Dialog title="Konfirmasi Pengaturan Kuota" onClose={() => setQuotaConfirmed(false)}><p className="body-base">Kuota per periode berubah dari {activeQuota.period} menjadi {quotaPeriod}, dan kuota semester berubah dari {activeQuota.semester} menjadi {quotaSemester} untuk grup jurusan {activeGroupId}. Jurusan lain dalam grup turut terdampak.</p><div className="mt-5 flex justify-end gap-3"><button className="btn-secondary" onClick={() => setQuotaConfirmed(false)}>Batal</button><button className="btn-primary" onClick={() => { setQuotaSettings((current) => ({ ...current, [activeGroupId]: { period: quotaPeriod, semester: quotaSemester } })); setQuotaConfirmed(false); showToast('Pengaturan kuota berhasil disimpan.'); }}>Ya, Simpan Pengaturan</button></div></Dialog>}
      </div>
    );
  };

  const renderReviewer = () => {
    const candidates = scopedProposals.filter((item) => item.period === period && item.review === 'Diteruskan ke plotting');
    const confirmOne = (proposal: AdminProposal) => {
      const needed = proposal.sks === 6 ? 4 : 3;
      const unavailable = proposal.reviewers.map((id) => lecturers.find((item) => item.id === id)).find((item) => item?.status === 'Cuti' || item?.reviewLoad === 8);
      if (unavailable) {
        setRevisionError(unavailable.status === 'Cuti'
          ? `E-BIZ-005 — ${unavailable.name} sedang berstatus cuti dan tidak dapat ditugaskan.`
          : `E-BIZ-006 — ${unavailable.name} telah mencapai batas beban review (${unavailable.reviewLoad} dari 8).`);
        return;
      }
      if (proposal.reviewers.length < needed || proposal.reviewers.length > 4) {
        setRevisionError(`E-BIZ-007 — Proposal dengan bobot ${proposal.sks} SKS memerlukan ${needed} sampai 4 reviewer. Saat ini ${proposal.reviewers.length}.`);
        return;
      }
      updateProposal(proposal.id, (item) => ({ ...item, status: 'Dalam Review', history: [...item.history, { at: NOW, actor: title, action: 'Reviewer dikonfirmasi' }] }));
      showToast('Reviewer berhasil dikonfirmasi.');
      setRevisionError('');
    };
    const saveReviewerSelection = () => {
      if (!reviewerProposal) return;
      const required = reviewerProposal.sks === 6 ? 4 : 3;
      if (reviewerSelection.length < required || reviewerSelection.length > 4) {
        setRevisionError(`E-BIZ-007 — Proposal dengan bobot ${reviewerProposal.sks} SKS memerlukan ${required} sampai 4 reviewer. Saat ini ${reviewerSelection.length}.`);
        return;
      }
      const duplicate = reviewerSelection.find((id, index) => reviewerSelection.indexOf(id) !== index);
      if (duplicate) {
        setRevisionError(`E-VAL-005 — ${getLecturer(duplicate)?.name ?? duplicate} dipilih lebih dari satu kali.`);
        return;
      }
      updateProposal(reviewerProposal.id, (proposal) => ({ ...proposal, reviewers: reviewerSelection }));
      setReviewerProposal(null);
      setModal(null);
      setRevisionError('');
      showToast('Susunan reviewer berhasil diperbarui.');
    };
    const confirmAll = () => {
      let success = 0;
      const failed: string[] = [];
      candidates.forEach((proposal) => {
        const invalid = proposal.reviewers.map((id) => lecturers.find((item) => item.id === id)).find((item) => item?.status === 'Cuti' || item?.reviewLoad === 8);
        if (invalid) failed.push(`${proposal.id} (${invalid.status === 'Cuti' ? 'E-BIZ-005' : 'E-BIZ-006'})`);
        else {
          updateProposal(proposal.id, (item) => ({ ...item, status: 'Dalam Review', history: [...item.history, { at: NOW, actor: title, action: 'Reviewer dikonfirmasi' }] }));
          success += 1;
        }
      });
      setRevisionError(failed.length ? `E-PART-001 — ${success} dari ${candidates.length} berhasil disimpan. ${failed.length} gagal: ${failed.join(', ')}.` : '');
    };
    return (
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><h1 className="headline-lg">Plotting Reviewer Proposal</h1>{renderPeriodPicker()}</div>
        {revisionError && <ErrorBlock message={revisionError} onRetry={() => setRevisionError('')} />}
        <Panel title="Rekomendasi Reviewer" action={<button type="button" className="btn-primary" onClick={confirmAll}>Konfirmasi Semua Rekomendasi</button>}>
          {candidates.length === 0 ? <Empty>Tidak ada proposal yang menunggu plotting reviewer pada periode ini.</Empty> : <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-[#F1F5F9]">{['Mahasiswa', 'Judul', 'Tag', 'Bobot', 'Pembimbing', 'Reviewer', 'Status', 'Aksi'].map((item) => <th key={item} className="px-4 py-3 label-md uppercase text-[#475569]">{item}</th>)}</tr></thead><tbody className="divide-y divide-[#E2E8F0]">{candidates.map((proposal) => <tr key={proposal.id}><td className="px-4 py-4 body-medium">{proposal.studentName}<div className="code-meta">{proposal.nrp}</div></td><td className="min-w-56 px-4 py-4 body-base">{proposal.title}</td><td className="px-4 py-4 code-meta">{proposal.tags.join(', ')}</td><td className="px-4 py-4 body-base">{proposal.sks} SKS</td><td className="px-4 py-4 body-base">{getLecturer(proposal.advisorId)?.name ?? '—'}</td><td className="px-4 py-4 code-meta">{proposal.reviewers.map((id) => getLecturer(id)?.name.split(',')[0]).join(', ')}</td><td className="px-4 py-4"><Pill>{proposal.review}</Pill></td><td className="px-4 py-4 text-right"><div className="flex justify-end gap-2"><button className="btn-secondary" onClick={() => { setReviewerProposal(proposal); setReviewerSelection([...proposal.reviewers]); setRevisionError(''); setModal('reviewers'); }}>Ubah</button><button className="btn-secondary" onClick={() => confirmOne(proposal)}>Konfirmasi</button></div></td></tr>)}</tbody></table></div>}
        </Panel>
        {modal === 'reviewers' && reviewerProposal && <Dialog title="Ubah Reviewer" onClose={() => setModal(null)}>
          <p className="body-base">{reviewerProposal.studentName} · {reviewerProposal.sks} SKS · pilih {reviewerProposal.sks === 6 ? '4' : '3 sampai 4'} reviewer.</p>
          {revisionError && <p role="alert" className="mt-3 body-base text-[#B91C1C]">{revisionError}</p>}
          <div className="mt-3 max-h-80 divide-y divide-[#E2E8F0] overflow-y-auto">{lecturers.filter((item) => item.program === currentProgram).map((lecturer) => <label key={lecturer.id} className="flex items-center gap-3 py-3"><input type="checkbox" checked={reviewerSelection.includes(lecturer.id)} onChange={(event) => setReviewerSelection((selected) => event.target.checked ? [...selected, lecturer.id] : selected.filter((id) => id !== lecturer.id))} /><span className="flex-1"><span className="block body-medium">{lecturer.name}</span><span className="code-meta text-[#475569]">Beban review {lecturer.reviewLoad} / 8 · {lecturer.status}</span></span><Pill>{lecturer.status === 'Cuti' ? 'Cuti' : lecturer.reviewLoad === 8 ? 'Penuh' : 'Tersedia'}</Pill></label>)}</div>
          <div className="mt-5 flex justify-end gap-3"><button className="btn-secondary" onClick={() => setModal(null)}>Batal</button><button className="btn-primary" onClick={saveReviewerSelection}>Simpan Perubahan</button></div>
        </Dialog>}
      </div>
    );
  };

  const renderReadOnlyPages = () => {
    if (route === '/dekan/monitoring') {
      const selectedPrograms = PROGRAMS.filter((program) => !programFilter || program.name === programFilter);
      const statuses: ProposalStatus[] = ['Diajukan', 'Dalam Review', 'Diterima', 'Diperbaiki', 'Perbaikan Bersyarat', 'Ditolak'];
      return (
        <div className="space-y-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><h1 className="headline-lg">Monitoring Fakultas</h1><div className="flex flex-wrap gap-3">{renderPeriodPicker()}<select aria-label="Program Studi" className="input-field min-w-56" value={programFilter} onChange={(event) => setProgramFilter(event.target.value)}><option value="">Semua Program Studi</option>{PROGRAMS.map((program) => <option key={program.code}>{program.name}</option>)}</select></div></div>
          {loadError === 'monitoring' && <ErrorBlock message="E-NET-003 — Data monitoring gagal dimuat." onRetry={() => setLoadError('')} />}
          <Panel title="Matriks Status Proposal">
            {period === '202702' ? <Empty>Tidak ada proposal pada periode FEBRUARI 2027.</Empty> : <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-[#F1F5F9]"><th className="px-4 py-3 label-md uppercase">Program Studi</th>{statuses.map((status) => <th key={status} className="px-3 py-3 text-right label-md uppercase">{status}</th>)}<th className="px-4 py-3 text-right label-md uppercase">Total</th></tr></thead><tbody className="divide-y divide-[#E2E8F0]">{selectedPrograms.map((program) => { const rows = proposals.filter((item) => item.program === program.name && item.period === period); return <tr key={program.code}><td className="px-4 py-4 body-medium">{program.name}</td>{statuses.map((status) => <td key={status} className="px-3 py-4 text-right code-meta">{rows.filter((item) => item.status === status).length}</td>)}<td className="px-4 py-4 text-right body-semibold">{rows.length}</td></tr>; })}</tbody></table></div>}
          </Panel>
          <Panel title="Ringkasan Status Revisi">
            <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-[#F1F5F9]">{['Program Studi', 'Menunggu Persetujuan', 'Disetujui', 'Ditolak', 'Perlu Revisi'].map((item) => <th key={item} className="px-4 py-3 label-md uppercase">{item}</th>)}</tr></thead><tbody className="divide-y divide-[#E2E8F0]">{selectedPrograms.map((program) => {
              const historicCounts: Record<string, [number, number, number, number]> = {
                IF: [4, 3, 1, 1], SI: [3, 2, 1, 1], TE: [2, 2, 0, 1], TI: [2, 1, 0, 0], S2TI: [1, 1, 0, 0],
              };
              return <tr key={program.code}><td className="px-4 py-3 body-medium">{program.name}</td>{(['Menunggu Persetujuan', 'Disetujui', 'Ditolak', 'Perlu Revisi'] as const).map((status, index) => <td key={status} className="px-4 py-3 text-right code-meta">{period === '202610' ? historicCounts[program.code][index] : status === 'Menunggu Persetujuan' ? revisions.filter((item) => getProposal(item.proposalId)?.program === program.name && item.status === 'Menunggu Persetujuan').length : 0}</td>)}</tr>;
            })}</tbody></table></div>
          </Panel>
          <Panel title="Agenda Sidang Fakultas">
            <div className="divide-y divide-[#E2E8F0]">{proposals.filter((item) => item.period === '202612' && item.status === 'Dalam Review').slice(0, 5).map((proposal, index) => <div key={proposal.id} className="flex flex-wrap justify-between gap-2 px-5 py-3"><span className="body-medium">{proposal.studentName} · {proposal.program}</span><span className="code-meta">2 Des 2026 · {index % 2 ? '09.30' : '08.00'} · Ruang A.20{index % 3 + 1}</span></div>)}</div>
          </Panel>
        </div>
      );
    }

    if (route === '/kaprodi/kuota') return renderQuota();
    if (route === '/kaprodi/reviewer') return renderReviewer();
    if (route === '/kaprodi/penguji') {
      const students = scopedProposals.filter((item) => item.period === '202612').slice(0, 14);
      return <div className="space-y-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><h1 className="headline-lg">Plotting Penguji TA</h1>{renderPeriodPicker()}</div><Panel title="Susunan Penguji" action={<button className="btn-primary" onClick={() => showToast('Konfirmasi susunan terpilih selesai diproses.')}>Konfirmasi Susunan Terpilih</button>}><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-[#F1F5F9]">{['Mahasiswa', 'Judul', 'Pembimbing', 'Penguji dari reviewer proposal', 'Status', 'Aksi'].map((item) => <th key={item} className="px-4 py-3 label-md uppercase">{item}</th>)}</tr></thead><tbody className="divide-y divide-[#E2E8F0]">{students.map((proposal, index) => <tr key={proposal.id}><td className="px-4 py-3 body-medium">{proposal.studentName}<div className="code-meta">{proposal.nrp}</div></td><td className="min-w-64 px-4 py-3 body-base">{proposal.title}</td><td className="px-4 py-3 body-base">{getLecturer(proposal.advisorId)?.name ?? 'Belum ditetapkan'}</td><td className="px-4 py-3 body-base">{index === 0 ? '1 dari minimal 2' : '2 dari minimal 2'}</td><td className="px-4 py-3"><Pill>{index === 0 ? 'Direkomendasikan' : 'Dikonfirmasi'}</Pill></td><td className="px-4 py-3 text-right"><button className="btn-secondary" onClick={() => setRevisionError(index === 0 ? 'E-BIZ-010 — Susunan penguji belum memenuhi aturan: baru 1 dari minimal 2 penguji berasal dari reviewer proposal.' : '')}>Ubah</button></td></tr>)}</tbody></table></div>{revisionError && <ErrorBlock message={revisionError} onRetry={() => setRevisionError('')} />}</Panel></div>;
    }
    if (route === '/kaprodi/hasil-sidang') {
      const finished = proposals.filter((item) => item.program === currentProgram && item.period === period && ['Diterima', 'Diperbaiki', 'Perbaikan Bersyarat', 'Ditolak'].includes(item.status));
      const grouped: ProposalStatus[] = ['Diterima', 'Diperbaiki', 'Perbaikan Bersyarat', 'Ditolak'];
      return <div className="space-y-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><h1 className="headline-lg">Hasil Sidang Proposal</h1>{renderPeriodPicker()}</div>{period === '202612' ? <Empty>Sidang proposal periode DESEMBER 2026 dijadwalkan pada 2 Des 2026.</Empty> : <div className="grid gap-5 xl:grid-cols-2">{grouped.map((status) => <Panel key={status} title={status.toUpperCase()} action={<Pill>{finished.filter((item) => item.status === status).length}</Pill>}>{finished.filter((item) => item.status === status).length === 0 ? <Empty>Tidak ada hasil sidang dengan status {status}.</Empty> : <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-[#F1F5F9]">{['NRP', 'Nama', 'Judul', 'Pembimbing', 'Co-Pembimbing'].map((item) => <th key={item} className="px-3 py-2 label-md uppercase">{item}</th>)}</tr></thead><tbody className="divide-y divide-[#E2E8F0]">{finished.filter((item) => item.status === status).map((proposal) => <tr key={proposal.id}><td className="px-3 py-3 code-meta">{proposal.nrp}</td><td className="px-3 py-3 body-base">{proposal.studentName}</td><td className="px-3 py-3 body-base">{proposal.title}</td><td className="px-3 py-3 body-base">{getLecturer(proposal.advisorId)?.name ?? '—'}</td><td className="px-3 py-3 body-base">{getLecturer(proposal.coAdvisorId)?.name ?? '—'}</td></tr>)}</tbody></table></div>}</Panel>)}</div>}<div className="flex justify-end"><button className="btn-secondary" onClick={() => window.print()}>Cetak</button></div></div>;
    }
    if (route === '/kaprodi/jadwal') {
      const scheduleRows = scopedProposals.filter((item) => item.period === '202612' && item.status === 'Dalam Review').slice(0, 12);
      return <div className="space-y-6"><h1 className="headline-lg">Jadwal Sidang</h1><div className="flex gap-2"><button className="btn-secondary">Agenda Sidang</button><button className="btn-secondary">Rekomendasi Jadwal</button></div><Panel title="Agenda dan Rekomendasi Sidang"><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-[#F1F5F9]">{['Mahasiswa', 'Jenis', 'Tanggal', 'Jam', 'Ruang', 'Penguji', 'Aksi'].map((item) => <th key={item} className="px-4 py-3 label-md uppercase">{item}</th>)}</tr></thead><tbody className="divide-y divide-[#E2E8F0]">{scheduleRows.map((proposal, index) => <tr key={proposal.id}><td className="px-4 py-3 body-medium">{proposal.studentName}</td><td className="px-4 py-3 body-base">Proposal</td><td className="px-4 py-3 code-meta">2 Des 2026</td><td className="px-4 py-3 code-meta">{['08.00', '09.30', '13.00'][index % 3]}</td><td className="px-4 py-3 body-base">A.20{index % 3 + 1}</td><td className="px-4 py-3 body-base">3 reviewer</td><td className="px-4 py-3 text-right"><button className="btn-secondary" onClick={() => showToast('Jadwal sidang telah dikonfirmasi.')}>Setujui</button></td></tr>)}</tbody></table></div></Panel></div>;
    }
    if (route === '/kaprodi/laporan') {
      const report = reportTab === 'review'
        ? [['Dosen', 'Total Review', 'Sudah Review', 'Tidak Review', 'Persentase'], ...lecturers.filter((item) => item.program === currentProgram).map((item) => [item.name, String(item.reviewLoad), String(Math.max(0, item.reviewLoad - 1)), '1', `${Math.round((item.reviewLoad - 1) / Math.max(1, item.reviewLoad) * 100)}%`])]
        : reportTab === 'upload'
          ? [['Kode Periode', 'Periode', 'Jumlah Upload DOC', 'Diterima', 'Diperbaiki', 'Perbaikan Bersyarat', 'Ditolak', 'Jumlah Upload PDF', 'Jumlah SK Keluar'], ['202610', 'OKTOBER 2026', '27', '18', '5', '3', '1', '27', '18'], ['202612', 'DESEMBER 2026', '26', '0', '0', '0', '0', '26', '0']]
          : [['Dosen', 'Periode', 'Jumlah Bimbingan'], ...lecturers.filter((item) => item.program === currentProgram).map((item) => [item.name, periodLabel, String(item.periodLoad)])];
      return <div className="space-y-6"><h1 className="headline-lg">Laporan</h1><div className="flex flex-wrap gap-2">{[['bimbingan', 'Bimbingan'], ['review', 'Review'], ['upload', 'Upload']].map(([key, label]) => <button key={key} className={reportTab === key ? 'rounded-lg border border-[#0F2A66] bg-[#F1F5F9] px-4 py-2 body-semibold text-[#0F2A66]' : 'btn-secondary'} onClick={() => { setReportTab(key); window.history.replaceState({}, '', `/kaprodi/laporan?tab=${key}`); }}>{label}</button>)}</div><Panel title={`Laporan ${reportTab === 'review' ? 'Review' : reportTab === 'upload' ? 'Upload' : 'Bimbingan'}`}><div className="flex flex-wrap items-end gap-3 p-5"><div><label className="mb-1.5 block label-md">Mode Filter</label><select className="input-field" value={reportFilter} onChange={(event) => setReportFilter(event.target.value)}><option>Tanpa Filter</option><option>Periode</option><option>Semester</option></select></div>{reportFilter !== 'Tanpa Filter' && <div><label className="mb-1.5 block label-md">Rentang Periode</label><input className="input-field" defaultValue="AGUSTUS 2026 - DESEMBER 2026" /></div>}<button className="btn-secondary" onClick={() => writeDownload(`Laporan_${reportTab}.csv`, report.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n'), 'text/csv')}>Unduh CSV</button></div><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-[#F1F5F9]">{report[0].map((cell) => <th key={cell} className="px-4 py-3 label-md uppercase">{cell}</th>)}</tr></thead><tbody className="divide-y divide-[#E2E8F0]">{report.slice(1).map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={`${index}-${cellIndex}`} className="px-4 py-3 body-base">{cell}</td>)}</tr>)}</tbody></table></div></Panel></div>;
    }
    if (route === '/kaprodi/dokumen') {
      const documents = [
        ['DOC-01', 'Formulir Proposal Tugas Akhir', '12 Nov 2026', '1,2 MB'],
        ['DOC-02', 'Pedoman Penulisan Tugas Akhir 2026', '12 Nov 2026', '4,8 MB'],
        ['DOC-03', 'Panduan Sidang Proposal dan Sidang Akhir', '12 Nov 2026', '2,1 MB'],
        ['DOC-04', 'Pedoman Penulisan TA 2024 (arsip)', '20 Agu 2024', '—'],
      ];
      return <div className="space-y-6"><h1 className="headline-lg">Dokumen & Panduan</h1><Panel title="Daftar Dokumen"><div className="divide-y divide-[#E2E8F0]">{documents.map(([code, name, date, size]) => <div key={code} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"><div><p className="body-semibold">{name}</p><p className="code-meta mt-1 text-[#475569]">{date} · {size}</p></div><button className="btn-secondary" onClick={() => code === 'DOC-04' ? setRevisionError('E-DL-001 — Berkas Pedoman Penulisan TA 2024 tidak tersedia.') : writeDownload(`${code}_${name.replaceAll(' ', '_')}.pdf`, `${name}\nInstitut Sains dan Teknologi Terpadu Surabaya`)}>Unduh</button></div>)}</div>{revisionError.startsWith('E-DL-001') && <ErrorBlock message={revisionError} onRetry={() => setRevisionError('')} />}</Panel></div>;
    }
    return null;
  };

  const renderPage = () => {
    const wrongRole = role === 'DEKAN' ? route.startsWith('/kaprodi') : route.startsWith('/dekan');
    if (wrongRole) {
      return <div className="space-y-6"><h1 className="headline-lg">Tidak Berwenang</h1><ErrorBlock message={`E-AUTH-403 — Anda tidak memiliki wewenang untuk mengakses ${route} dengan peran aktif ${role}.`} onRetry={() => go(role === 'DEKAN' ? '/dekan' : '/kaprodi')}><button className="btn-secondary" onClick={() => go(role === 'DEKAN' ? '/dekan' : '/kaprodi')}>Kembali ke Beranda Peran</button></ErrorBlock></div>;
    }
    const knownRoute = menu.some((item) => item[1] === route)
      || route.startsWith(`/${role.toLowerCase()}/approve/`)
      || (role === 'KAPRODI' && route.startsWith('/kaprodi/pengajuan/'))
      || route === '/profil';
    if (!knownRoute) {
      return <div className="space-y-6"><h1 className="headline-lg">Halaman Tidak Ditemukan</h1><ErrorBlock message="E-NF-404 — Halaman yang diminta tidak ditemukan atau telah dihapus." onRetry={() => go(role === 'DEKAN' ? '/dekan' : '/kaprodi')}><button className="btn-secondary" onClick={() => go(role === 'DEKAN' ? '/dekan' : '/kaprodi')}>Kembali</button></ErrorBlock></div>;
    }
    if (isDashboard) return renderDashboard();
    if (route === '/kaprodi/pengajuan') return renderProposalList(false);
    if (route.startsWith('/kaprodi/pengajuan/')) return renderProposalDetail();
    if (route === '/dekan/proposal') return renderProposalList(true);
    if (route === '/kaprodi/penugasan') return renderAssignments();
    if (route === '/kaprodi/approve' || route === '/dekan/approve') return renderApprovalQueue();
    if (showApprovalDetail) return renderApprovalDetail();
    if (route === '/kaprodi/monitoring' || route === '/dekan/monitoring' || route.startsWith('/dekan/monitoring')) return renderReadOnlyPages();
    if (route === '/profil') return <ProfileContent
      name={title}
      email={profileEmail}
      identifier={identifier}
      onSave={(name, email) => {
        setProfileName(name);
        setProfileEmail(email);
        localStorage.setItem(`tuntas-proto-v2:${persona}:profile-name`, name);
        localStorage.setItem(`tuntas-proto-v2:${persona}:profile-email`, email);
        showToast('Data profil berhasil diperbarui.');
      }}
    />;
    const readOnlyPage = renderReadOnlyPages();
    if (readOnlyPage) return readOnlyPage;
    return (
      <div className="space-y-6">
        <h1 className="headline-lg">{currentTitle}</h1>
        <Panel title={currentTitle}><Empty>Data belum tersedia untuk kriteria yang dipilih.</Empty></Panel>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="fixed inset-x-0 top-0 z-40 h-[72px] border-b border-[#E2E8F0] bg-white">
        <div className="mx-auto flex h-full max-w-[1568px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button type="button" className="lg:hidden rounded-lg p-2 text-[#475569] hover:bg-[#F1F5F9]" onClick={() => setMobileNav((open) => !open)} aria-label="Buka menu"><Menu className="h-5 w-5" /></button>
            <IsttsLogo className="h-9 w-9 shrink-0" />
            <button type="button" onClick={() => go(role === 'DEKAN' ? '/dekan' : '/kaprodi')} className="text-left">
              <span className="block font-['Manrope'] text-[15px] font-bold text-[#0F2A66]">Portal Upload Tugas Akhir</span>
              <span className="label-sm text-[#475569]">{role === 'DEKAN' ? 'Dekan' : `Kaprodi ${currentProgram}`}</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button type="button" className="relative rounded-lg p-2 text-[#475569] hover:bg-[#F1F5F9]" aria-label="Notifikasi" onClick={() => setNotificationOpen((open) => !open)}><Bell className="h-5 w-5 stroke-[1.5]" /><span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#D97706] px-1 text-[11px] font-semibold text-white">{role === 'DEKAN' ? decanRevisions.length : 4}</span></button>
              {notificationOpen && <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-level-3"><div className="border-b border-[#E2E8F0] px-4 py-3 body-semibold">Notifikasi</div>{(role === 'DEKAN' ? decanRevisions.slice(0, 3) : revisions.filter((item) => item.approvals[1].status === 'Menunggu').slice(0, 3)).map((item) => { const proposal = getProposal(item.proposalId); return <button key={item.code} className="block w-full border-b border-[#E2E8F0] px-4 py-3 text-left hover:bg-[#F8FAFC]" onClick={() => { setNotificationOpen(false); openRevision(item.code); }}><span className="body-medium">Permintaan persetujuan revisi: {proposal?.studentName}</span><span className="mt-1 block code-meta text-[#475569]">{item.code}</span></button>; })}</div>}
            </div>
            <div className="relative">
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[#F1F5F9]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0F2A66] label-md text-white">{persona === 'budi' ? 'BS' : 'AW'}</span>
                  <span className="hidden max-w-[190px] text-left sm:block"><span className="block truncate body-semibold">{title}</span><span className="block truncate code-meta text-[#475569]">{identifier}</span></span><ChevronDown className="h-4 w-4 text-[#475569]" />
                </summary>
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-[#E2E8F0] bg-white py-1 shadow-level-3">
                  <button className="block w-full px-4 py-2 text-left body-medium hover:bg-[#F1F5F9]" onClick={() => go('/profil')}>Ubah Profil</button>
                  {isDualRole && <button className="block w-full px-4 py-2 text-left body-medium hover:bg-[#F1F5F9]" onClick={() => setRoleAndRoute(role === 'DEKAN' ? 'KAPRODI' : 'DEKAN')}>Beralih Peran ke {role === 'DEKAN' ? 'Kaprodi S1-ELEKTRO' : 'Dekan'}</button>}
                  <button className="flex w-full items-center gap-2 px-4 py-2 text-left body-medium text-[#B91C1C] hover:bg-[#FEE2E2]" onClick={logout}><LogOut className="h-4 w-4" />Keluar</button>
                </div>
              </details>
            </div>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-[1568px] pt-[72px]">
        <aside className={`${mobileNav ? 'translate-x-0' : '-translate-x-full'} fixed bottom-0 left-0 top-[72px] z-30 w-[248px] border-r border-[#E2E8F0] bg-white transition-transform lg:sticky lg:top-[72px] lg:h-[calc(100vh-72px)] lg:translate-x-0`}>
          <nav aria-label="Menu peran" className="overflow-y-auto py-4">
            {menu.map(([label, path, Icon]) => {
              const active = path === route || (path !== `/${role.toLowerCase()}` && route.startsWith(`${path}/`));
              return <button key={path} type="button" onClick={() => go(path)} className={`flex min-h-11 w-full items-center gap-3 border-l-[3px] px-4 py-2.5 text-left body-medium transition-colors ${active ? 'border-[#0F2A66] bg-[#F1F5F9] font-semibold text-[#0F2A66]' : 'border-transparent text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F2A66]'}`}><Icon className="h-4 w-4 shrink-0 stroke-[1.5]" />{label}</button>;
            })}
          </nav>
          {mobileNav && <button className="fixed inset-0 -z-10 bg-slate-900/20 lg:hidden" aria-label="Tutup menu" onClick={() => setMobileNav(false)} />}
        </aside>
        <main className="min-h-[calc(100vh-72px)] min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-8">
          {renderPage()}
        </main>
      </div>
      <Footer />
      {modal === 'assign' && selectedProposal && <Dialog title="Pilih Dosen Pembimbing" onClose={() => setModal(null)}>
        <div className="mb-4 border-b border-[#E2E8F0] pb-4"><p className="body-semibold">{selectedProposal.studentName} · {selectedProposal.nrp}</p><p className="body-base mt-1">{selectedProposal.title}</p><p className="code-meta mt-1 text-[#475569]">{selectedProposal.field}</p></div>
        {assignmentError && <ErrorBlock message={assignmentError} onRetry={() => setAssignmentError('')}><button className="btn-secondary" onClick={() => { setSelectedLecturer(''); setAssignmentError(''); }}>Pilih Dosen Lain</button><button className="btn-secondary" onClick={() => { setModal(null); go('/kaprodi/kuota'); }}>Buka Kuota Bimbingan</button></ErrorBlock>}
        {selectedLecturer && (lecturers.find((item) => item.id === selectedLecturer)?.periodLoad ?? 0) === activeQuota.period - 1 && <div className="mb-4 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-[#92400E]">W-BIZ-003 — Beban bimbingan akan mencapai batas kuota setelah penetapan ini.</div>}
        <div className="max-h-80 divide-y divide-[#E2E8F0] overflow-y-auto">{lecturers.filter((item) => item.program === currentProgram).map((lecturer) => {
          const status = lecturer.status === 'Cuti' ? 'Cuti' : lecturer.periodLoad >= activeQuota.period || lecturer.semesterLoad >= activeQuota.semester ? 'Penuh' : lecturer.periodLoad / activeQuota.period >= 0.75 || lecturer.semesterLoad / activeQuota.semester >= 0.75 ? 'Hampir Penuh' : 'Tersedia';
          const matches = selectedProposal.tags.some((tag) => lecturer.tags.includes(tag));
          return <label key={lecturer.id} className="flex cursor-pointer items-start gap-3 py-3"><input type="radio" name="advisor" checked={selectedLecturer === lecturer.id} onChange={() => { setSelectedLecturer(lecturer.id); setAssignmentError(''); }} /><span className="min-w-0 flex-1"><span className="block body-semibold">{lecturer.name}</span><span className="block code-meta text-[#475569]">{lecturer.expertise} · Periode {lecturer.periodLoad} / {activeQuota.period} · Semester {lecturer.semesterLoad} / {activeQuota.semester}</span>{matches && <span className="mt-1 inline-flex"><Pill tone="border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]">Sesuai Bidang</Pill></span>}</span><Pill>{status}</Pill></label>;
        })}</div>
        <div className="mt-4"><label htmlFor="co-advisor" className="mb-1.5 block label-md">Co-Pembimbing (opsional)</label><select id="co-advisor" className="input-field" value={selectedCoAdvisor} onChange={(event) => setSelectedCoAdvisor(event.target.value)}><option value="">Tanpa co-pembimbing</option>{lecturers.filter((item) => item.program === currentProgram).map((lecturer) => <option key={lecturer.id} value={lecturer.id}>{lecturer.name}</option>)}</select></div>
        <div className="mt-5 flex justify-end gap-3 border-t border-[#E2E8F0] pt-4"><button className="btn-secondary" onClick={() => setModal(null)}>Batal</button><button className="btn-primary" disabled={!selectedLecturer} onClick={assignmentSubmit}>Tetapkan Pembimbing</button></div>
      </Dialog>}
      {modal === 'confirm-approval' && selectedRevision && <Dialog title="Konfirmasi Keputusan Revisi" onClose={() => setModal(null)}><p className="body-base">Simpan keputusan {decision.toLowerCase()} untuk {getProposal(selectedRevision.proposalId)?.studentName}: {getProposal(selectedRevision.proposalId)?.title}, versi {selectedRevision.version}.</p><div className="mt-5 flex justify-end gap-3"><button className="btn-secondary" onClick={() => setModal(null)}>Batal</button><button className="btn-primary" onClick={performDecision}>Ya, Simpan Keputusan</button></div></Dialog>}
      <div className="sr-only" aria-live="polite">{saveMessage}</div>
    </div>
  );
};

const ProfileContent: React.FC<{ name: string; email: string; identifier: string; onSave: (name: string, email: string) => void }> = ({ name, email: initialEmail, identifier, onSave }) => {
  const [displayName, setDisplayName] = useState(name);
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState('');
  return <div className="mx-auto max-w-2xl space-y-6"><h1 className="headline-lg">Ubah Profil</h1><Panel title="Data Profil"><form className="space-y-4 p-5" onSubmit={(event) => { event.preventDefault(); if (!displayName.trim()) { setError('E-VAL-002 — Nama wajib diisi.'); return; } if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('E-VAL-006 — Format email tidak valid.'); return; } setError(''); onSave(displayName.trim(), email.trim()); }}><div><label className="mb-1.5 block label-md">Username</label><input className="input-field" value={identifier} readOnly /></div><div><label htmlFor="admin-name" className="mb-1.5 block label-md">Nama</label><input id="admin-name" className="input-field" value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></div><div><label htmlFor="admin-email" className="mb-1.5 block label-md">Email</label><input id="admin-email" className="input-field" value={email} onChange={(event) => setEmail(event.target.value)} /></div>{error && <p className="body-base text-[#B91C1C]" role="alert">{error}</p>}<div className="flex justify-end"><button className="btn-primary" type="submit">Simpan</button></div></form></Panel></div>;
};
