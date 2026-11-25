import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Eye, QrCode, Sparkles, UserCheck, XCircle } from 'lucide-react';
import { AlertBanner } from '../../components/ui/AlertBanner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { QrCodeSvg } from '../../components/ui/QrCodeSvg';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { usePortal } from '../../context/PortalContext';
import { ThesisRecord } from '../../types/portal';
import { getLecturerName } from '../../utils/format';

export const PlottingReviewerPage: React.FC = () => {
  const {
    theses,
    lecturers,
    activeSubTab,
    focusedThesisId,
    clearFocus,
    openFilePreview,
    saveProposalReviewers,
    saveTaExaminers,
    approveRevisionByQr,
    showToast,
  } = usePortal();

  const [tab, setTab] = useState<'proposal' | 'penguji-ta' | 'qr-approval'>('proposal');
  const [periodFilter, setPeriodFilter] = useState('Semua');

  // Proposal Reviewer Modal
  const [plottingThesis, setPlottingThesis] = useState<ThesisRecord | null>(null);
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);

  // TA Examiner Modal
  const [taThesis, setTaThesis] = useState<ThesisRecord | null>(null);
  const [selectedExaminers, setSelectedExaminers] = useState<string[]>([]);

  // QR Approval State
  const [qrInput, setQrInput] = useState('');
  const [qrTarget, setQrTarget] = useState<ThesisRecord | null>(null);
  const [qrNotes, setQrNotes] = useState('Revisi telah memenuhi syarat Program Studi.');

  useEffect(() => {
    if (activeSubTab === 'penguji-ta') setTab('penguji-ta');
    else if (activeSubTab === 'qr-approval') setTab('qr-approval');
    else if (activeSubTab === 'proposal') setTab('proposal');

    if (focusedThesisId) {
      const target = theses.find((t) => t.id === focusedThesisId);
      if (target) {
        if (activeSubTab === 'qr-approval') {
          setQrInput(target.revisionQrToken ?? target.id);
          setQrTarget(target);
        } else {
          openProposalPlotModal(target);
        }
      }
      clearFocus();
    }
  }, [activeSubTab, focusedThesisId, theses, clearFocus]);

  const periods = useMemo(
    () => ['Semua', ...Array.from(new Set(theses.map((t) => t.semester)))],
    [theses],
  );

  const filteredTheses = useMemo(
    () => theses.filter((t) => periodFilter === 'Semua' || t.semester === periodFilter),
    [theses, periodFilter],
  );

  const qrCandidates = useMemo(
    () => theses.filter((t) => Boolean(t.revisionQrToken)),
    [theses],
  );

  const computeTagMatches = (thesis: ThesisRecord, lecturerTags: string[]) =>
    thesis.tags.filter((tag) => lecturerTags.includes(tag));

  const getRecommendedReviewers = (thesis: ThesisRecord, targetCount: number) => {
    return [...lecturers]
      .sort((a, b) => {
        const matchB = computeTagMatches(thesis, b.tags).length;
        const matchA = computeTagMatches(thesis, a.tags).length;
        return matchB - matchA;
      })
      .slice(0, Math.min(4, targetCount))
      .map((l) => l.id);
  };

  const openProposalPlotModal = (thesis: ThesisRecord) => {
    setPlottingThesis(thesis);
    if (thesis.proposalReviewers.length > 0) {
      setSelectedReviewers(thesis.proposalReviewers);
    } else {
      const desired = thesis.sksWeight >= 6 ? 4 : 3;
      setSelectedReviewers(getRecommendedReviewers(thesis, desired));
    }
  };

  const openTaPlotModal = (thesis: ThesisRecord) => {
    setTaThesis(thesis);
    if (thesis.taExaminers.length > 0) {
      setSelectedExaminers(thesis.taExaminers);
    } else {
      // Automatically recommend at least 2 from proposalReviewers + tag match
      const fromProposal = thesis.proposalReviewers.slice(0, 2);
      const others = lecturers
        .filter((l) => !fromProposal.includes(l.id))
        .sort(
          (a, b) =>
            computeTagMatches(thesis, b.tags).length -
            computeTagMatches(thesis, a.tags).length,
        )
        .map((l) => l.id);
      setSelectedExaminers([...fromProposal, ...others].slice(0, 3));
    }
  };

  const toggleSelection = (
    id: string,
    current: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    if (current.includes(id)) {
      setter(current.filter((item) => item !== id));
    } else {
      if (current.length >= 4) {
        showToast('Maksimal 4 dosen penguji/reviewer sesuai ketentuan.', 'error');
        return;
      }
      setter([...current, id]);
    }
  };

  const handleSaveProposalPlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plottingThesis) return;
    if (selectedReviewers.length < 2) {
      showToast('Pilih minimal 2 dosen reviewer proposal.', 'error');
      return;
    }
    saveProposalReviewers(plottingThesis.id, selectedReviewers);
    setPlottingThesis(null);
  };

  const handleSaveTaPlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taThesis) return;
    const ok = saveTaExaminers(taThesis.id, selectedExaminers);
    if (ok) setTaThesis(null);
  };

  const handleLookupQr = (tokenValue: string) => {
    const clean = tokenValue.trim().toLowerCase();
    const found = theses.find(
      (t) =>
        t.id.toLowerCase() === clean ||
        (t.revisionQrToken && t.revisionQrToken.toLowerCase() === clean),
    );
    if (!found) {
      showToast('Token QR tidak ditemukan.', 'error');
      setQrTarget(null);
      return;
    }
    setQrInput(found.revisionQrToken ?? found.id);
    setQrTarget(found);
  };

  const handleQrDecision = (decision: 'Diterima' | 'Ditolak') => {
    if (!qrTarget) return;
    const ok = approveRevisionByQr(
      qrTarget.revisionQrToken ?? qrTarget.id,
      decision,
      qrNotes.trim() || 'Verifikasi revisi oleh Kaprodi melalui QR Code.',
    );
    if (ok) {
      setQrTarget(theses.find((t) => t.id === qrTarget.id) ?? null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="headline-lg text-[#0B1C30]">
            Plotting Reviewer Proposal &amp; Penguji TA
          </h1>
          <p className="body-base text-[#475569] mt-1">
            Rekomendasi otomatis berbasis tag topik proposal, plotting penguji (maksimal 4 dosen),
            serta verifikasi revisi QR
          </p>
        </div>

        <div className="w-full sm:w-56">
          <select
            aria-label="Filter periode"
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
      </div>

      {/* Tabs Container */}
      <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 overflow-hidden">
        <div className="flex flex-wrap items-center border-b border-[#E2E8F0] px-6 gap-6">
          <button
            type="button"
            onClick={() => setTab('proposal')}
            className={`relative py-4 body-semibold cursor-pointer ${
              tab === 'proposal' ? 'text-[#0F2A66]' : 'text-[#475569] hover:text-[#0F2A66]'
            }`}
          >
            Plotting Reviewer Proposal
            {tab === 'proposal' && (
              <span className="absolute bottom-0 inset-x-0 h-[3px] bg-[#0F2A66]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setTab('penguji-ta')}
            className={`relative py-4 body-semibold cursor-pointer ${
              tab === 'penguji-ta' ? 'text-[#0F2A66]' : 'text-[#475569] hover:text-[#0F2A66]'
            }`}
          >
            Plotting Penguji TA
            {tab === 'penguji-ta' && (
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

        {tab === 'proposal' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0]">
                  <th className="py-3 px-6 label-md uppercase text-[#475569]">Mahasiswa</th>
                  <th className="py-3 px-4 label-md uppercase text-[#475569]">
                    Judul &amp; Tag Proposal
                  </th>
                  <th className="py-3 px-4 label-md uppercase text-[#475569]">Bobot SKS</th>
                  <th className="py-3 px-4 label-md uppercase text-[#475569]">
                    Reviewer Terplot
                  </th>
                  <th className="py-3 px-6 label-md uppercase text-[#475569] text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredTheses.map((item, idx) => (
                  <tr key={item.id} className={idx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'}>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <p className="body-semibold text-[#0B1C30]">{item.studentName}</p>
                      <p className="code-meta text-[#475569]">{item.studentNim}</p>
                    </td>
                    <td className="py-4 px-4 max-w-md">
                      <p className="body-medium text-[#0B1C30]">{item.title}</p>
                      <p className="code-meta text-[#0284C7] mt-0.5">
                        Tag: {item.tags.join(', ')}
                      </p>
                    </td>
                    <td className="py-4 px-4 body-medium text-[#0B1C30] whitespace-nowrap">
                      {item.sksWeight} SKS
                    </td>
                    <td className="py-4 px-4">
                      {item.proposalReviewers.length === 0 ? (
                        <StatusBadge status="Menunggu Verifikasi" />
                      ) : (
                        <p className="code-meta text-[#0B1C30]">
                          {item.proposalReviewers.length} dosen (
                          {item.proposalReviewers
                            .map((id) => getLecturerName(lecturers, id).split(',')[0])
                            .join(', ')}
                          )
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openProposalPlotModal(item)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 label-md text-[#1E293B] hover:bg-[#F1F5F9] cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#0284C7] stroke-[1.5]" />
                        Plot Reviewer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'penguji-ta' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0]">
                  <th className="py-3 px-6 label-md uppercase text-[#475569]">Mahasiswa</th>
                  <th className="py-3 px-4 label-md uppercase text-[#475569]">Judul Tugas Akhir</th>
                  <th className="py-3 px-4 label-md uppercase text-[#475569]">
                    Reviewer Proposal Sebelumnya
                  </th>
                  <th className="py-3 px-4 label-md uppercase text-[#475569]">Penguji TA</th>
                  <th className="py-3 px-6 label-md uppercase text-[#475569] text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredTheses.map((item, idx) => (
                  <tr key={item.id} className={idx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'}>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <p className="body-semibold text-[#0B1C30]">{item.studentName}</p>
                      <p className="code-meta text-[#475569]">{item.studentNim}</p>
                    </td>
                    <td className="py-4 px-4 max-w-sm body-medium text-[#0B1C30]">
                      {item.title}
                    </td>
                    <td className="py-4 px-4 code-meta text-[#475569] max-w-xs">
                      {item.proposalReviewers.length > 0
                        ? item.proposalReviewers
                            .map((id) => getLecturerName(lecturers, id).split(',')[0])
                            .join(', ')
                        : 'Belum di-plot'}
                    </td>
                    <td className="py-4 px-4">
                      {item.taExaminers.length === 0 ? (
                        <StatusBadge status="Menunggu Verifikasi" />
                      ) : (
                        <p className="code-meta text-[#0F2A66] font-semibold">
                          {item.taExaminers.length} penguji (
                          {item.taExaminers
                            .map((id) => getLecturerName(lecturers, id).split(',')[0])
                            .join(', ')}
                          )
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openTaPlotModal(item)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 label-md text-[#1E293B] hover:bg-[#F1F5F9] cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5 stroke-[1.5]" />
                        Plot Penguji TA
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'qr-approval' && (
          <div className="p-6 sm:p-8 space-y-6">
            <AlertBanner
              variant="info"
              title="Persetujuan Revisi Proposal melalui Pemindaian QR Code"
              description="Kaprodi dapat menyetujui atau menolak hasil revisi mahasiswa langsung melalui token QR tanpa mengunduh ulang PDF secara manual."
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    placeholder="Masukkan token QR revisi (misal: ISTTS-REV-221116942-V1)"
                    className="input-field flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => handleLookupQr(qrInput)}
                    className="btn-primary shrink-0"
                  >
                    Verifikasi QR
                  </button>
                </div>

                {qrTarget ? (
                  <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 space-y-4">
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
                      <div>
                        <p className="code-meta text-[#0284C7] font-semibold">
                          Token: {qrTarget.revisionQrToken}
                        </p>
                        <h3 className="headline-sm text-[#0B1C30] mt-1">
                          {qrTarget.studentName} ({qrTarget.studentNim})
                        </h3>
                        <p className="body-base text-[#475569]">{qrTarget.title}</p>
                      </div>
                      <StatusBadge status={qrTarget.status} />
                    </div>

                    <div>
                      <label htmlFor="kap-qr-note" className="block label-md text-[#0B1C30] mb-1.5">
                        Catatan Pengesahan QR
                      </label>
                      <textarea
                        id="kap-qr-note"
                        rows={3}
                        value={qrNotes}
                        onChange={(e) => setQrNotes(e.target.value)}
                        className="textarea-field"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
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
                    message="Pilih salah satu kode QR mahasiswa di sebelah kanan atau masukkan token QR."
                  />
                )}
              </div>

              <div className="lg:col-span-5 rounded-xl border border-[#E2E8F0] divide-y divide-[#E2E8F0]">
                {qrCandidates.map((cand) => (
                  <div key={cand.id} className="p-4 flex items-center gap-4">
                    <QrCodeSvg value={cand.revisionQrToken ?? cand.id} size={72} />
                    <div className="min-w-0 flex-1">
                      <p className="body-semibold text-[#0B1C30] truncate">{cand.studentName}</p>
                      <p className="code-meta text-[#0F2A66] font-semibold truncate">
                        {cand.revisionQrToken}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleLookupQr(cand.revisionQrToken ?? cand.id)}
                        className="label-md text-[#0284C7] hover:underline mt-1 cursor-pointer"
                      >
                        Pindai QR ini
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Modal Plotting Reviewer Proposal */}
      <Modal
        open={Boolean(plottingThesis)}
        onClose={() => setPlottingThesis(null)}
        title="Rekomendasi & Plotting Reviewer Proposal"
      >
        {plottingThesis && (
          <form onSubmit={handleSaveProposalPlot} className="space-y-5">
            <div className="pb-3 border-b border-[#E2E8F0]">
              <p className="code-meta text-[#475569]">
                {plottingThesis.studentName} ({plottingThesis.studentNim}) — Bobot{' '}
                {plottingThesis.sksWeight} SKS
              </p>
              <h3 className="headline-sm text-[#0B1C30] mt-1">{plottingThesis.title}</h3>
              <p className="code-meta text-[#0284C7] mt-1">
                Tag Proposal: {plottingThesis.tags.join(', ')}
              </p>
            </div>

            {plottingThesis.submissions[0] && (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                <span className="code-meta text-[#0B1C30] truncate">
                  {plottingThesis.submissions[0].fileName}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const latest = plottingThesis.submissions[0];
                    openFilePreview({
                      id: latest.id,
                      fileName: latest.fileName,
                      title: latest.pdfTitle ?? latest.versionLabel,
                      subtitle: `${plottingThesis.studentName} (${plottingThesis.studentNim})`,
                      lines: latest.pdfLines ?? [`Judul: ${plottingThesis.title}`],
                      hasRealBlob: latest.hasRealBlob,
                    });
                  }}
                  className="btn-secondary shrink-0"
                >
                  <Eye className="w-4 h-4 stroke-[1.5]" />
                  Pratinjau PDF
                </button>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="label-md text-[#0B1C30]">
                  Rekomendasi Sistem Berbasis Tag (Maksimal 4 Reviewer)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedReviewers(
                      getRecommendedReviewers(
                        plottingThesis,
                        plottingThesis.sksWeight >= 6 ? 4 : 3,
                      ),
                    )
                  }
                  className="label-md text-[#0284C7] hover:underline cursor-pointer"
                >
                  Terapkan Rekomendasi Otomatis
                </button>
              </div>

              <div className="rounded-xl border border-[#E2E8F0] divide-y divide-[#E2E8F0]">
                {lecturers.map((lec) => {
                  const checked = selectedReviewers.includes(lec.id);
                  const matchedTags = computeTagMatches(plottingThesis, lec.tags);
                  return (
                    <label
                      key={lec.id}
                      className="p-3.5 flex items-start justify-between gap-3 cursor-pointer hover:bg-[#F8FAFC]"
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            toggleSelection(lec.id, selectedReviewers, setSelectedReviewers)
                          }
                          className="mt-1 h-4 w-4 accent-[#0F2A66]"
                        />
                        <div>
                          <p className="body-semibold text-[#0B1C30]">{lec.name}</p>
                          <p className="code-meta text-[#475569]">{lec.expertise}</p>
                        </div>
                      </div>
                      <span
                        className={`label-sm px-2.5 py-1 rounded-full border whitespace-nowrap ${
                          matchedTags.length > 0
                            ? 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]'
                            : 'bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]'
                        }`}
                      >
                        {matchedTags.length > 0
                          ? `Cocok ${matchedTags.length} Tag (${matchedTags.join(', ')})`
                          : 'Lintas Bidang'}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setPlottingThesis(null)}
                className="btn-secondary"
              >
                Batal
              </button>
              <button type="submit" className="btn-primary">
                Konfirmasi Reviewer ({selectedReviewers.length})
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Plotting Penguji TA */}
      <Modal
        open={Boolean(taThesis)}
        onClose={() => setTaThesis(null)}
        title="Rekomendasi & Plotting Penguji Tugas Akhir"
      >
        {taThesis && (
          <form onSubmit={handleSaveTaPlot} className="space-y-5">
            <div className="pb-3 border-b border-[#E2E8F0]">
              <p className="code-meta text-[#475569]">
                {taThesis.studentName} ({taThesis.studentNim})
              </p>
              <h3 className="headline-sm text-[#0B1C30] mt-1">{taThesis.title}</h3>
            </div>

            <AlertBanner
              variant="info"
              title="Aturan Recommender System Penguji TA"
              description="Minimal 2 dosen penguji TA wajib berasal dari tim reviewer proposal mahasiswa yang bersangkutan (maksimal 4 penguji)."
            />

            <div className="rounded-xl border border-[#E2E8F0] divide-y divide-[#E2E8F0]">
              {lecturers.map((lec) => {
                const checked = selectedExaminers.includes(lec.id);
                const wasProposalReviewer = taThesis.proposalReviewers.includes(lec.id);
                return (
                  <label
                    key={lec.id}
                    className="p-3.5 flex items-start justify-between gap-3 cursor-pointer hover:bg-[#F8FAFC]"
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          toggleSelection(lec.id, selectedExaminers, setSelectedExaminers)
                        }
                        className="mt-1 h-4 w-4 accent-[#0F2A66]"
                      />
                      <div>
                        <p className="body-semibold text-[#0B1C30]">{lec.name}</p>
                        <p className="code-meta text-[#475569]">{lec.expertise}</p>
                      </div>
                    </div>
                    {wasProposalReviewer && (
                      <span className="label-sm px-2.5 py-1 rounded-full bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] whitespace-nowrap">
                        Reviewer Proposal
                      </span>
                    )}
                  </label>
                );
              })}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setTaThesis(null)}
                className="btn-secondary"
              >
                Batal
              </button>
              <button type="submit" className="btn-primary">
                Konfirmasi Penguji TA ({selectedExaminers.length})
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
