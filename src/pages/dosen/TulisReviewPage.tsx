import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, CheckCircle2, Download, Eye, FileCheck2, QrCode, XCircle } from 'lucide-react';
import { AlertBanner } from '../../components/ui/AlertBanner';
import { EmptyState } from '../../components/ui/EmptyState';
import { FileDropzone } from '../../components/ui/FileDropzone';
import { Modal } from '../../components/ui/Modal';
import { QrCodeSvg } from '../../components/ui/QrCodeSvg';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { usePortal } from '../../context/PortalContext';
import { AcademicStatus, ThesisRecord } from '../../types/portal';
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
    approveRevisionByQr,
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

  // QR Approval state
  const [qrInput, setQrInput] = useState('');
  const [qrTarget, setQrTarget] = useState<ThesisRecord | null>(null);
  const [qrNotes, setQrNotes] = useState(
    'Revisi telah sesuai dengan catatan perbaikan sidang proposal.',
  );
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraMessage, setCameraMessage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (activeSubTab === 'qr-approval') {
      setTab('qr-approval');
    } else if (activeSubTab === 'review-list') {
      setTab('review-list');
    }

    if (focusedThesisId) {
      const target = theses.find((t) => t.id === focusedThesisId);
      if (target) {
        if (activeSubTab === 'qr-approval') {
          setQrInput(target.revisionQrToken ?? target.id);
          setQrTarget(target);
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

  const qrCandidates = useMemo(
    () => theses.filter((t) => Boolean(t.revisionQrToken)),
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
      setQrTarget(null);
      return;
    }
    setQrInput(found.revisionQrToken ?? found.id);
    setQrTarget(found);
  };

  const handleStartCamera = async () => {
    setCameraMessage(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraMessage(
        'Kamera perangkat tidak tersedia pada browser ini. Gunakan daftar pemindaian cepat di samping.',
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
        'Izin kamera ditolak atau kamera tidak terdeteksi. Gunakan input token atau simulasi pemindaian.',
      );
    }
  };

  const handleStopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const handleQrDecision = (choice: 'Diterima' | 'Ditolak') => {
    if (!qrTarget) return;
    const ok = approveRevisionByQr(
      qrTarget.revisionQrToken ?? qrTarget.id,
      choice,
      qrNotes.trim() ||
        (choice === 'Diterima'
          ? 'Revisi disetujui melalui pemindaian QR.'
          : 'Revisi ditolak melalui pemindaian QR.'),
    );
    if (ok) {
      const refreshed = theses.find((t) => t.id === qrTarget.id) ?? null;
      setQrTarget(refreshed);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="headline-lg text-[#0B1C30]">Tulis Review &amp; Verifikasi Revisi</h1>
          <p className="body-base text-[#475569] mt-1">
            Pemilihan periode pengajuan, penulisan catatan review, dan persetujuan revisi via QR
            Code
          </p>
        </div>
      </div>

      {/* Main Level 1 Tab Container */}
      <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 overflow-hidden">
        <div className="flex items-center border-b border-[#E2E8F0] px-6 gap-6">
          <button
            type="button"
            onClick={() => setTab('review-list')}
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
            Approve Revisi by QR
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
          /* QR Approval Tab */
          <div className="p-6 sm:p-8 space-y-6">
            <AlertBanner
              variant="info"
              title="Verifikasi Persetujuan Revisi Proposal melalui QR Code"
              description="Pindai QR Code dari lembar revisi mahasiswa atau pilih token QR aktif di bawah ini untuk menyetujui atau menolak revisi secara instan."
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Scanner & Manual Input (7 cols) */}
              <div className="lg:col-span-7 space-y-5">
                <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-[#0F2A66] stroke-[1.5]" />
                      <h2 className="headline-sm text-[#0B1C30]">Pemindai &amp; Input Token QR</h2>
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

                {/* Scanned Result Panel */}
                {qrTarget ? (
                  <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[#E2E8F0]">
                      <div>
                        <span className="code-meta text-[#0284C7] font-semibold">
                          Token Terverifikasi: {qrTarget.revisionQrToken}
                        </span>
                        <h3 className="headline-sm text-[#0B1C30] mt-1">
                          {qrTarget.studentName} ({qrTarget.studentNim})
                        </h3>
                        <p className="body-base text-[#475569] mt-0.5">{qrTarget.title}</p>
                      </div>
                      <StatusBadge status={qrTarget.status} />
                    </div>

                    {qrTarget.submissions[0] && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                        <div className="min-w-0">
                          <p className="body-semibold text-[#0B1C30] truncate">
                            {qrTarget.submissions[0].fileName}
                          </p>
                          <p className="code-meta text-[#475569] mt-0.5">
                            {qrTarget.submissions[0].summary}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const latest = qrTarget.submissions[0];
                            openFilePreview({
                              id: latest.id,
                              fileName: latest.fileName,
                              title: latest.pdfTitle ?? latest.versionLabel,
                              subtitle: `${qrTarget.studentName} (${qrTarget.studentNim})`,
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
                        Catatan Persetujuan / Penolakan QR
                      </label>
                      <textarea
                        id="qr-notes"
                        rows={3}
                        value={qrNotes}
                        onChange={(e) => setQrNotes(e.target.value)}
                        className="textarea-field"
                      />
                    </div>

                    <div className="flex flex-wrap justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                      <button
                        type="button"
                        onClick={() => handleQrDecision('Ditolak')}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#FCA5A5] bg-white px-4 h-[42px] body-semibold text-[#B91C1C] hover:bg-[#FEE2E2] cursor-pointer"
                      >
                        <XCircle className="w-4 h-4 stroke-[1.5]" />
                        Tolak Revisi
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQrDecision('Diterima')}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#86EFAC] bg-[#DCFCE7] px-4 h-[42px] body-semibold text-[#15803D] hover:bg-[#BBF7D0] cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 stroke-[1.5]" />
                        Setujui Revisi
                      </button>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icon={QrCode}
                    message="Pilih atau pindai salah satu kode QR revisi mahasiswa untuk menampilkan detail dan memberikan persetujuan."
                  />
                )}
              </div>

              {/* Simulasi QR List (5 cols) */}
              <div className="lg:col-span-5">
                <div className="rounded-xl border border-[#E2E8F0] bg-white overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                    <h3 className="headline-sm text-[#0B1C30]">
                      Kode QR Revisi Mahasiswa Aktif
                    </h3>
                  </div>
                  <div className="divide-y divide-[#E2E8F0]">
                    {qrCandidates.map((cand) => (
                      <div key={cand.id} className="p-4 flex items-center gap-4">
                        <QrCodeSvg value={cand.revisionQrToken ?? cand.id} size={76} />
                        <div className="min-w-0 flex-1">
                          <p className="body-semibold text-[#0B1C30] truncate">
                            {cand.studentName}
                          </p>
                          <p className="code-meta text-[#475569]">{cand.studentNim}</p>
                          <p className="code-meta text-[#0F2A66] font-semibold mt-0.5 truncate">
                            {cand.revisionQrToken}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleLookupQr(cand.revisionQrToken ?? cand.id)}
                            className="label-md text-[#0284C7] hover:underline mt-1.5 cursor-pointer"
                          >
                            Simulasikan Pindai QR ini
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
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
