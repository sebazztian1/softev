import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  SEED_ACCOUNTS,
  SEED_ARCHIVE,
  SEED_DOCTORAL_STUDENTS,
  SEED_LECTURERS,
  SEED_LECTURER_SCHEDULES,
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
  CandidateDefenseSlot,
  DefenseRubricScore,
  DefenseSchedule,
  DoctoralStage,
  DoctoralStudentRecord,
  DosenStructuralRole,
  EvaluationRecord,
  LecturerProfile,
  LecturerScheduleItem,
  NotificationItem,
  OfficialTemplate,
  PreviewFilePayload,
  SubmissionFile,
  ThesisRecord,
  TopicRecommendation,
  UserAccount,
  UserRole,
} from '../types/portal';
import { saveFileBlob } from '../utils/fileStorage';
import { getLecturerName } from '../utils/format';

const STORAGE_KEY = 'istts_portal_ta_state_v2';

interface PersistedState {
  accounts: Record<UserRole, UserAccount>;
  currentRole: UserRole | null;
  activeTab: string;
  activeSubTab: string | null;
  focusedThesisId: string | null;
  lecturers: LecturerProfile[];
  theses: ThesisRecord[];
  topics: TopicRecommendation[];
  archive: ArchiveEntry[];
  templates: OfficialTemplate[];
  notifications: NotificationItem[];
  period: AcademicPeriod;
  doctoralStudents: DoctoralStudentRecord[];
  lecturerSchedules: LecturerScheduleItem[];
}

