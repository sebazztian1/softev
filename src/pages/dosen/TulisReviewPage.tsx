import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, CheckCircle2, Download, Eye, FileCheck2, PenLine, QrCode, XCircle } from 'lucide-react';
import { AlertBanner } from '../../components/ui/AlertBanner';
import { EmptyState } from '../../components/ui/EmptyState';
import { FileDropzone } from '../../components/ui/FileDropzone';
import { Modal } from '../../components/ui/Modal';
import { QrCodeSvg } from '../../components/ui/QrCodeSvg';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { usePortal } from '../../context/PortalContext';
import { AcademicStatus, RevisionApprovalMethod, ThesisRecord } from '../../types/portal';
import { downloadPdfPayload, formatDateId, getLecturerName } from '../../utils/format';

export const TulisReviewPage: React.FC = () => {
  const {
    currentUser,
    theses,
    lecturers,
    activeSubTab,
    focusedThesisId,
    clearFocus,
    openFilePreview,
    submitDosenEvaluation,
    approveRevision,
    showToast,
  } = usePortal();

  const [tab, setTab] = useState<'review-list' | 'qr-approval'>('review-list');
  const [periodFilter, setPeriodFilter] = useState('Semua');
  const [statusFilter, setStatusFilter] = useState<'Semua' | AcademicStatus>('Semua');
  const [selected, setSelected] = useState<ThesisRecord | null>(null);
  const [decision, setDecision] = useState<AcademicStatus>('Perlu Revisi');
  const [notes, setNotes] = useState('');
  const [correctionFile, setCorrectionFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // Revision Approval state (TTD Dosen or optional QR replacement)
  const [approvalMethod, setApprovalMethod] = useState<RevisionApprovalMethod>('ttd-dosen');
  const [qrInput, setQrInput] = useState('');
  const [selectedRevisionId, setSelectedRevisionId] = useState<string | null>(null);
  const [revisionNotes, setRevisionNotes] = useState(
    'Revisi telah sesuai dengan catatan perbaikan sidang proposal.',
  );
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraMessage, setCameraMessage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const revisionTarget = useMemo(
    () => theses.find((t) => t.id === selectedRevisionId) ?? null,
    [theses, selectedRevisionId],
  );

  const handleStopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (activeSubTab === 'qr-approval') {
      setTab('qr-approval');
    } else if (activeSubTab === 'review-list') {
      setTab('review-list');
      handleStopCamera();
    }

    if (focusedThesisId) {
      const target = theses.find((t) => t.id === focusedThesisId);
      if (target) {
        if (activeSubTab === 'qr-approval') {
          setSelectedRevisionId(target.id);
          setQrInput(target.revisionQrToken ?? '');
          setApprovalMethod('ttd-dosen');
        } else {
          setSelected(target);
          setDecision(target.status === 'Diterima' ? 'Diterima' : 'Perlu Revisi');
          setNotes('');
        }
      }
      clearFocus();
    }
  }, [activeSubTab, focusedThesisId, theses, clearFocus]);

  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const periods = useMemo(
    () => ['Semua', ...Array.from(new Set(theses.map((t) => t.semester)))],
    [theses],
  );

  const supervised = useMemo(() => {
    if (!currentUser) return [];
    return theses.filter((item) => {
      const isRelated =
        item.advisor1Id === currentUser.id ||
        item.advisor2Id === currentUser.id ||
        item.proposedAdvisor1Id === currentUser.id ||
        item.defenseSchedule?.examiner1Id === currentUser.id;
      const matchesPeriod = periodFilter === 'Semua' || item.semester === periodFilter;
      const matchesStatus = statusFilter === 'Semua' || item.status === statusFilter;
      return isRelated && matchesPeriod && matchesStatus;
    });
  }, [theses, currentUser, periodFilter, statusFilter]);

  const revisionCandidates = useMemo(
    () => theses.filter((t) => t.stage === 'Revisi Proposal' || Boolean(t.revisionQrToken)),
    [theses],
  );

  const openEvaluationModal = (record: ThesisRecord) => {
    setSelected(record);
    setDecision(record.status === 'Diterima' ? 'Diterima' : 'Perlu Revisi');
    setNotes('');
    setCorrectionFile(null);
  };

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    if (!notes.trim()) {
      showToast('Catatan evaluasi review wajib diisi.', 'error');
      return;
    }
    setSaving(true);
    try {
      await submitDosenEvaluation(selected.id, decision, notes.trim(), correctionFile);
      setSelected(null);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectMethod = (method: RevisionApprovalMethod) => {
    setApprovalMethod(method);
    if (method === 'ttd-dosen') {
      handleStopCamera();
      setCameraMessage(null);
    }
  };

  const handleLookupQr = (tokenValue: string) => {
    const clean = tokenValue.trim().toLowerCase();
    if (!clean) {
      showToast('Masukkan atau pindai token QR revisi terlebih dahulu.', 'error');
      return;
    }
    const found = theses.find(
      (t) =>
        t.id.toLowerCase() === clean ||
        (t.revisionQrToken && t.revisionQrToken.toLowerCase() === clean),
    );
    if (!found) {
      showToast('Token QR tidak cocok dengan data revisi mahasiswa.', 'error');
      setSelectedRevisionId(null);
      return;
    }
    setApprovalMethod('qr-opsional');
    setQrInput(found.revisionQrToken ?? found.id);
    setSelectedRevisionId(found.id);
  };

  const handleStartCamera = async () => {
    setCameraMessage(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraMessage(
        'Kamera perangkat tidak tersedia pada browser ini. Gunakan daftar mahasiswa di samping atau masukkan token manual.',
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      setCameraActive(true);
      window.setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 50);
    } catch {
      setCameraMessage(
        'Izin kamera ditolak atau kamera tidak terdeteksi. Gunakan input token atau pilih mahasiswa dari daftar.',
      );
    }
  };

  const handleRevisionDecision = (choice: 'Diterima' | 'Ditolak') => {
    if (!revisionTarget) return;
    const defaultNote =
      choice === 'Diterima'
        ? approvalMethod === 'qr-opsional'
          ? 'Revisi disetujui melalui pemindaian QR Code (pengganti TTD dosen).'
          : 'Revisi disetujui langsung melalui TTD dosen.'
        : approvalMethod === 'qr-opsional'
          ? 'Revisi ditolak melalui verifikasi QR Code.'
          : 'Revisi ditolak dan dikembalikan untuk perbaikan.';

    const identifier =
      approvalMethod === 'qr-opsional'
        ? (revisionTarget.revisionQrToken ?? revisionTarget.id)
        : revisionTarget.id;

    approveRevision(identifier, choice, revisionNotes.trim() || defaultNote, approvalMethod);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="headline-lg text-[#0B1C30]">Tulis Review &amp; Verifikasi Revisi</h1>
          <p className="body-base text-[#475569] mt-1">
            Pemilihan periode pengajuan, penulisan catatan review, serta persetujuan revisi (TTD
            dosen atau QR Code opsional)
          </p>
        </div>
      </div>

      {/* Main Level 1 Tab Container */}
      <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 overflow-hidden">
        <div className="flex items-center border-b border-[#E2E8F0] px-6 gap-6">
          <button
            type="button"
            onClick={() => {
              setTab('review-list');
              handleStopCamera();
            }}
            className={`relative py-4 body-semibold cursor-pointer ${
              tab === 'review-list' ? 'text-[#0F2A66]' : 'text-[#475569] hover:text-[#0F2A66]'
            }`}
          >
            Tulis Review Proposal
            {tab === 'review-list' && (
              <span className="absolute bottom-0 inset-x-0 h-[3px] bg-[#0F2A66]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setTab('qr-approval')}
            className={`relative py-4 body-semibold cursor-pointer ${
              tab === 'qr-approval' ? 'text-[#0F2A66]' : 'text-[#475569] hover:text-[#0F2A66]'
            }`}
          >
            Approve Revisi (QR Opsional)
            {tab === 'qr-approval' && (
              <span className="absolute bottom-0 inset-x-0 h-[3px] bg-[#0F2A66]" />
            )}
          </button>
        </div>

        {tab === 'review-list' ? (
          <div>
            {/* Filters inside card header */}
            <div className="p-6 border-b border-[#E2E8F0] bg-[#F8FAFC] grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="rev-period" className="block label-md text-[#0B1C30] mb-1.5">
                  Pilih Periode / Tahun Akademik
                </label>
                <select
                  id="rev-period"
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value)}
                  className="input-field"
                >
                  {periods.map((p) => (
                    <option key={p} value={p}>
                      {p === 'Semua' ? 'Semua Periode' : p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="rev-status" className="block label-md text-[#0B1C30] mb-1.5">
                  Filter Status Evaluasi
                </label>
                <select
                  id="rev-status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'Semua' | AcademicStatus)}
                  className="input-field"
                >
                  <option value="Semua">Semua Status</option>
                  <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                  <option value="Perlu Revisi">Perlu Revisi</option>
                  <option value="Diperbaiki">Diperbaiki</option>
                  <option value="Perbaikan Bersyarat">Perbaikan Bersyarat</option>
                  <option value="Diterima">Diterima</option>
                  <option value="Ditolak">Ditolak</option>
                </select>
              </div>
            </div>

            {supervised.length === 0 ? (
              <EmptyState message="Tidak ada proposal mahasiswa pada periode dan status yang dipilih." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0]">
                      <th className="py-3 px-6 label-md uppercase text-[#475569]">Mahasiswa</th>
                      <th className="py-3 px-4 label-md uppercase text-[#475569]">
                        Judul Proposal &amp; Periode
                      </th>
                      <th className="py-3 px-4 label-md uppercase text-[#475569]">Tahap</th>
                      <th className="py-3 px-4 label-md uppercase text-[#475569]">Status</th>
                      <th className="py-3 px-4 label-md uppercase text-[#475569] text-right">
                        Pembaruan
                      </th>
                      <th className="py-3 px-6 label-md uppercase text-[#475569] text-right">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {supervised.map((item, idx) => (
                      <tr key={item.id} className={idx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'}>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <p className="body-semibold text-[#0B1C30]">{item.studentName}</p>
                          <p className="code-meta text-[#475569]">{item.studentNim}</p>
                        </td>
                        <td className="py-4 px-4 max-w-md">
                          <p className="body-medium text-[#0B1C30]">{item.title}</p>
                          <p className="code-meta text-[#475569] mt-0.5">
                            {item.semester} — {item.programStudi}
                          </p>
                        </td>
                        <td className="py-4 px-4 body-base text-[#0B1C30] whitespace-nowrap">
                          {item.stage}
                        </td>
                        <td className="py-4 px-4">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="py-4 px-4 code-meta text-[#475569] text-right whitespace-nowrap">
                          {formatDateId(item.updatedAt)}
                        </td>
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openEvaluationModal(item)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 label-md text-[#1E293B] hover:bg-[#F1F5F9] cursor-pointer"
                          >
                            <FileCheck2 className="w-3.5 h-3.5 stroke-[1.5]" />
                            Tulis Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* Revision Approval Tab (TTD Dosen or optional QR) */
          <div className="p-6 sm:p-8 space-y-6">
            <AlertBanner
              variant="info"
              title="Persetujuan Revisi Proposal (QR Code Opsional — Pengganti TTD Dosen)"
              description="Approve revisi melalui QR Code bersifat opsional sebagai pengganti tanda tangan (TTD) dosen pada lembar revisi. Anda dapat menyetujui revisi secara langsung tanpa QR (TTD dosen), atau memilih mode QR Code untuk pengesahan digital."
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Method Selector, Verification Panel & Target Detail (7 cols) */}
              <div className="lg:col-span-7 space-y-5">
                <div
                  role="radiogroup"
                  aria-label="Metode Persetujuan Revisi"
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={approvalMethod === 'ttd-dosen'}
                    onClick={() => handleSelectMethod('ttd-dosen')}
                    className={`rounded-xl border p-4 text-left transition-colors cursor-pointer ${
                      approvalMethod === 'ttd-dosen'
                        ? 'border-[#0F2A66] bg-[#EFF6FF]/60'
                        : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <PenLine className="w-4 h-4 text-[#0F2A66] stroke-[1.5]" />
                      <span className="body-semibold text-[#0B1C30]">
                        Persetujuan Langsung (TTD Dosen)
                      </span>
                    </div>
                    <p className="code-meta text-[#475569] mt-1">
                      Sahkan revisi langsung dari daftar mahasiswa tanpa memindai QR (untuk
                      lembar revisi dengan TTD dosen).
                    </p>
                  </button>

                  <button
                    type="button"
                    role="radio"
                    aria-checked={approvalMethod === 'qr-opsional'}
                    onClick={() => handleSelectMethod('qr-opsional')}
                    className={`rounded-xl border p-4 text-left transition-colors cursor-pointer ${
                      approvalMethod === 'qr-opsional'
                        ? 'border-[#0F2A66] bg-[#EFF6FF]/60'
                        : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-[#0F2A66] stroke-[1.5]" />
                        <span className="body-semibold text-[#0B1C30]">Approve by QR Code</span>
                      </span>
                      <span className="label-sm rounded-full border border-[#CBD5E1] bg-white px-2 py-0.5 text-[#475569]">
                        Opsional
                      </span>
                    </div>
                    <p className="code-meta text-[#475569] mt-1">
                      Opsional sebagai pengganti TTD dosen melalui pemindaian kamera atau input
                      token QR.
                    </p>
                  </button>
                </div>

                {approvalMethod === 'ttd-dosen' ? (
                  <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <PenLine className="w-5 h-5 text-[#0F2A66] stroke-[1.5]" />
                      <h2 className="headline-sm text-[#0B1C30]">
                        Persetujuan Langsung Tanpa QR (TTD Dosen)
                      </h2>
                    </div>
                    <div>
                      <label htmlFor="select-rev-student" className="block label-md text-[#0B1C30] mb-1.5">
                        Pilih Mahasiswa Revisi
                      </label>
                      <select
                        id="select-rev-student"
                        value={selectedRevisionId ?? ''}
                        onChange={(e) => {
                          const nextId = e.target.value || null;
                          setSelectedRevisionId(nextId);
                          const chosen = theses.find((t) => t.id === nextId);
                          if (chosen) {
                            setQrInput(chosen.revisionQrToken ?? '');
                          }
                        }}
                        className="input-field"
                      >
                        <option value="">Pilih mahasiswa dari daftar revisi</option>
                        {revisionCandidates.map((cand) => (
                          <option key={cand.id} value={cand.id}>
                            {cand.studentName} ({cand.studentNim}) — {cand.status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <QrCode className="w-5 h-5 text-[#0F2A66] stroke-[1.5]" />
                        <h2 className="headline-sm text-[#0B1C30]">Pemindai &amp; Input Token QR</h2>
                        <span className="label-sm rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-2.5 py-0.5 text-[#1D4ED8]">
                          Opsional · Pengganti TTD Dosen
                        </span>
                      </div>
                      {!cameraActive ? (
                        <button
                          type="button"
                          onClick={() => void handleStartCamera()}
                          className="btn-secondary"
                        >
                          <Camera className="w-4 h-4 stroke-[1.5]" />
                          Aktifkan Kamera Scanner
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleStopCamera}
                          className="btn-secondary"
                        >
                          Matikan Kamera
                        </button>
                      )}
                    </div>

                    {cameraActive && (
                      <div className="rounded-lg border border-[#CBD5E1] bg-black overflow-hidden">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-52 object-cover"
                        />
                      </div>
                    )}

                    {cameraMessage && (
                      <p className="body-base text-[#C2410C]">{cameraMessage}</p>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        value={qrInput}
                        onChange={(e) => setQrInput(e.target.value)}
                        placeholder="Masukkan kode token QR (misal: ISTTS-REV-221116942-V1)"
                        className="input-field flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => handleLookupQr(qrInput)}
                        className="btn-primary shrink-0"
                      >
                        Verifikasi Token QR
                      </button>
                    </div>
                  </div>
                )}

                {/* Selected Revision Detail Panel */}
                {revisionTarget ? (
                  <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[#E2E8F0]">
                      <div>
                        <span className="code-meta text-[#0284C7] font-semibold">
                          {approvalMethod === 'qr-opsional'
                            ? `Metode: QR Code Opsional (Pengganti TTD Dosen) — Token ${
                                revisionTarget.revisionQrToken ?? revisionTarget.id
                              }`
                            : 'Metode: Persetujuan Langsung / TTD Dosen (Tanpa QR)'}
                        </span>
                        <h3 className="headline-sm text-[#0B1C30] mt-1">
                          {revisionTarget.studentName} ({revisionTarget.studentNim})
                        </h3>
                        <p className="body-base text-[#475569] mt-0.5">{revisionTarget.title}</p>
                        {revisionTarget.status === 'Diterima' &&
                          revisionTarget.revisionApprovalMethod && (
                            <p className="code-meta text-[#15803D] font-semibold mt-1">
                              {revisionTarget.revisionApprovalMethod === 'qr-opsional'
                                ? 'Disahkan melalui QR Code (Pengganti TTD Dosen)'
                                : 'Disahkan melalui TTD Dosen (Tanpa QR)'}
                            </p>
                          )}
                      </div>
                      <StatusBadge status={revisionTarget.status} />
                    </div>

                    {revisionTarget.submissions[0] && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                        <div className="min-w-0">
                          <p className="body-semibold text-[#0B1C30] truncate">
                            {revisionTarget.submissions[0].fileName}
                          </p>
                          <p className="code-meta text-[#475569] mt-0.5">
                            {revisionTarget.submissions[0].summary}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const latest = revisionTarget.submissions[0];
                            openFilePreview({
                              id: latest.id,
                              fileName: latest.fileName,
                              title: latest.pdfTitle ?? latest.versionLabel,
                              subtitle: `${revisionTarget.studentName} (${revisionTarget.studentNim})`,
                              lines: latest.pdfLines ?? [`Ringkasan: ${latest.summary}`],
                              hasRealBlob: latest.hasRealBlob,
                            });
                          }}
                          className="btn-secondary shrink-0"
                        >
                          <Eye className="w-4 h-4 stroke-[1.5]" />
                          Pratinjau Revisi
                        </button>
                      </div>
                    )}

                    <div>
                      <label htmlFor="qr-notes" className="block label-md text-[#0B1C30] mb-1.5">
                        Catatan Persetujuan / Penolakan Revisi
                      </label>
                      <textarea
                        id="qr-notes"
                        rows={3}
                        value={revisionNotes}
                        onChange={(e) => setRevisionNotes(e.target.value)}
                        className="textarea-field"
                      />
                    </div>

                    <div className="flex flex-wrap justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                      <button
                        type="button"
                        onClick={() => handleRevisionDecision('Ditolak')}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#FCA5A5] bg-white px-4 h-[42px] body-semibold text-[#B91C1C] hover:bg-[#FEE2E2] cursor-pointer"
                      >
                        <XCircle className="w-4 h-4 stroke-[1.5]" />
                        Tolak Revisi
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRevisionDecision('Diterima')}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#86EFAC] bg-[#DCFCE7] px-4 h-[42px] body-semibold text-[#15803D] hover:bg-[#BBF7D0] cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 stroke-[1.5]" />
                        {approvalMethod === 'qr-opsional'
                          ? 'Setujui Revisi via QR'
                          : 'Setujui Revisi (TTD Dosen)'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icon={approvalMethod === 'qr-opsional' ? QrCode : PenLine}
                    message={
                      approvalMethod === 'qr-opsional'
                        ? 'Pilih atau pindai salah satu kode QR revisi mahasiswa untuk pengesahan digital pengganti TTD dosen.'
                        : 'Pilih mahasiswa revisi dari daftar untuk memberikan persetujuan langsung (TTD dosen) tanpa memindai QR.'
                    }
                  />
                )}
              </div>

              {/* Revision Candidate List (5 cols) */}
              <div className="lg:col-span-5">
                <div className="rounded-xl border border-[#E2E8F0] bg-white overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                    <h3 className="headline-sm text-[#0B1C30]">Daftar Revisi Mahasiswa</h3>
                  </div>
                  {revisionCandidates.length === 0 ? (
                    <EmptyState message="Belum ada pengajuan revisi mahasiswa." />
                  ) : (
                    <div className="divide-y divide-[#E2E8F0]">
                      {revisionCandidates.map((cand) => (
                        <div key={cand.id} className="p-4 flex items-start gap-4">
                          {cand.revisionQrToken ? (
                            <QrCodeSvg value={cand.revisionQrToken} size={68} />
                          ) : (
                            <div className="w-[68px] h-[68px] shrink-0 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-center">
                              <PenLine className="w-5 h-5 text-[#94A3B8] stroke-[1.5]" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="body-semibold text-[#0B1C30] truncate">
                                {cand.studentName}
                              </p>
                              <StatusBadge status={cand.status} />
                            </div>
                            <p className="code-meta text-[#475569]">{cand.studentNim}</p>
                            {cand.revisionQrToken && (
                              <p className="code-meta text-[#0F2A66] font-semibold mt-0.5 truncate">
                                {cand.revisionQrToken}
                              </p>
                            )}
                            {cand.status === 'Diterima' && cand.revisionApprovalMethod && (
                              <p className="code-meta text-[#15803D] mt-0.5">
                                Disahkan:{' '}
                                {cand.revisionApprovalMethod === 'qr-opsional'
                                  ? 'QR Code (Pengganti TTD)'
                                  : 'TTD Dosen'}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                              <button
                                type="button"
                                onClick={() => {
                                  handleSelectMethod('ttd-dosen');
                                  setSelectedRevisionId(cand.id);
                                  setQrInput(cand.revisionQrToken ?? '');
                                }}
                                className="label-md text-[#0F2A66] hover:underline cursor-pointer"
                              >
                                Pilih (TTD Dosen)
                              </button>
                              {cand.revisionQrToken && (
                                <button
                                  type="button"
                                  onClick={() => handleLookupQr(cand.revisionQrToken!)}
                                  className="label-md text-[#0284C7] hover:underline cursor-pointer"
                                >
                                  Pindai QR (Opsional)
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Evaluation Modal */}
      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Tulis Review Proposal Mahasiswa"
      >
        {selected && (
          <form onSubmit={handleSaveEvaluation} className="space-y-5">
            <div className="pb-4 border-b border-[#E2E8F0]">
              <p className="code-meta text-[#475569]">
                {selected.studentName} ({selected.studentNim}) — {selected.semester} —{' '}
                {selected.stage}
              </p>
              <h3 className="headline-sm text-[#0B1C30] mt-1">{selected.title}</h3>
              <p className="code-meta text-[#475569] mt-1">
                Pembimbing 1: {getLecturerName(lecturers, selected.advisor1Id)} | Pembimbing 2:{' '}
                {getLecturerName(lecturers, selected.advisor2Id)}
              </p>
            </div>

            {selected.stage === 'Revisi Proposal' && (
              <AlertBanner
                variant="info"
                title="Persetujuan Langsung (TTD Dosen)"
                description="Menyetujui naskah melalui formulir ini dicatat sebagai pengesahan langsung (TTD dosen). Persetujuan melalui QR Code pada tab Approve Revisi bersifat opsional sebagai pengganti TTD dosen."
              />
            )}

            {selected.submissions[0] && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                <div className="min-w-0">
                  <p className="body-semibold text-[#0B1C30] truncate">
                    {selected.submissions[0].fileName}
                  </p>
                  <p className="code-meta text-[#475569] mt-0.5">
                    {selected.submissions[0].versionLabel} — {selected.submissions[0].summary}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const latest = selected.submissions[0];
                      openFilePreview({
                        id: latest.id,
                        fileName: latest.fileName,
                        title: latest.pdfTitle ?? latest.versionLabel,
                        subtitle: `${selected.studentName} (${selected.studentNim})`,
                        lines: latest.pdfLines ?? [
                          `Judul: ${selected.title}`,
                          `Abstrak: ${selected.abstract}`,
                        ],
                        hasRealBlob: latest.hasRealBlob,
                      });
                    }}
                    className="btn-secondary"
                  >
                    <Eye className="w-4 h-4 stroke-[1.5]" />
                    Pratinjau
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const latest = selected.submissions[0];
                      void downloadPdfPayload({
                        id: latest.id,
                        fileName: latest.fileName,
                        title: latest.pdfTitle ?? latest.versionLabel,
                        subtitle: `${selected.studentName} (${selected.studentNim})`,
                        lines: latest.pdfLines ?? [
                          `Judul: ${selected.title}`,
                          `Abstrak: ${selected.abstract}`,
                        ],
                        hasRealBlob: latest.hasRealBlob,
                      });
                    }}
                    className="btn-secondary"
                  >
                    <Download className="w-4 h-4 stroke-[1.5]" />
                    Unduh
                  </button>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="eval-decision" className="block label-md text-[#0B1C30] mb-1.5">
                Keputusan Evaluasi
              </label>
              <select
                id="eval-decision"
                value={decision}
                onChange={(e) => setDecision(e.target.value as AcademicStatus)}
                className="input-field"
              >
                <option value="Diterima">Diterima (Setujui Naskah)</option>
                <option value="Perlu Revisi">Perlu Revisi</option>
                <option value="Ditolak">Ditolak</option>
              </select>
            </div>

            <div>
              <label htmlFor="eval-notes" className="block label-md text-[#0B1C30] mb-1.5">
                Catatan Evaluasi Proposal
              </label>
              <textarea
                id="eval-notes"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tuliskan catatan review, kekuatan metodologi, dan poin perbaikan yang diperlukan."
                className="textarea-field"
                required
              />
            </div>

            <div>
              <span className="block label-md text-[#0B1C30] mb-1.5">
                Lampiran Berkas Koreksi Opsional (.PDF)
              </span>
              <FileDropzone
                file={correctionFile}
                onFileSelect={setCorrectionFile}
                headline="Tarik & lepaskan file koreksi bertanda di sini, atau klik untuk memilih"
                helperText="Format yang didukung: .PDF (Maksimal 20 MB)"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="btn-secondary"
              >
                Batal
              </button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Menyimpan...' : 'Simpan Catatan Review'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
