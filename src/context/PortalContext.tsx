import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  SEED_ACCOUNTS,
  SEED_NEW_STUDENT,
  SEED_QUOTA_STUDENT,
  SEED_LATE_STUDENT,
  SEED_LATE_REVISION_STUDENT,
  SEED_LATE_REVISION_THESIS,
  SEED_QUOTA_ALLOCATION,
  SEED_ARCHIVE,
  SEED_BAA_ROOM_SLOTS,
  SEED_DOCTORAL_STUDENTS,
  SEED_LECTURERS,
  SEED_LECTURER_SCHEDULES,
  SEED_MAX_QUOTAS,
  SEED_NOTIFICATIONS,
  SEED_PERIOD,
  SEED_TEMPLATES,
  SEED_THESES,
  SEED_TOPICS,
} from '../data/seedData';
import {
  AcademicPeriod,
  AcademicStatus,
  ArchiveEntry,
  BaaRoomSlot,
  DefenseRubricScore,
  DefenseSchedule,
  DoctoralPublication,
  DoctoralStage,
  DoctoralStudentRecord,
  DosenStructuralRole,
  EvaluationRecord,
  LecturerProfile,
  LecturerScheduleItem,
  MaxQuotaSetting,
  NotificationItem,
  OfficialTemplate,
  PreviewFilePayload,
  SubmissionFile,
  ThesisRecord,
  TopicRecommendation,
  UserAccount,
  UserRole,
} from '../types/portal';
import { deleteFileBlob, saveFileBlob } from '../utils/fileStorage';
import { flushSync } from 'react-dom';
import { getRevisionDetails, needsRevision, nextRevisionToken, type RevisionDetails } from '../utils/revision';
import { formatDateTimeId, formatFileSize } from '../utils/format';
import { getAdvisorQuotaError, getProposalDeadline, validateStudentPdf } from '../utils/studentSubmission';

const STORAGE_KEY = 'istts_portal_ta_state_v3';

interface PersistedState {
  accounts: Record<UserRole, UserAccount>;
  studentAccounts: UserAccount[];
  currentRole: UserRole | null;
  activeTab: string;
  activeSubTab: string | null;
  focusedThesisId: string | null;
  lecturers: LecturerProfile[];
  theses: ThesisRecord[];
  topics: TopicRecommendation[];
  pendingTopic: { studentId: string; topicId: string; previousName?: string; previousNim?: string } | null;
  archive: ArchiveEntry[];
  templates: OfficialTemplate[];
  notifications: NotificationItem[];
  period: AcademicPeriod;
  maxQuotas: MaxQuotaSetting[];
  baaRoomSlots: BaaRoomSlot[];
  doctoralStudents: DoctoralStudentRecord[];
  lecturerSchedules: LecturerScheduleItem[];
}

function releaseDraftTopic(state: PersistedState): TopicRecommendation[] {
  const draft = state.pendingTopic;
  if (!draft) return state.topics;
  return state.topics.map((topic) => topic.id === draft.topicId ? {
    ...topic, status: 'Tersedia', takenCount: Math.max(0, topic.takenCount - 1),
    reservedByName: draft.previousName, reservedByNim: draft.previousNim,
  } : topic);
}

function buildInitialState(): PersistedState {
  return {
    accounts: SEED_ACCOUNTS,
    studentAccounts: [SEED_ACCOUNTS.mahasiswa, SEED_NEW_STUDENT, SEED_QUOTA_STUDENT, SEED_LATE_STUDENT, SEED_LATE_REVISION_STUDENT],
    currentRole: null,
    activeTab: 'dashboard',
    activeSubTab: null,
    focusedThesisId: null,
    lecturers: SEED_LECTURERS,
    theses: [...SEED_THESES, SEED_QUOTA_ALLOCATION, SEED_LATE_REVISION_THESIS],
    topics: SEED_TOPICS,
    pendingTopic: null,
    archive: SEED_ARCHIVE,
    templates: SEED_TEMPLATES,
    notifications: SEED_NOTIFICATIONS,
    period: SEED_PERIOD,
    maxQuotas: SEED_MAX_QUOTAS,
    baaRoomSlots: SEED_BAA_ROOM_SLOTS,
    doctoralStudents: SEED_DOCTORAL_STUDENTS,
    lecturerSchedules: SEED_LECTURER_SCHEDULES,
  };
}