function buildInitialState(): PersistedState {
  return {
    accounts: SEED_ACCOUNTS,
    currentRole: null,
    activeTab: 'dashboard',
    activeSubTab: null,
    focusedThesisId: null,
    lecturers: SEED_LECTURERS,
    theses: SEED_THESES,
    topics: SEED_TOPICS,
    archive: SEED_ARCHIVE,
    templates: SEED_TEMPLATES,
    notifications: SEED_NOTIFICATIONS,
    period: SEED_PERIOD,
    doctoralStudents: SEED_DOCTORAL_STUDENTS,
    lecturerSchedules: SEED_LECTURER_SCHEDULES,
  };
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildInitialState();
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    const fallback = buildInitialState();
    return {
      accounts: parsed.accounts ?? fallback.accounts,
      currentRole: parsed.currentRole ?? null,
      activeTab: parsed.activeTab ?? 'dashboard',
      activeSubTab: parsed.activeSubTab ?? null,
      focusedThesisId: parsed.focusedThesisId ?? null,
      lecturers: parsed.lecturers ?? fallback.lecturers,
      theses: parsed.theses ?? fallback.theses,
      topics: parsed.topics ?? fallback.topics,
      archive: parsed.archive ?? fallback.archive,
      templates: parsed.templates ?? fallback.templates,
      notifications: parsed.notifications ?? fallback.notifications,
      period: parsed.period ?? fallback.period,
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
  title: string;
  field: string;
  abstract: string;
  proposedAdvisor1Id: string;
  proposedAdvisor2Id: string;
  summary: string;
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
  doctoralStudents: DoctoralStudentRecord[];
  lecturerSchedules: LecturerScheduleItem[];
  preselectedTopic: TopicRecommendation | null;
  setPreselectedTopic: (topic: TopicRecommendation | null) => void;
  previewFile: PreviewFilePayload | null;
  openFilePreview: (payload: PreviewFilePayload) => void;
  closeFilePreview: () => void;
  toast: ToastMessage | null;
  showToast: (message: string, type?: ToastMessage['type']) => void;
  dismissToast: () => void;
  login: (identifier: string) => boolean;
  loginAsRole: (role: UserRole) => void;
  switchRole: (role: UserRole) => void;
  logout: () => void;
  updateProfile: (updates: Pick<UserAccount, 'name' | 'email' | 'phone'>) => void;
  toggleDosenStructuralRole: (roleKey: DosenStructuralRole) => void;
  uploadProposal: (payload: ProposalUploadPayload, file: File) => Promise<void>;
  uploadRevision: (thesisId: string, summary: string, file: File) => Promise<void>;
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
  kaprodiVerifyProposal: (
    thesisId: string,
    decision: AcademicStatus,
    advisor1Id: string,
    advisor2Id: string,
    notes: string,
  ) => void;
  kaprodiScheduleDefense: (thesisId: string, schedule: DefenseSchedule) => void;
  addTopicRecommendation: (
    topic: Pick<TopicRecommendation, 'title' | 'field' | 'quota' | 'description' | 'prerequisites'>,
  ) => void;
  setTopicStatus: (
    topicId: string,
    status: TopicRecommendation['status'],
    reservedByName?: string,
  ) => void;
  toggleTopicStatus: (topicId: string) => void;
  deleteTopicRecommendation: (topicId: string) => void;
  claimTopicForProposal: (topic: TopicRecommendation) => void;
  updateAcademicPeriod: (nextPeriod: AcademicPeriod) => void;
  reviewDoctoralLog: (
    studentId: string,
    logId: string,
    status: 'Disetujui' | 'Perlu Revisi',
    promoterNote: string,
  ) => void;
  addDoctoralLogNote: (studentId: string, topic: string, progressSummary: string) => void;
  advanceDoctoralStage: (studentId: string, nextStage: DoctoralStage, notes: string) => void;
  addLecturerScheduleBlock: (item: Omit<LecturerScheduleItem, 'id'>) => void;
  confirmDefenseSlotFromSync: (
    thesisId: string,
    slot: CandidateDefenseSlot,
    examiner2Id: string,
  ) => void;
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
  const [preselectedTopic, setPreselectedTopic] = useState<TopicRecommendation | null>(null);
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

  const studentThesis = useMemo(() => {
    const mhs = state.accounts.mahasiswa;
    return state.theses.find((item) => item.studentId === mhs.id);
  }, [state.theses, state.accounts.mahasiswa]);

  const roleNotifications = useMemo(() => {
    if (!currentUser) return [];
    return state.notifications
      .filter((n) => n.targetRole === currentUser.role || n.targetRole === 'all')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [state.notifications, currentUser]);

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

  const login = (identifierInput: string): boolean => {
    const clean = identifierInput.trim().toLowerCase();
    const matched = (Object.values(state.accounts) as UserAccount[]).find(
      (acc) =>
        acc.username.toLowerCase() === clean ||
        acc.identifier.toLowerCase() === clean ||
        acc.email.toLowerCase() === clean ||
        acc.role === clean,
    );
    if (!matched) {
      return false;
    }
    setState((prev) => ({
      ...prev,
      currentRole: matched.role,
      activeTab: 'dashboard',
      activeSubTab: null,
      focusedThesisId: null,
    }));
    showToast(`Berhasil masuk sebagai ${matched.name}`);
    return true;
  };

  const loginAsRole = (role: UserRole) => {
    const acc = state.accounts[role];
    setState((prev) => ({
      ...prev,
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

  const updateProfile = (updates: Pick<UserAccount, 'name' | 'email' | 'phone'>) => {
    if (!state.currentRole) return;
    const role = state.currentRole;
    const parts = updates.name.trim().split(/\s+/);
    const initials =
      parts.length >= 2
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : updates.name.slice(0, 2).toUpperCase();

    setState((prev) => ({
      ...prev,
      accounts: {
        ...prev.accounts,
        [role]: {
          ...prev.accounts[role],
          name: updates.name.trim(),
          email: updates.email.trim(),
          phone: updates.phone.trim(),
          initials,
        },
      },
    }));
    showToast('Data profil berhasil diperbarui');
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

  const uploadProposal = async (payload: ProposalUploadPayload, file: File) => {
    const mhs = state.accounts.mahasiswa;
    const fileId = `sub-${Date.now()}`;
    await saveFileBlob(fileId, file);

    const existing = state.theses.find((t) => t.studentId === mhs.id);
    const versionNum = existing
      ? existing.submissions.filter((s) => s.kind === 'proposal').length + 1
      : 1;
    const targetThesisId = existing ? existing.id : `ta-${Date.now()}`;

    const newSubmission: SubmissionFile = {
      id: fileId,
      kind: 'proposal',
      versionLabel: `Proposal v${versionNum}.0`,
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: mhs.name,
      summary: payload.summary || 'Pengajuan proposal Tugas Akhir baru.',
      hasRealBlob: true,
      pdfTitle: `PROPOSAL TUGAS AKHIR - ${mhs.name.toUpperCase()}`,
      pdfLines: [
        `NIM: ${mhs.identifier}`,
        `Judul: ${payload.title}`,
        `Bidang: ${payload.field}`,
      ],
    };

    setState((prev) => {
      let updatedTheses: ThesisRecord[];
      if (existing) {
        updatedTheses = prev.theses.map((item) =>
          item.id === existing.id
            ? {
                ...item,
                title: payload.title,
                field: payload.field,
                abstract: payload.abstract,
                proposedAdvisor1Id: payload.proposedAdvisor1Id,
                proposedAdvisor2Id: payload.proposedAdvisor2Id,
                stage: 'Verifikasi Kaprodi',
                status: 'Menunggu Verifikasi',
                updatedAt: new Date().toISOString(),
                submissions: [newSubmission, ...item.submissions],
              }
            : item,
        );
      } else {
        const created: ThesisRecord = {
          id: targetThesisId,
          studentId: mhs.id,
          studentName: mhs.name,
          studentNim: mhs.identifier,
          programStudi: mhs.department,
          semester: prev.period.semesterLabel,
          title: payload.title,
          field: payload.field,
          abstract: payload.abstract,
          stage: 'Verifikasi Kaprodi',
          status: 'Menunggu Verifikasi',
          advisor1Id: '',
          advisor2Id: '',
          proposedAdvisor1Id: payload.proposedAdvisor1Id,
          proposedAdvisor2Id: payload.proposedAdvisor2Id,
          submissions: [newSubmission],
          evaluations: [],
          updatedAt: new Date().toISOString(),
        };
        updatedTheses = [created, ...prev.theses];
      }

      let notifs = pushNotification(
        prev.notifications,
        'kaprodi',
        'Pengajuan Proposal Baru',
        `${mhs.name} (${mhs.identifier}) mengunggah proposal Tugas Akhir untuk diverifikasi.`,
        'verifikasi-proposal',
      );
      notifs = pushNotification(
        notifs,
        'dosen',
        'Tugas Review Proposal Baru',
        `${mhs.name} mengajukan proposal pada bidang ${payload.field}.`,
        'tulis-review',
        'review-list',
        targetThesisId,
      );

      return {
        ...prev,
        theses: updatedTheses,
        notifications: notifs,
        activeTab: 'dashboard',
      };
    });

    setPreselectedTopic(null);
    showToast('Berkas proposal berhasil diunggah dan dikirim untuk verifikasi');
  };

  const uploadRevision = async (thesisId: string, summary: string, file: File) => {
    const mhs = state.accounts.mahasiswa;
    const fileId = `rev-${Date.now()}`;
    await saveFileBlob(fileId, file);

    setState((prev) => {
      const target = prev.theses.find((t) => t.id === thesisId);
      if (!target) return prev;
      const revCount = target.submissions.filter((s) => s.kind === 'revisi').length + 1;
      const qrToken = `ISTTS-REV-${target.studentNim}-V${revCount}`;
      const newSub: SubmissionFile = {
        id: fileId,
        kind: 'revisi',
        versionLabel: `Revisi v${revCount}.0`,
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        uploadedBy: mhs.name,
        summary,
        hasRealBlob: true,
        revisionQrToken: qrToken,
      };

      const updatedTheses = prev.theses.map((item) =>
        item.id === thesisId
          ? {
              ...item,
              stage: 'Revisi Proposal' as const,
              status: 'Menunggu Verifikasi' as const,
              revisionQrToken: qrToken,
              updatedAt: new Date().toISOString(),
              submissions: [newSub, ...item.submissions],
            }
          : item,
      );

      const notifs = pushNotification(
        prev.notifications,
        'dosen',
        `Permintaan Persetujuan Revisi (QR): ${mhs.name}`,
        `${mhs.name} (${mhs.identifier}) mengunggah ${newSub.versionLabel} dengan token QR ${qrToken}.`,
        'tulis-review',
        'qr-approval',
        thesisId,
      );

      return {
        ...prev,
        theses: updatedTheses,
        notifications: notifs,
      };
    });

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

      let notifs = pushNotification(
        prev.notifications,
        'mahasiswa',
        `Pembaruan Evaluasi: ${decision}`,
        `${dosen.name} memberikan status "${decision}" pada berkas Anda.`,
        decision === 'Perlu Revisi' ? 'upload-revisi' : 'hasil-sidang',
      );

      if (decision === 'Diterima') {
        notifs = pushNotification(
          notifs,
          'kaprodi',
          'Revisi Proposal Disetujui Pembimbing',
          `${target.studentName} (${target.studentNim}) telah mendapat persetujuan dosen.`,
          'monitoring-ta',
        );
      }

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

    const dosen = state.accounts.dosen;
    const statusFinal: AcademicStatus = decision === 'Diterima' ? 'Diterima' : 'Perlu Revisi';

    setState((prev) => {
      const evalRecord: EvaluationRecord = {
        id: `eval-qr-${Date.now()}`,
        evaluatorId: dosen.id,
        evaluatorName: dosen.name,
        evaluatorRole: target.advisor1Id === dosen.id ? 'Pembimbing 1' : 'Penguji 1',
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
        `${dosen.name} memverifikasi revisi melalui QR Code dengan status "${statusFinal}".`,
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

      let notifs = pushNotification(
        prev.notifications,
        'mahasiswa',
        'Hasil Sidang Proposal Telah Dirilis',
        `Nilai sidang: ${totalScore} (${grade}) dengan keputusan "${decision}".`,
        'hasil-sidang',
      );
      notifs = pushNotification(
        notifs,
        'kaprodi',
        'Hasil Sidang Proposal Diinput',
        `${dosen.name} menginput hasil sidang untuk ${target.studentName} (${decision}).`,
        'monitoring-ta',
      );

      return {
        ...prev,
        theses: updatedTheses,
        notifications: notifs,
      };
    });

    showToast(`Hasil sidang proposal (${decision} — ${totalScore}) berhasil disimpan`);
  };

  const kaprodiVerifyProposal = (
    thesisId: string,
    decision: AcademicStatus,
    advisor1Id: string,
    advisor2Id: string,
    notes: string,
  ) => {
    const kaprodi = state.accounts.kaprodi;
    setState((prev) => {
      const target = prev.theses.find((t) => t.id === thesisId);
      if (!target) return prev;

      const evalRecord: EvaluationRecord = {
        id: `eval-kap-${Date.now()}`,
        evaluatorId: kaprodi.id,
        evaluatorName: kaprodi.name,
        evaluatorRole: 'Kaprodi',
        stage: 'Verifikasi Kaprodi',
        status: decision,
        notes,
        evaluatedAt: new Date().toISOString(),
      };

      const updatedTheses = prev.theses.map((item) =>
        item.id === thesisId
          ? {
              ...item,
              status: decision,
              stage: 'Verifikasi Kaprodi' as const,
              advisor1Id: advisor1Id || item.advisor1Id,
              advisor2Id: advisor2Id || item.advisor2Id,
              updatedAt: new Date().toISOString(),
              evaluations: [evalRecord, ...item.evaluations],
            }
          : item,
      );

      let notifs = pushNotification(
        prev.notifications,
        'mahasiswa',
        `Verifikasi Proposal oleh Kaprodi: ${decision}`,
        notes,
        'dashboard',
      );

      if (decision === 'Diterima') {
        const adv1Name = getLecturerName(prev.lecturers, advisor1Id);
        notifs = pushNotification(
          notifs,
          'dosen',
          'Penugasan Dosen Pembimbing',
          `Anda ditetapkan pada pembimbingan Tugas Akhir ${target.studentName} (${adv1Name}).`,
          'tulis-review',
          'review-list',
          target.id,
        );
      }

      return {
        ...prev,
        theses: updatedTheses,
        notifications: notifs,
      };
    });

    showToast(`Keputusan verifikasi Kaprodi (${decision}) berhasil disimpan`);
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
        `Penjadwalan Penguji Sidang: ${target.studentName}`,
        `Jadwal sidang ${schedule.date} pukul ${schedule.time} di ${schedule.room}.`,
        'sidang-proposal',
        'input-hasil',
        target.id,
      );

      return {
        ...prev,
        theses: updatedTheses,
        notifications: notifs,
      };
    });

    showToast('Jadwal Sidang Proposal berhasil disimpan');
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
      topics: prev.topics.map((t) =>
        t.id === topicId
          ? {
              ...t,
              status,
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

  const toggleTopicStatus = (topicId: string) => {
    setState((prev) => ({
      ...prev,
      topics: prev.topics.map((t) =>
        t.id === topicId
          ? {
              ...t,
              status: t.status === 'Tersedia' ? 'Reserved' : t.status === 'Reserved' ? 'Penuh' : 'Tersedia',
            }
          : t,
      ),
    }));
    showToast('Status ketersediaan topik diperbarui');
  };

  const deleteTopicRecommendation = (topicId: string) => {
    setState((prev) => ({
      ...prev,
      topics: prev.topics.filter((t) => t.id !== topicId),
    }));
    showToast('Topik rekomendasi telah dihapus');
  };

  const claimTopicForProposal = (topic: TopicRecommendation) => {
    const mhs = state.accounts.mahasiswa;
    setState((prev) => ({
      ...prev,
      activeTab: 'upload-proposal',
      topics: prev.topics.map((t) => {
        if (t.id !== topic.id) return t;
        const nextTaken = Math.min(t.quota, t.takenCount + 1);
        return {
          ...t,
          takenCount: nextTaken,
          status: 'Reserved',
          reservedByName: mhs.name,
          reservedByNim: mhs.identifier,
        };
      }),
      notifications: pushNotification(
        prev.notifications,
        'dosen',
        'Topik Proposal Diambil (Reserved)',
        `${mhs.name} (${mhs.identifier}) mengambil topik "${topic.title}".`,
        'rekomendasi-judul',
      ),
    }));
    setPreselectedTopic(topic);
    showToast('Topik berstatus Reserved dan diisikan ke formulir Upload Proposal');
  };

  const updateAcademicPeriod = (nextPeriod: AcademicPeriod) => {
    setState((prev) => ({
      ...prev,
      period: nextPeriod,
      lecturers: prev.lecturers.map((l) => ({ ...l, maxQuota: nextPeriod.maxAdvisorQuota })),
      theses: prev.theses.map((t) =>
        t.stage === 'Revisi Proposal'
          ? { ...t, revisionDeadline: nextPeriod.revisionDeadline }
          : t,
      ),
    }));
    showToast('Pengaturan periode akademik berhasil disimpan');
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
                  promoterNote: 'Dicatat langsung oleh Promotor / Ko-Promotor.',
                },
                ...s.logBooks,
              ],
            }
          : s,
      ),
    }));
    showToast('Entri log book bimbingan S3 berhasil ditambahkan');
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
    showToast('Jadwal baru ditambahkan ke kalender dosen');
  };

  const confirmDefenseSlotFromSync = (
    thesisId: string,
    slot: CandidateDefenseSlot,
    examiner2Id: string,
  ) => {
    const dosen = state.accounts.dosen;
    setState((prev) => {
      const target = prev.theses.find((t) => t.id === thesisId);
      if (!target) return prev;

      const timeRange = `${slot.startTime} - ${slot.endTime} WIB`;
      const updatedTheses = prev.theses.map((item) =>
        item.id === thesisId
          ? {
              ...item,
              stage: 'Sidang Proposal' as const,
              status: 'Menunggu Verifikasi' as const,
              defenseSchedule: {
                date: slot.date,
                time: timeRange,
                room: slot.room,
                examiner1Id: dosen.id,
                examiner2Id,
              },
              updatedAt: new Date().toISOString(),
            }
          : item,
      );

      const newAgendaItem: LecturerScheduleItem = {
        id: `sch-def-${Date.now()}`,
        dayOfWeek: slot.dayOfWeek,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        title: `Sidang Proposal: ${target.studentName} (${target.studentNim})`,
        category: 'Sidang Terkonfirmasi',
        room: slot.room,
        thesisId: target.id,
      };

      let notifs = pushNotification(
        prev.notifications,
        'mahasiswa',
        'Jadwal Sidang Proposal Ditetapkan',
        `Sidang Anda dijadwalkan pada ${slot.dayOfWeek}, ${slot.date} pukul ${timeRange} di ${slot.room}.`,
        'dashboard',
      );
      notifs = pushNotification(
        notifs,
        'kaprodi',
        'Sinkronisasi Jadwal Sidang Terkonfirmasi',
        `${dosen.name} mengonfirmasi slot bebas bentrok untuk ${target.studentName} (${slot.date} ${slot.startTime}).`,
        'penjadwalan-sidang',
      );

      return {
        ...prev,
        theses: updatedTheses,
        lecturerSchedules: [...prev.lecturerSchedules, newAgendaItem],
        notifications: notifs,
      };
    });
    showToast('Slot sidang bebas bentrok berhasil dikonfirmasi ke agenda kalender');
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
        n.targetRole === currentUser.role || n.targetRole === 'all' ? { ...n, read: true } : n,
      ),
    }));
  };

  const resetDemoData = () => {
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
    theses: state.theses,
    studentThesis,
    topics: state.topics,
    archive: state.archive,
    templates: state.templates,
    notifications: roleNotifications,
    unreadCount,
    period: state.period,
    doctoralStudents: state.doctoralStudents,
    lecturerSchedules: state.lecturerSchedules,
    preselectedTopic,
    setPreselectedTopic,
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
    kaprodiVerifyProposal,
    kaprodiScheduleDefense,
    addTopicRecommendation,
    setTopicStatus,
    toggleTopicStatus,
    deleteTopicRecommendation,
    claimTopicForProposal,
    updateAcademicPeriod,
    reviewDoctoralLog,
    addDoctoralLogNote,
    advanceDoctoralStage,
    addLecturerScheduleBlock,
    confirmDefenseSlotFromSync,
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
