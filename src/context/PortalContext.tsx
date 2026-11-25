import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  SEED_ACCOUNTS,
  SEED_ARCHIVE,
  SEED_LECTURERS,
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
  DefenseRubricScore,
  DefenseSchedule,
  EvaluationRecord,
  LecturerProfile,
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

const STORAGE_KEY = 'istts_portal_ta_state_v1';

interface PersistedState {
  accounts: Record<UserRole, UserAccount>;
  currentRole: UserRole | null;
  activeTab: string;
  lecturers: LecturerProfile[];
  theses: ThesisRecord[];
  topics: TopicRecommendation[];
  archive: ArchiveEntry[];
  templates: OfficialTemplate[];
  notifications: NotificationItem[];
  period: AcademicPeriod;
}

function buildInitialState(): PersistedState {
  return {
    accounts: SEED_ACCOUNTS,
    currentRole: null,
    activeTab: 'dashboard',
    lecturers: SEED_LECTURERS,
    theses: SEED_THESES,
    topics: SEED_TOPICS,
    archive: SEED_ARCHIVE,
    templates: SEED_TEMPLATES,
    notifications: SEED_NOTIFICATIONS,
    period: SEED_PERIOD,
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
      lecturers: parsed.lecturers ?? fallback.lecturers,
      theses: parsed.theses ?? fallback.theses,
      topics: parsed.topics ?? fallback.topics,
      archive: parsed.archive ?? fallback.archive,
      templates: parsed.templates ?? fallback.templates,
      notifications: parsed.notifications ?? fallback.notifications,
      period: parsed.period ?? fallback.period,
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
  setActiveTab: (tab: string) => void;
  lecturers: LecturerProfile[];
  theses: ThesisRecord[];
  studentThesis: ThesisRecord | undefined;
  topics: TopicRecommendation[];
  archive: ArchiveEntry[];
  templates: OfficialTemplate[];
  notifications: NotificationItem[];
  unreadCount: number;
  period: AcademicPeriod;
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
  uploadProposal: (payload: ProposalUploadPayload, file: File) => Promise<void>;
  uploadRevision: (thesisId: string, summary: string, file: File) => Promise<void>;
  submitDosenEvaluation: (
    thesisId: string,
    decision: AcademicStatus,
    notes: string,
    correctionFile?: File | null,
  ) => Promise<void>;
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
  toggleTopicStatus: (topicId: string) => void;
  deleteTopicRecommendation: (topicId: string) => void;
  claimTopicForProposal: (topic: TopicRecommendation) => void;
  updateAcademicPeriod: (nextPeriod: AcademicPeriod) => void;
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
  ): NotificationItem[] => [
    {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      targetRole,
      title,
      message,
      createdAt: new Date().toISOString(),
      read: false,
      targetTab,
    },
    ...prev,
  ];

  const setActiveTab = (tab: string) => {
    setState((prev) => ({ ...prev, activeTab: tab }));
  };

  const login = (identifierInput: string): boolean => {
    const clean = identifierInput.trim().toLowerCase();
    const matched = (Object.values(state.accounts) as UserAccount[]).find(
      (acc) =>
        acc.identifier.toLowerCase() === clean ||
        acc.email.toLowerCase() === clean ||
        acc.role === clean,
    );
    if (!matched) {
      return false;
    }
    setState((prev) => ({ ...prev, currentRole: matched.role, activeTab: 'dashboard' }));
    showToast(`Berhasil masuk sebagai ${matched.name}`);
    return true;
  };

  const loginAsRole = (role: UserRole) => {
    const acc = state.accounts[role];
    setState((prev) => ({ ...prev, currentRole: role, activeTab: 'dashboard' }));
    showToast(`Masuk ke portal sebagai ${acc.name}`);
  };

  const switchRole = (role: UserRole) => {
    const acc = state.accounts[role];
    setState((prev) => ({ ...prev, currentRole: role, activeTab: 'dashboard' }));
    showToast(`Peran aktif dialihkan ke ${acc.name}`);
  };

  const logout = () => {
    setState((prev) => ({ ...prev, currentRole: null, activeTab: 'dashboard' }));
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

  const uploadProposal = async (payload: ProposalUploadPayload, file: File) => {
    const mhs = state.accounts.mahasiswa;
    const fileId = `sub-${Date.now()}`;
    await saveFileBlob(fileId, file);

    const existing = state.theses.find((t) => t.studentId === mhs.id);
    const versionNum = existing
      ? existing.submissions.filter((s) => s.kind === 'proposal').length + 1
      : 1;

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
          id: `ta-${Date.now()}`,
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
        'Usulan Pembimbing Proposal',
        `${mhs.name} mengajukan proposal pada bidang ${payload.field}.`,
        'mahasiswa-bimbingan',
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
      };

      const updatedTheses = prev.theses.map((item) =>
        item.id === thesisId
          ? {
              ...item,
              stage: 'Revisi Proposal' as const,
              status: 'Menunggu Verifikasi' as const,
              updatedAt: new Date().toISOString(),
              submissions: [newSub, ...item.submissions],
            }
          : item,
      );

      const notifs = pushNotification(
        prev.notifications,
        'dosen',
        'Berkas Revisi Diunggah Mahasiswa',
        `${mhs.name} (${mhs.identifier}) telah mengunggah berkas revisi ${newSub.versionLabel}.`,
        'mahasiswa-bimbingan',
      );

      return {
        ...prev,
        theses: updatedTheses,
        notifications: notifs,
      };
    });

    showToast('Berkas revisi berhasil diunggah dan menunggu verifikasi dosen');
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

    showToast('Evaluasi bimbingan berhasil disimpan');
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

      const nextStage =
        decision === 'Perlu Revisi'
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
              revisionDeadline:
                decision === 'Perlu Revisi' ? prev.period.revisionDeadline : item.revisionDeadline,
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
        'Nilai Sidang Proposal Diinput',
        `${dosen.name} menginput nilai sidang untuk ${target.studentName} (${totalScore}).`,
        'monitoring-ta',
      );

      return {
        ...prev,
        theses: updatedTheses,
        notifications: notifs,
      };
    });

    showToast(`Nilai sidang proposal (${totalScore} / ${grade}) berhasil disimpan`);
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
          'mahasiswa-bimbingan',
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
        'sidang-penilaian',
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
    showToast('Rekomendasi judul berhasil ditambahkan');
  };

  const toggleTopicStatus = (topicId: string) => {
    setState((prev) => ({
      ...prev,
      topics: prev.topics.map((t) =>
        t.id === topicId
          ? { ...t, status: t.status === 'Tersedia' ? 'Penuh' : 'Tersedia' }
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
    setPreselectedTopic(topic);
    setState((prev) => ({ ...prev, activeTab: 'upload-proposal' }));
    showToast('Topik dipilih dan diisikan ke formulir Upload Proposal');
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
    setActiveTab,
    lecturers: state.lecturers,
    theses: state.theses,
    studentThesis,
    topics: state.topics,
    archive: state.archive,
    templates: state.templates,
    notifications: roleNotifications,
    unreadCount,
    period: state.period,
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
    uploadProposal,
    uploadRevision,
    submitDosenEvaluation,
    submitDefenseScore,
    kaprodiVerifyProposal,
    kaprodiScheduleDefense,
    addTopicRecommendation,
    toggleTopicStatus,
    deleteTopicRecommendation,
    claimTopicForProposal,
    updateAcademicPeriod,
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