function loadState(): PersistedState {
  try {
    if (new URLSearchParams(window.location.search).get('reset') === '1') {
      localStorage.removeItem(STORAGE_KEY);
      [
        'tuntas-proto-v2:persona',
        'tuntas-proto-v2:role',
        'tuntas-proto-v2:proposals',
        'tuntas-proto-v2:revisions',
        'tuntas-proto-v2:dekan:revision-code',
        'tuntas-proto-v2:dekan:last-decision',
        'tuntas-proto-v2:lecturers',
        'tuntas-proto-v2:quotas',
        'tuntas-proto-v2:andi:profile-name',
        'tuntas-proto-v2:andi:profile-email',
        'tuntas-proto-v2:budi:profile-name',
        'tuntas-proto-v2:budi:profile-email',
      ].forEach((key) => localStorage.removeItem(key));
      return buildInitialState();
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildInitialState();
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    const fallback = buildInitialState();
    return {
<<<<<<< HEAD
      accounts: { ...fallback.accounts, ...parsed.accounts },
=======
      accounts: parsed.accounts ?? fallback.accounts,
      studentAccounts: Array.from(new Map([
        ...fallback.studentAccounts,
        ...(parsed.studentAccounts ?? []),
        parsed.accounts?.mahasiswa ?? fallback.accounts.mahasiswa,
      ].map(account => [account.id, account])).values()),
>>>>>>> 1a644e2a0806cd31f10b4d99040b69be45389ab7
      currentRole: parsed.currentRole ?? null,
      activeTab: parsed.activeTab ?? 'dashboard',
      activeSubTab: parsed.activeSubTab ?? null,
      focusedThesisId: parsed.focusedThesisId ?? null,
      lecturers: parsed.lecturers ?? fallback.lecturers,
      theses: parsed.theses
        ? [...parsed.theses, ...(!parsed.studentAccounts?.some(account => account.id === SEED_QUOTA_STUDENT.id) &&
            !parsed.theses.some(thesis => thesis.id === SEED_QUOTA_ALLOCATION.id) ? [SEED_QUOTA_ALLOCATION] : []),
            ...(!parsed.studentAccounts?.some(account => account.id === SEED_LATE_REVISION_STUDENT.id) &&
            !parsed.theses.some(thesis => thesis.studentId === SEED_LATE_REVISION_STUDENT.id)
              ? [SEED_LATE_REVISION_THESIS] : [])]
        : fallback.theses,
      topics: parsed.topics ?? fallback.topics,
      pendingTopic: parsed.pendingTopic ?? null,
      archive: parsed.archive ?? fallback.archive,
      templates: parsed.templates ?? fallback.templates,
      notifications: parsed.notifications ?? fallback.notifications,
      period: parsed.period ?? fallback.period,
      maxQuotas: parsed.maxQuotas ?? fallback.maxQuotas,
      baaRoomSlots: parsed.baaRoomSlots ?? fallback.baaRoomSlots,
      doctoralStudents: parsed.doctoralStudents ?? fallback.doctoralStudents,
      lecturerSchedules: parsed.lecturerSchedules ?? fallback.lecturerSchedules,
    };
  } catch {
    return buildInitialState();
  }
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'error';
  message: string;
}

export interface ProposalUploadPayload {
  submissionType: 'Judul Baru' | 'Perpanjangan';
  title: string;
  field: string;
  tags: string[];
  abstract: string;
  proposedAdvisor1Id: string;
  proposedAdvisor2Id: string;
  summary: string;
}

export interface UploadReceipt {
  title: string;
  advisor1Name: string;
  advisor2Name: string;
  semester: string;
  uploadedAt: string;
  fileName: string;
  fileSize: number;
}

interface PortalContextValue {
  currentUser: UserAccount | null;
  activeTab: string;
  activeSubTab: string | null;
  focusedThesisId: string | null;
  setActiveTab: (tab: string) => void;
  navigateWithContext: (tab: string, subTab?: string, thesisId?: string) => void;
  clearFocus: () => void;
  lecturers: LecturerProfile[];
  theses: ThesisRecord[];
  studentThesis: ThesisRecord | undefined;
  topics: TopicRecommendation[];
  archive: ArchiveEntry[];
  templates: OfficialTemplate[];
  notifications: NotificationItem[];
  unreadCount: number;
  period: AcademicPeriod;
  maxQuotas: MaxQuotaSetting[];
  baaRoomSlots: BaaRoomSlot[];
  doctoralStudents: DoctoralStudentRecord[];
  lecturerSchedules: LecturerScheduleItem[];
  preselectedTopic: TopicRecommendation | null;
  clearPreselectedTopic: () => void;
  previewFile: PreviewFilePayload | null;
  openFilePreview: (payload: PreviewFilePayload) => void;
  closeFilePreview: () => void;
  toast: ToastMessage | null;
  showToast: (message: string, type?: ToastMessage['type']) => void;
  dismissToast: () => void;
  login: (identifier: string, password: string) => boolean;
  loginAsRole: (role: UserRole, studentId?: string) => void;
  switchRole: (role: UserRole) => void;
  logout: () => void;
  updateProfile: (updates: Pick<UserAccount, 'name' | 'email'>) => void;
  toggleDosenStructuralRole: (roleKey: DosenStructuralRole) => void;
  uploadProposal: (payload: ProposalUploadPayload, file: File) => Promise<UploadReceipt>;
  uploadRevision: (thesisId: string, summary: string, file: File, details?: RevisionDetails) => Promise<void>;
  submitDosenEvaluation: (
    thesisId: string,
    decision: AcademicStatus,
    notes: string,
    correctionFile?: File | null,
  ) => Promise<void>;
  approveRevisionByQr: (
    qrTokenOrThesisId: string,
    decision: 'Diterima' | 'Ditolak',
    notes: string,
  ) => boolean;
  submitDefenseScore: (
    thesisId: string,
    rubric: Omit<DefenseRubricScore, 'totalScore' | 'grade'>,
    decision: AcademicStatus,
    notes: string,
  ) => void;
  saveProposalReviewers: (thesisId: string, reviewerIds: string[]) => void;
  saveTaExaminers: (thesisId: string, examinerIds: string[]) => boolean;
  issueSkForThesis: (thesisId: string) => void;
  kaprodiScheduleDefense: (thesisId: string, schedule: DefenseSchedule) => void;
  updateMaxQuotaSetting: (
    department: string,
    maxPerPeriod: number,
    maxPerSemester: number,
  ) => void;
  addTopicRecommendation: (
    topic: Pick<TopicRecommendation, 'title' | 'field' | 'quota' | 'description' | 'prerequisites'>,
  ) => void;
  setTopicStatus: (
    topicId: string,
    status: TopicRecommendation['status'],
    reservedByName?: string,
  ) => void;
  deleteTopicRecommendation: (topicId: string) => void;
  claimTopicForProposal: (topic: TopicRecommendation) => void;
  reviewDoctoralLog: (
    studentId: string,
    logId: string,
    status: 'Disetujui' | 'Perlu Revisi',
    promoterNote: string,
  ) => void;
  addDoctoralLogNote: (studentId: string, topic: string, progressSummary: string) => void;
  addDoctoralPublication: (
    studentId: string,
    publication: Omit<DoctoralPublication, 'id'>,
  ) => void;
  advanceDoctoralStage: (studentId: string, nextStage: DoctoralStage, notes: string) => void;
  addLecturerScheduleBlock: (item: Omit<LecturerScheduleItem, 'id'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  resetDemoData: () => void;
}

const PortalContext = createContext<PortalContextValue | null>(null);

function computeGrade(score: number): string {
  if (score >= 85) return 'A';
  if (score >= 80) return 'A-';
  if (score >= 75) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 65) return 'B-';
  if (score >= 60) return 'C+';
  if (score >= 55) return 'C';
  return 'D';
}

export const PortalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PersistedState>(() => loadState());
  const proposalUploadPending = useRef(false);
  const latestState = useRef(state);
  useLayoutEffect(() => { latestState.current = state; }, [state]);
  const [previewFile, setPreviewFile] = useState<PreviewFilePayload | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota exceptions
    }
  }, [state]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const showToast = (message: string, type: ToastMessage['type'] = 'success') => {
    setToast({ id: `toast-${Date.now()}`, type, message });
  };

  const dismissToast = () => setToast(null);

  const currentUser = state.currentRole ? state.accounts[state.currentRole] : null;

  const preselectedTopic = currentUser?.role === 'mahasiswa' && currentUser.id === state.pendingTopic?.studentId
    ? state.topics.find((topic) => topic.id === state.pendingTopic?.topicId) ?? null
    : null;

  const studentThesis = useMemo(() => {
    const mhs = state.accounts.mahasiswa;
    return state.theses.find((item) => item.studentId === mhs.id && !item.isArchived);
  }, [state.theses, state.accounts.mahasiswa]);

  const roleNotifications = useMemo(() => {
    if (!currentUser) return [];
    return state.notifications
      .filter((n) => n.targetRole === currentUser.role || n.targetRole === 'all')
      .filter((n) => {
        if (currentUser.role !== 'mahasiswa' || n.targetRole === 'all') return true;
        if (!n.targetThesisId) return currentUser.id === SEED_ACCOUNTS.mahasiswa.id;
        return state.theses.some(thesis => thesis.id === n.targetThesisId && thesis.studentId === currentUser.id);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [state.notifications, state.theses, currentUser]);

  const unreadCount = useMemo(
    () => roleNotifications.filter((n) => !n.read).length,
    [roleNotifications],
  );

  const pushNotification = (
    prev: NotificationItem[],
    targetRole: UserRole | 'all',
    title: string,
    message: string,
    targetTab?: string,
    targetSubTab?: string,
    targetThesisId?: string,
  ): NotificationItem[] => [
    {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      targetRole,
      title,
      message,
      createdAt: new Date().toISOString(),
      read: false,
      targetTab,
      targetSubTab,
      targetThesisId,
    },
    ...prev,
  ];

  const setActiveTab = (tab: string) => {
    setState((prev) => ({
      ...prev,
      activeTab: tab,
      activeSubTab: null,
      focusedThesisId: null,
    }));
  };

  const navigateWithContext = (tab: string, subTab?: string, thesisId?: string) => {
    setState((prev) => ({
      ...prev,
      activeTab: tab,
      activeSubTab: subTab ?? null,
      focusedThesisId: thesisId ?? null,
    }));
  };

  const clearFocus = () => {
    setState((prev) => ({
      ...prev,
      activeSubTab: null,
      focusedThesisId: null,
    }));
  };

  const login = (identifierInput: string, password: string): boolean => {
    const clean = identifierInput.trim().toLowerCase();
    const matched = [...Object.values(state.accounts), ...state.studentAccounts].find(
      (acc) =>
        acc.username.toLowerCase() === clean ||
        acc.identifier.toLowerCase() === clean ||
        acc.email.toLowerCase() === clean ||
        acc.role === clean,
    );
    if (!matched || (matched.role === 'mahasiswa' && password !== 'istts2026')) {
      return false;
    }
    setState((prev) => ({
      ...prev,
      accounts: matched.role === 'mahasiswa' ? { ...prev.accounts, mahasiswa: matched } : prev.accounts,
      studentAccounts: prev.studentAccounts.map(account => account.id === prev.accounts.mahasiswa.id ? prev.accounts.mahasiswa : account),
      topics: matched.role === 'mahasiswa' && matched.id !== prev.accounts.mahasiswa.id ? releaseDraftTopic(prev) : prev.topics,
      pendingTopic: matched.role === 'mahasiswa' && matched.id !== prev.accounts.mahasiswa.id ? null : prev.pendingTopic,
      currentRole: matched.role,
      activeTab: 'dashboard',
      activeSubTab: null,
      focusedThesisId: null,
    }));
    showToast(`Berhasil masuk sebagai ${matched.name}`);
    return true;
  };

  const loginAsRole = (role: UserRole, studentId = SEED_ACCOUNTS.mahasiswa.id) => {
    const acc = role === 'mahasiswa'
      ? state.studentAccounts.find(student => student.id === studentId) ?? state.accounts.mahasiswa
      : state.accounts[role];
    setState((prev) => ({
      ...prev,
      accounts: role === 'mahasiswa' ? { ...prev.accounts, mahasiswa: acc } : prev.accounts,
      studentAccounts: prev.studentAccounts.map(account => account.id === prev.accounts.mahasiswa.id ? prev.accounts.mahasiswa : account),
      topics: role === 'mahasiswa' && acc.id !== prev.accounts.mahasiswa.id ? releaseDraftTopic(prev) : prev.topics,
      pendingTopic: role === 'mahasiswa' && acc.id !== prev.accounts.mahasiswa.id ? null : prev.pendingTopic,
      currentRole: role,
      activeTab: 'dashboard',
      activeSubTab: null,
      focusedThesisId: null,
    }));
    showToast(`Masuk ke portal sebagai ${acc.name}`);
  };

  const switchRole = (role: UserRole) => {
    const acc = state.accounts[role];
    setState((prev) => ({
      ...prev,
      currentRole: role,
      activeTab: 'dashboard',
      activeSubTab: null,
      focusedThesisId: null,
    }));
    showToast(`Peran aktif dialihkan ke ${acc.name}`);
  };

  const logout = () => {
    setState((prev) => ({
      ...prev,
      currentRole: null,
      activeTab: 'dashboard',
      activeSubTab: null,
      focusedThesisId: null,
    }));
  };

  const updateProfile = (updates: Pick<UserAccount, 'name' | 'email'>) => {
    if (!state.currentRole) return;
    const role = state.currentRole;
    const nextName = role === 'mahasiswa' ? state.accounts[role].name : updates.name.trim();
    const parts = nextName.split(/\s+/);
    const initials =
      parts.length >= 2
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : nextName.slice(0, 2).toUpperCase();

    setState((prev) => ({
      ...prev,
      studentAccounts: role === 'mahasiswa' ? prev.studentAccounts.map(account =>
        account.id === prev.accounts.mahasiswa.id ? { ...account, email: updates.email.trim() } : account) : prev.studentAccounts,
      accounts: {
        ...prev.accounts,
        [role]: {
          ...prev.accounts[role],
          name: nextName,
          email: updates.email.trim(),
          initials,
        },
      },
    }));
    showToast('Perubahan profil berhasil disimpan');
  };

  const toggleDosenStructuralRole = (roleKey: DosenStructuralRole) => {
    setState((prev) => {
      const currentRoles = prev.accounts.dosen.structuralRoles ?? [];
      const exists = currentRoles.includes(roleKey);
      const nextRoles = exists
        ? currentRoles.filter((r) => r !== roleKey)
        : [...currentRoles, roleKey];

      let nextTab = prev.activeTab;
      if (roleKey === 'promotor-s3' && exists && prev.activeTab === 'promotor-s3') {
        nextTab = 'dashboard';
      }
      if (roleKey === 'koordinator-jadwal' && exists && prev.activeTab === 'sinkronisasi-jadwal') {
        nextTab = 'dashboard';
      }

      return {
        ...prev,
        activeTab: nextTab,
        accounts: {
          ...prev.accounts,
          dosen: {
            ...prev.accounts.dosen,
            structuralRoles: nextRoles,
          },
        },
      };
    });
    showToast('Konfigurasi peran struktural dosen diperbarui');
  };

  const uploadProposal = async (payload: ProposalUploadPayload, file: File): Promise<UploadReceipt> => {
    const student = state.accounts.mahasiswa;
    const topicId = preselectedTopic?.id;
    const isExtension = payload.submissionType === 'Perpanjangan';

    const validate = (current: PersistedState) => {
      if (current.currentRole !== 'mahasiswa' || current.accounts.mahasiswa.id !== student.id) {
        throw new Error('Sesi mahasiswa telah berubah. Buka kembali formulir pengajuan.');
      }
      if (Date.parse(getProposalDeadline(current.accounts.mahasiswa, current.period)) <= Date.now()) {
        throw new Error('Batas waktu pengajuan proposal telah berakhir.');
      }
      if (!payload.title.trim() || !payload.field.trim() || !payload.abstract.trim() || !payload.tags.length) {
        throw new Error('Lengkapi judul, bidang minat, abstrak dan minimal satu tag.');
      }
      const advisorError = getAdvisorQuotaError(payload.proposedAdvisor1Id, payload.proposedAdvisor2Id,
        current.lecturers, current.theses, student, current.period, current.maxQuotas);
      if (advisorError) throw new Error(advisorError);
      const active = current.theses.find((item) => item.studentId === student.id && !item.isArchived);
      if (isExtension && active?.submissionType === 'Perpanjangan' &&
          (active.title !== payload.title || active.advisor1Id !== payload.proposedAdvisor1Id ||
           active.advisor2Id !== payload.proposedAdvisor2Id)) {
        throw new Error('Judul dan pembimbing perpanjangan sudah dikunci.');
      }
      if (topicId !== (current.pendingTopic?.studentId === student.id ? current.pendingTopic.topicId : undefined)) {
        throw new Error('Pilihan topik berubah. Periksa kembali data proposal.');
      }
      if (topicId) {
        const topic = current.topics.find((item) => item.id === topicId);
        if (!topic || isExtension || topic.status !== 'Reserved' || topic.reservedByNim !== student.identifier ||
            topic.title !== payload.title || topic.field !== payload.field || topic.lecturerId !== payload.proposedAdvisor1Id) {
          throw new Error('Reservasi topik berubah. Bersihkan pilihan lalu pilih kembali topik yang tersedia.');
        }
      }
      return active;
    };

    if (proposalUploadPending.current) throw new Error('Pengajuan proposal sedang disimpan.');
    validate(state);
    proposalUploadPending.current = true;
    const fileId = `sub-${crypto.randomUUID()}`;
    let blobStored = false;
    try {
      const fileError = await validateStudentPdf(file);
      if (fileError) throw new Error(fileError);
      await saveFileBlob(fileId, file);
      blobStored = true;
      const current = latestState.current;
      const active = validate(current);
      const extension = isExtension ? active : undefined;
      const thesisId = extension?.id ?? `ta-${crypto.randomUUID()}`;
      const uploadedAt = new Date().toISOString();
      const version = (extension?.submissions.filter((item) => item.kind === 'proposal').length ?? 0) + 1;
      const submission: SubmissionFile = {
        id: fileId, kind: 'proposal', versionLabel: `Proposal v${version}.0`, fileName: file.name,
        fileSize: file.size, uploadedAt, uploadedBy: student.name, summary: payload.summary,
        hasRealBlob: true,
      };
      const receipt: UploadReceipt = {
        title: payload.title,
        advisor1Name: current.lecturers.find((item) => item.id === payload.proposedAdvisor1Id)!.name,
        advisor2Name: current.lecturers.find((item) => item.id === payload.proposedAdvisor2Id)?.name ?? '',
        semester: current.period.semesterLabel, uploadedAt, fileName: file.name, fileSize: file.size,
      };
      const updated: ThesisRecord = {
        studentId: student.id, studentName: student.name, studentNim: student.identifier,
        programStudi: student.department, ipk: student.ipk ?? 3.5, sksWeight: 6,
        proposalReviewers: [], taExaminers: [], evaluations: [], skIssued: false,
        ...extension,
        id: thesisId, semester: receipt.semester, submissionType: payload.submissionType,
        title: payload.title, field: payload.field, tags: payload.tags, abstract: payload.abstract,
        newTitle: extension?.title === payload.title ? extension.newTitle : undefined,
        stage: 'Verifikasi Kaprodi', status: 'Menunggu Verifikasi', updatedAt: uploadedAt,
        advisor1Id: payload.proposedAdvisor1Id, advisor2Id: payload.proposedAdvisor2Id,
        proposedAdvisor1Id: payload.proposedAdvisor1Id, proposedAdvisor2Id: payload.proposedAdvisor2Id,
        submissions: [submission, ...(extension?.submissions ?? [])],
      };
      setState((prev) => {
        let notifications = pushNotification(prev.notifications, 'kaprodi', 'Proposal Baru Siap Plotting Reviewer',
          `${student.name} (${student.identifier}) mengunggah proposal dengan tag ${payload.tags.join(', ')}.`,
          'plotting-reviewer', 'proposal', thesisId);
        notifications = pushNotification(notifications, 'dosen', 'Tugas Review Proposal Baru',
          `${student.name} mengajukan proposal (${payload.submissionType}) pada bidang ${payload.field}.`,
          'tulis-review', 'review-list', thesisId);
        notifications = pushNotification(notifications, 'mahasiswa', 'Bukti pengajuan proposal',
          `${receipt.title}. Pembimbing: ${[receipt.advisor1Name, receipt.advisor2Name].filter(Boolean).join(' dan ')}. ` +
          `${receipt.semester}, ${formatDateTimeId(uploadedAt)}. ${file.name} (${formatFileSize(file.size)}).`,
          'download-proposal', undefined, thesisId);

        const otherTheses = prev.theses.filter((item) => item.id !== thesisId);
        return {
          ...prev,
          theses: [updated, ...otherTheses.map((item) =>
            item.studentId === student.id && !item.isArchived ? { ...item, isArchived: true } : item)],
          topics: topicId ? prev.topics.map((item) => item.id === topicId && item.takenCount < item.quota
            ? { ...item, status: 'Tersedia' as const } : item) : prev.topics,
          pendingTopic: null,
          notifications,
        };
      });
      showToast('Proposal berhasil diunggah.');
      return receipt;
    } catch (error) {
      if (blobStored) await deleteFileBlob(fileId);
      throw error;
    } finally {
      proposalUploadPending.current = false;
    }
  };

  const uploadRevision = async (
    thesisId: string, summary: string, file: File, details?: RevisionDetails,
  ) => {
    const validate = (current: PersistedState) => {
      const student = current.accounts.mahasiswa;
      const thesis = current.theses.find((item) => item.id === thesisId && !item.isArchived);
      if (!thesis || thesis.studentId !== student.id || current.currentRole !== 'mahasiswa') {
        throw new Error('Proposal aktif mahasiswa tidak ditemukan.');
      }
      if (!needsRevision(thesis.status)) throw new Error('Proposal ini tidak sedang meminta revisi.');
      if (Date.parse(thesis.revisionDeadline ?? current.period.revisionDeadline) <= Date.now()) {
        throw new Error('Batas waktu unggah revisi telah berakhir.');
      }
      if (!summary.trim()) throw new Error('Isi ringkasan perubahan revisi terlebih dahulu.');
      const saved = getRevisionDetails(thesis);
      const edited = details ?? saved;
      if (!edited.title.trim()) throw new Error('Isi judul tugas akhir terlebih dahulu.');
      if (saved.submissionType === 'Perpanjangan') {
        if (edited.submissionType !== saved.submissionType || edited.title.trim() !== saved.title ||
            edited.advisor1Id !== saved.advisor1Id || edited.advisor2Id !== saved.advisor2Id) {
          throw new Error('Jenis pengajuan, judul dan pembimbing perpanjangan sudah dikunci.');
        }
      } else {
        const error = getAdvisorQuotaError(edited.advisor1Id, edited.advisor2Id, current.lecturers,
          current.theses, student, current.period, current.maxQuotas);
        if (error) throw new Error(error);
      }
      return { thesis, edited, student };
    };

    validate(latestState.current);
    const fileError = await validateStudentPdf(file);
    if (fileError) throw new Error(fileError);
    const fileId = `rev-${crypto.randomUUID()}`;
    await saveFileBlob(fileId, file);
    try {
      const current = latestState.current;
      const { thesis, edited, student } = validate(current);
      const qrToken = nextRevisionToken(current.theses, thesis);
      const version = thesis.submissions.filter((submission) => submission.kind === 'revisi').length + 1;
      const uploadedAt = new Date().toISOString();
      const revision: SubmissionFile = {
        id: fileId, kind: 'revisi', versionLabel: `Revisi v${version}.0`,
        fileName: file.name, fileSize: file.size, uploadedAt, uploadedBy: student.name,
        summary: summary.trim(), hasRealBlob: true, revisionQrToken: qrToken,
      };

      flushSync(() => setState((prev) => {
        const title = edited.title.trim();
        const theses = prev.theses.map((item): ThesisRecord => item.id === thesisId ? {
          ...item, submissionType: edited.submissionType,
          newTitle: title === item.title ? undefined : title,
          advisor1Id: edited.advisor1Id, advisor2Id: edited.advisor2Id,
          proposedAdvisor1Id: edited.advisor1Id, proposedAdvisor2Id: edited.advisor2Id,
          stage: 'Revisi Proposal', status: 'Menunggu Verifikasi', revisionQrToken: qrToken,
          updatedAt: uploadedAt, submissions: [revision, ...item.submissions],
        } : item);
        let notifications = pushNotification(prev.notifications, 'dosen',
          `Permintaan Persetujuan Revisi (QR): ${student.name}`,
          `${student.name} (${student.identifier}) mengunggah ${revision.versionLabel} dengan token QR ${qrToken}.`,
          'tulis-review', 'qr-approval', thesisId);
        notifications = pushNotification(notifications, 'kaprodi',
          `Revisi Siap Verifikasi QR: ${student.name}`,
          `${student.name} mengunggah berkas revisi dengan token QR ${qrToken}.`,
          'plotting-reviewer', 'qr-approval', thesisId);
        return { ...prev, theses, notifications };
      }));
    } catch (error) {
      await deleteFileBlob(fileId);
      throw error;
    }
    showToast('Berkas revisi berhasil diunggah dan token QR telah diterbitkan');
  };

  const submitDosenEvaluation = async (
    thesisId: string,
    decision: AcademicStatus,
    notes: string,
    correctionFile?: File | null,
  ) => {
    const dosen = state.accounts.dosen;
    let uploadedCorrection: SubmissionFile | undefined;

    if (correctionFile) {
      const fileId = `kor-${Date.now()}`;
      await saveFileBlob(fileId, correctionFile);
      uploadedCorrection = {
        id: fileId,
        kind: 'koreksi',
        versionLabel: 'Catatan Koreksi Dosen',
        fileName: correctionFile.name,
        fileSize: correctionFile.size,
        uploadedAt: new Date().toISOString(),
        uploadedBy: dosen.name,
        summary: notes,
        hasRealBlob: true,
      };
    }

    setState((prev) => {
      const target = prev.theses.find((t) => t.id === thesisId);
      if (!target) return prev;

      const evaluatorRole =
        target.advisor1Id === dosen.id
          ? 'Pembimbing 1'
          : target.advisor2Id === dosen.id
            ? 'Pembimbing 2'
            : 'Penguji 1';

      const newEval: EvaluationRecord = {
        id: `eval-${Date.now()}`,
        evaluatorId: dosen.id,
        evaluatorName: dosen.name,
        evaluatorRole,
        stage: target.stage,
        status: decision,
        notes,
        evaluatedAt: new Date().toISOString(),
        correctionFile: uploadedCorrection,
      };

      const nextStage =
        decision === 'Diterima' && target.stage === 'Revisi Proposal'
          ? ('Pengesahan Akhir' as const)
          : decision === 'Perlu Revisi' && target.stage === 'Sidang Proposal'
            ? ('Revisi Proposal' as const)
            : target.stage;

      const updatedTheses = prev.theses.map((item) =>
        item.id === thesisId
          ? {
              ...item,
              status: decision,
              stage: nextStage,
              updatedAt: new Date().toISOString(),
              evaluations: [newEval, ...item.evaluations],
              submissions: uploadedCorrection
                ? [uploadedCorrection, ...item.submissions]
                : item.submissions,
            }
          : item,
      );

      const notifs = pushNotification(
        prev.notifications,
        'mahasiswa',
        `Pembaruan Evaluasi: ${decision}`,
        `${dosen.name} memberikan status "${decision}" pada berkas Anda.`,
        decision === 'Perlu Revisi' ? 'upload-revisi' : 'hasil-sidang',
      );

      return {
        ...prev,
        theses: updatedTheses,
        notifications: notifs,
      };
    });

    showToast('Catatan review dan evaluasi berhasil disimpan');
  };

  const approveRevisionByQr = (
    qrTokenOrThesisId: string,
    decision: 'Diterima' | 'Ditolak',
    notes: string,
  ): boolean => {
    const clean = qrTokenOrThesisId.trim().toLowerCase();
    const target = state.theses.find(
      (t) =>
        t.id.toLowerCase() === clean ||
        (t.revisionQrToken && t.revisionQrToken.toLowerCase() === clean),
    );
    if (!target) {
      showToast('Token QR revisi tidak ditemukan pada sistem.', 'error');
      return false;
    }

    const actor = currentUser ?? state.accounts.dosen;
    const statusFinal: AcademicStatus = decision === 'Diterima' ? 'Diterima' : 'Perlu Revisi';
    const evaluatorRole =
      actor.role === 'kaprodi'
        ? 'Kaprodi'
        : target.advisor1Id === actor.id
          ? 'Pembimbing 1'
          : 'Penguji 1';

    setState((prev) => {
      const evalRecord: EvaluationRecord = {
        id: `eval-qr-${Date.now()}`,
        evaluatorId: actor.id,
        evaluatorName: actor.name,
        evaluatorRole,
        stage: 'Revisi Proposal',
        status: statusFinal,
        notes: `${notes} (Verifikasi QR: ${target.revisionQrToken ?? target.id})`,
        evaluatedAt: new Date().toISOString(),
      };

      const updatedTheses = prev.theses.map((item) =>
        item.id === target.id
          ? {
              ...item,
              status: statusFinal,
              stage:
                decision === 'Diterima'
                  ? ('Pengesahan Akhir' as const)
                  : ('Revisi Proposal' as const),
              updatedAt: new Date().toISOString(),
              evaluations: [evalRecord, ...item.evaluations],
            }
          : item,
      );

      const notifs = pushNotification(
        prev.notifications,
        'mahasiswa',
        `Verifikasi QR Revisi: ${decision === 'Diterima' ? 'Disetujui' : 'Ditolak'}`,
        `${actor.name} memverifikasi revisi melalui QR Code dengan status "${statusFinal}".`,
        decision === 'Diterima' ? 'hasil-sidang' : 'upload-revisi',
      );

      return {
        ...prev,
        theses: updatedTheses,
        notifications: notifs,
      };
    });

    showToast(
      decision === 'Diterima'
        ? `Revisi ${target.studentName} disetujui melalui QR Code`
        : `Revisi ${target.studentName} ditolak dan dikembalikan untuk perbaikan`,
    );
    return true;
  };

  const submitDefenseScore = (
    thesisId: string,
    rubric: Omit<DefenseRubricScore, 'totalScore' | 'grade'>,
    decision: AcademicStatus,
    notes: string,
  ) => {
    const dosen = state.accounts.dosen;
    const totalScore = Number(
      (
        rubric.perumusanMasalah * 0.25 +
        rubric.tinjauanPustaka * 0.2 +
        rubric.metodologi * 0.35 +
        rubric.presentasiTanyaJawab * 0.2
      ).toFixed(1),
    );
    const grade = computeGrade(totalScore);

    setState((prev) => {
      const target = prev.theses.find((t) => t.id === thesisId);
      if (!target) return prev;

      const evalRecord: EvaluationRecord = {
        id: `eval-def-${Date.now()}`,
        evaluatorId: dosen.id,
        evaluatorName: dosen.name,
        evaluatorRole:
          target.defenseSchedule?.examiner2Id === dosen.id ? 'Penguji 2' : 'Penguji 1',
        stage: 'Sidang Proposal',
        status: decision,
        notes,
        evaluatedAt: new Date().toISOString(),
        score: totalScore,
      };

      const needsRevision =
        decision === 'Perlu Revisi' ||
        decision === 'Diperbaiki' ||
        decision === 'Perbaikan Bersyarat';

      const nextStage = needsRevision
        ? ('Revisi Proposal' as const)
        : decision === 'Diterima'
          ? ('Pengesahan Akhir' as const)
          : ('Sidang Proposal' as const);

      const updatedTheses = prev.theses.map((item) =>
        item.id === thesisId
          ? {
              ...item,
              stage: nextStage,
              status: decision,
              defenseScore: { ...rubric, totalScore, grade },
              revisionDeadline: needsRevision ? prev.period.revisionDeadline : item.revisionDeadline,
              updatedAt: new Date().toISOString(),
              evaluations: [evalRecord, ...item.evaluations],
            }
          : item,
      );

      const notifs = pushNotification(
        prev.notifications,
        'mahasiswa',
        'Hasil Sidang Proposal Telah Dirilis',
        `Nilai sidang: ${totalScore} (${grade}) dengan keputusan "${decision}".`,
        'hasil-sidang',
      );

      return {
        ...prev,
        theses: updatedTheses,
        notifications: notifs,
      };
    });

    showToast(`Hasil sidang proposal (${decision} — ${totalScore}) berhasil disimpan`);
  };

  const saveProposalReviewers = (thesisId: string, reviewerIds: string[]) => {
    const capped = reviewerIds.slice(0, 4);
    setState((prev) => {
      const target = prev.theses.find((t) => t.id === thesisId);
      if (!target) return prev;
      const updatedTheses = prev.theses.map((item) =>
        item.id === thesisId
          ? {
              ...item,
              proposalReviewers: capped,
              status: 'Diterima' as const,
              updatedAt: new Date().toISOString(),
            }
          : item,
      );

      let notifs = pushNotification(
        prev.notifications,
        'dosen',
        `Penugasan Reviewer Proposal: ${target.studentName}`,
        `Kaprodi menetapkan Anda pada tim reviewer proposal (${capped.length} dosen).`,
        'tulis-review',
        'review-list',
        thesisId,
      );
      notifs = pushNotification(
        notifs,
        'mahasiswa',
        'Tim Reviewer Proposal Telah Ditetapkan',
        `Proposal Anda telah di-plot kepada ${capped.length} dosen reviewer dan siap dijadwalkan sidang.`,
        'dashboard',
      );

      return {
        ...prev,
        theses: updatedTheses,
        notifications: notifs,
      };
    });
    showToast('Plotting reviewer proposal berhasil disimpan');
  };

  const saveTaExaminers = (thesisId: string, examinerIds: string[]): boolean => {
    const target = state.theses.find((t) => t.id === thesisId);
    if (!target) return false;

    const capped = examinerIds.slice(0, 4);
    if (target.proposalReviewers.length >= 2) {
      const overlapCount = capped.filter((id) =>
        target.proposalReviewers.includes(id),
      ).length;
      if (overlapCount < 2) {
        showToast(
          'Minimal 2 dosen penguji TA wajib berasal dari tim reviewer proposal mahasiswa ini.',
          'error',
        );
        return false;
      }
    }

    setState((prev) => ({
      ...prev,
      theses: prev.theses.map((item) =>
        item.id === thesisId
          ? { ...item, taExaminers: capped, updatedAt: new Date().toISOString() }
          : item,
      ),
      notifications: pushNotification(
        prev.notifications,
        'dosen',
        `Penugasan Penguji Sidang TA: ${target.studentName}`,
        `Kaprodi menetapkan ${capped.length} dosen penguji TA (minimal 2 dari reviewer proposal).`,
        'sidang-proposal',
      ),
    }));
    showToast('Plotting penguji Tugas Akhir berhasil disimpan');
    return true;
  };

  const issueSkForThesis = (thesisId: string) => {
    setState((prev) => ({
      ...prev,
      theses: prev.theses.map((t) =>
        t.id === thesisId ? { ...t, skIssued: true, updatedAt: new Date().toISOString() } : t,
      ),
    }));
    showToast('Status penerbitan SK Tugas Akhir diperbarui');
  };

  const kaprodiScheduleDefense = (thesisId: string, schedule: DefenseSchedule) => {
    setState((prev) => {
      const target = prev.theses.find((t) => t.id === thesisId);
      if (!target) return prev;

      const updatedTheses = prev.theses.map((item) =>
        item.id === thesisId
          ? {
              ...item,
              stage: 'Sidang Proposal' as const,
              status: 'Menunggu Verifikasi' as const,
              defenseSchedule: schedule,
              updatedAt: new Date().toISOString(),
            }
          : item,
      );

      const [startTime = '09:00', endPart = '10:00 WIB'] = schedule.time.split(' - ');
      const endTime = endPart.replace(' WIB', '').trim();
      const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const parsedDate = new Date(schedule.date);
      const dayOfWeek = Number.isNaN(parsedDate.getTime())
        ? 'Terjadwal'
        : dayNames[parsedDate.getDay()];

      const newCalendarEntry: LecturerScheduleItem = {
        id: `sch-def-${Date.now()}`,
        dayOfWeek,
        date: schedule.date,
        startTime: startTime.trim(),
        endTime,
        title: `Sidang Proposal: ${target.studentName} (${target.studentNim})`,
        category: 'Sidang Terkonfirmasi',
        room: schedule.room,
        thesisId: target.id,
      };

      const filteredSchedules = prev.lecturerSchedules.filter(
        (s) => !(s.category === 'Sidang Terkonfirmasi' && s.thesisId === target.id),
      );

      let notifs = pushNotification(
        prev.notifications,
        'mahasiswa',
        'Jadwal Sidang Proposal Ditetapkan',
        `Sidang dijadwalkan pada ${schedule.date} pukul ${schedule.time} di ${schedule.room}.`,
        'dashboard',
      );
      notifs = pushNotification(
        notifs,
        'dosen',
        `Jadwal Sidang Terkonfirmasi: ${target.studentName}`,
        `Slot bebas bentrok pada ${schedule.date} pukul ${schedule.time} di ${schedule.room} telah masuk ke kalender Anda.`,
        'sidang-proposal',
        'input-hasil',
        target.id,
      );

      return {
        ...prev,
        theses: updatedTheses,
        lecturerSchedules: [...filteredSchedules, newCalendarEntry],
        notifications: notifs,
      };
    });

    showToast('Jadwal Sidang Proposal bebas bentrok diterbitkan dan disinkronkan ke kalender');
  };

  const updateMaxQuotaSetting = (
    department: string,
    maxPerPeriod: number,
    maxPerSemester: number,
  ) => {
    setState((prev) => ({
      ...prev,
      maxQuotas: prev.maxQuotas.map((q) =>
        q.department === department ? { ...q, maxPerPeriod, maxPerSemester } : q,
      ),
      lecturers:
        department === 'S1 Informatika'
          ? prev.lecturers.map((l) => ({ ...l, maxQuota: maxPerPeriod }))
          : prev.lecturers,
    }));
    showToast(`Batas maksimum bimbingan ${department} berhasil disimpan`);
  };

  const addTopicRecommendation = (
    topic: Pick<TopicRecommendation, 'title' | 'field' | 'quota' | 'description' | 'prerequisites'>,
  ) => {
    const dosen = state.accounts.dosen;
    const newTopic: TopicRecommendation = {
      id: `top-${Date.now()}`,
      title: topic.title,
      field: topic.field,
      lecturerId: dosen.id,
      lecturerName: dosen.name,
      quota: topic.quota,
      takenCount: 0,
      status: 'Tersedia',
      description: topic.description,
      prerequisites: topic.prerequisites,
      createdAt: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      topics: [newTopic, ...prev.topics],
      notifications: pushNotification(
        prev.notifications,
        'mahasiswa',
        'Rekomendasi Topik Baru Tersedia',
        `${dosen.name} menambahkan topik: ${topic.title}`,
        'rekomendasi-judul',
      ),
    }));
    showToast('Rekomendasi judul proposal berhasil ditambahkan');
  };

  const setTopicStatus = (
    topicId: string,
    status: TopicRecommendation['status'],
    reservedByName?: string,
  ) => {
    setState((prev) => ({
      ...prev,
      pendingTopic: prev.pendingTopic?.topicId === topicId ? null : prev.pendingTopic,
      topics: (prev.pendingTopic?.topicId === topicId ? releaseDraftTopic(prev) : prev.topics).map((t) =>
        t.id === topicId
          ? {
              ...t,
              status,
              reservedByNim: status === 'Reserved' && !reservedByName ? t.reservedByNim : undefined,
              reservedByName:
                status === 'Reserved'
                  ? reservedByName?.trim() || t.reservedByName || 'Mahasiswa Terdaftar'
                  : undefined,
            }
          : t,
      ),
    }));
    showToast(`Status topik diperbarui menjadi ${status}`);
  };

  const deleteTopicRecommendation = (topicId: string) => {
    setState((prev) => ({
      ...prev,
      topics: prev.topics.filter((t) => t.id !== topicId),
      pendingTopic: prev.pendingTopic?.topicId === topicId ? null : prev.pendingTopic,
    }));
    showToast('Topik rekomendasi telah dihapus');
  };

  const claimTopicForProposal = (topic: TopicRecommendation) => {
    const student = state.accounts.mahasiswa;
    if (state.currentRole !== 'mahasiswa') return;
    if (Date.parse(getProposalDeadline(state.accounts.mahasiswa, state.period)) <= Date.now()) {
      showToast('Batas waktu pengajuan proposal telah berakhir.', 'error');
      return;
    }
    if (preselectedTopic?.id === topic.id) {
      setActiveTab('upload-proposal');
      return;
    }
    const selected = state.topics.find((item) => item.id === topic.id);
    if (!selected || selected.status !== 'Tersedia' || selected.takenCount >= selected.quota ||
        selected.reservedByNim === student.identifier) {
      showToast('Topik sudah tidak tersedia.', 'error');
      return;
    }
    const advisorError = getAdvisorQuotaError(selected.lecturerId, '', state.lecturers, state.theses,
      student, state.period, state.maxQuotas);
    if (advisorError) {
      showToast(advisorError, 'error');
      return;
    }
    setState((prev) => ({
      ...prev,
      activeTab: 'upload-proposal', activeSubTab: null, focusedThesisId: null,
      topics: releaseDraftTopic(prev).map((item) => item.id === topic.id ? {
        ...item, takenCount: item.takenCount + 1, status: 'Reserved',
        reservedByName: student.name, reservedByNim: student.identifier,
      } : item),
      pendingTopic: { topicId: selected.id, studentId: student.id,
        previousName: selected.reservedByName, previousNim: selected.reservedByNim },
    }));
  };

  const clearPreselectedTopic = () => {
    setState((prev) => prev.currentRole === 'mahasiswa' && prev.pendingTopic?.studentId === prev.accounts.mahasiswa.id
      ? { ...prev, topics: releaseDraftTopic(prev), pendingTopic: null }
      : prev);
  };

  const reviewDoctoralLog = (
    studentId: string,
    logId: string,
    status: 'Disetujui' | 'Perlu Revisi',
    promoterNote: string,
  ) => {
    setState((prev) => ({
      ...prev,
      doctoralStudents: prev.doctoralStudents.map((s) =>
        s.id === studentId
          ? {
              ...s,
              updatedAt: new Date().toISOString(),
              logBooks: s.logBooks.map((log) =>
                log.id === logId ? { ...log, status, promoterNote } : log,
              ),
            }
          : s,
      ),
    }));
    showToast(`Catatan log book riset S3 disimpan (${status})`);
  };

  const addDoctoralLogNote = (studentId: string, topic: string, progressSummary: string) => {
    setState((prev) => ({
      ...prev,
      doctoralStudents: prev.doctoralStudents.map((s) =>
        s.id === studentId
          ? {
              ...s,
              updatedAt: new Date().toISOString(),
              logBooks: [
                {
                  id: `log-s3-${Date.now()}`,
                  date: new Date().toISOString().slice(0, 10),
                  topic,
                  progressSummary,
                  status: 'Disetujui',
                  promoterNote: 'Dicatat oleh Promotor / Ko-Promotor.',
                },
                ...s.logBooks,
              ],
            }
          : s,
      ),
    }));
    showToast('Entri log book bimbingan S3 berhasil ditambahkan');
  };

  const addDoctoralPublication = (
    studentId: string,
    publication: Omit<DoctoralPublication, 'id'>,
  ) => {
    setState((prev) => ({
      ...prev,
      doctoralStudents: prev.doctoralStudents.map((s) =>
        s.id === studentId
          ? {
              ...s,
              updatedAt: new Date().toISOString(),
              publications: [
                { ...publication, id: `pub-s3-${Date.now()}` },
                ...s.publications,
              ],
            }
          : s,
      ),
    }));
    showToast('Luaran publikasi ilmiah S3 berhasil ditambahkan');
  };

  const advanceDoctoralStage = (studentId: string, nextStage: DoctoralStage, notes: string) => {
    setState((prev) => ({
      ...prev,
      doctoralStudents: prev.doctoralStudents.map((s) =>
        s.id === studentId
          ? {
              ...s,
              currentStage: nextStage,
              stageStatus: 'Diterima',
              updatedAt: new Date().toISOString(),
              logBooks: [
                {
                  id: `log-stage-${Date.now()}`,
                  date: new Date().toISOString().slice(0, 10),
                  topic: `Pengesahan Tahap Menuju ${nextStage}`,
                  progressSummary: notes,
                  status: 'Disetujui',
                  promoterNote: `Tahap diperbarui ke ${nextStage}.`,
                },
                ...s.logBooks,
              ],
            }
          : s,
      ),
    }));
    showToast(`Tahap sidang doktoral diperbarui ke ${nextStage}`);
  };

  const addLecturerScheduleBlock = (item: Omit<LecturerScheduleItem, 'id'>) => {
    const newItem: LecturerScheduleItem = {
      ...item,
      id: `sch-${Date.now()}`,
    };
    setState((prev) => ({
      ...prev,
      lecturerSchedules: [...prev.lecturerSchedules, newItem],
    }));
    showToast('Jadwal ketersediaan dosen berhasil diperbarui');
  };

  const markNotificationRead = (id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  };

  const markAllNotificationsRead = () => {
    if (!currentUser) return;
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        roleNotifications.some(visible => visible.id === n.id) ? { ...n, read: true } : n,
      ),
    }));
  };

  const resetDemoData = () => {
    [
      'tuntas-proto-v2:persona',
      'tuntas-proto-v2:role',
      'tuntas-proto-v2:proposals',
      'tuntas-proto-v2:revisions',
      'tuntas-proto-v2:lecturers',
      'tuntas-proto-v2:quotas',
      'tuntas-proto-v2:andi:profile-name',
      'tuntas-proto-v2:andi:profile-email',
      'tuntas-proto-v2:budi:profile-name',
      'tuntas-proto-v2:budi:profile-email',
    ].forEach((key) => localStorage.removeItem(key));
    const fresh = buildInitialState();
    setState((prev) => ({ ...fresh, currentRole: prev.currentRole }));
    showToast('Data simulasi berhasil dikembalikan ke kondisi awal');
  };

  const value: PortalContextValue = {
    currentUser,
    activeTab: state.activeTab,
    activeSubTab: state.activeSubTab,
    focusedThesisId: state.focusedThesisId,
    setActiveTab,
    navigateWithContext,
    clearFocus,
    lecturers: state.lecturers,
    theses: currentUser?.role === 'mahasiswa' ? state.theses : state.theses.filter(item => !item.isArchived),
    studentThesis,
    topics: state.topics,
    archive: state.archive,
    templates: state.templates,
    notifications: roleNotifications,
    unreadCount,
    period: currentUser?.role === 'mahasiswa'
      ? { ...state.period, proposalDeadline: getProposalDeadline(currentUser, state.period) }
      : state.period,
    maxQuotas: state.maxQuotas,
    baaRoomSlots: state.baaRoomSlots,
    doctoralStudents: state.doctoralStudents,
    lecturerSchedules: state.lecturerSchedules,
    preselectedTopic,
    clearPreselectedTopic,
    previewFile,
    openFilePreview: (payload) => setPreviewFile(payload),
    closeFilePreview: () => setPreviewFile(null),
    toast,
    showToast,
    dismissToast,
    login,
    loginAsRole,
    switchRole,
    logout,
    updateProfile,
    toggleDosenStructuralRole,
    uploadProposal,
    uploadRevision,
    submitDosenEvaluation,
    approveRevisionByQr,
    submitDefenseScore,
    saveProposalReviewers,
    saveTaExaminers,
    issueSkForThesis,
    kaprodiScheduleDefense,
    updateMaxQuotaSetting,
    addTopicRecommendation,
    setTopicStatus,
    deleteTopicRecommendation,
    claimTopicForProposal,
    reviewDoctoralLog,
    addDoctoralLogNote,
    addDoctoralPublication,
    advanceDoctoralStage,
    addLecturerScheduleBlock,
    markNotificationRead,
    markAllNotificationsRead,
    resetDemoData,
  };

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
};

export function usePortal(): PortalContextValue {
  const ctx = useContext(PortalContext);
  if (!ctx) {
    throw new Error('usePortal harus digunakan di dalam PortalProvider');
  }
  return ctx;
}
