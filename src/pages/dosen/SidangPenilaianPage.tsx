import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardEdit, Download, Eye } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { usePortal } from '../../context/PortalContext';
import { AcademicStatus, ThesisRecord } from '../../types/portal';
import {
  downloadPdfPayload,
  exportThesesToCsv,
  formatDateId,
  formatDateTimeId,
} from '../../utils/format';

export const SidangPenilaianPage: React.FC = () => {
  const {
    currentUser,
    theses,
    lecturers,
    activeSubTab,
    focusedThesisId,
    clearFocus,
    openFilePreview,
    submitDefenseScore,
    showToast,
  } = usePortal();

  const [tab, setTab] = useState<'input-hasil' | 'rekap-hasil'>('input-hasil');
  const [selected, setSelected] = useState<ThesisRecord | null>(null);
  const [perumusan, setPerumusan] = useState(82);
  const [pustaka, setPustaka] = useState(80);
  const [metodologi, setMetodologi] = useState(84);
  const [presentasi, setPresentasi] = useState(85);
  const [decision, setDecision] = useState<AcademicStatus>('Diperbaiki');
  const [notes, setNotes] = useState('');

  // Recap filters
  const [recapPeriod, setRecapPeriod] = useState('Semua');
  const [recapMajor, setRecapMajor] = useState('Semua');

  useEffect(() => {
    if (activeSubTab === 'rekap-hasil') {
      setTab('rekap-hasil');
    } else if (activeSubTab === 'input-hasil') {
      setTab('input-hasil');
    }

    if (focusedThesisId) {
      const target = theses.find((t) => t.id === focusedThesisId);
      if (target) {
        openModal(target);
      }
      clearFocus();
    }
  }, [activeSubTab, focusedThesisId, theses, clearFocus]);

  const assignedDefenses = useMemo(() => {
    if (!currentUser) return [];
    return theses.filter(
      (t) =>
        t.defenseSchedule &&
        (t.defenseSchedule.examiner1Id === currentUser.id ||
          t.defenseSchedule.examiner2Id === currentUser.id ||
          t.advisor1Id === currentUser.id ||
          t.advisor2Id === currentUser.id),
    );
  }, [theses, currentUser]);

  const recapPeriods = useMemo(
    () => ['Semua', ...Array.from(new Set(theses.map((t) => t.semester)))],
    [theses],
  );
  const recapMajors = useMemo(
    () => ['Semua', ...Array.from(new Set(theses.map((t) => t.programStudi)))],
    [theses],
  );

  const recapRecords = useMemo(
    () =>
      theses.filter((t) => {
        const hasDefense = Boolean(t.defenseSchedule) || t.stage !== 'Pengajuan Proposal';
        const okPeriod = recapPeriod === 'Semua' || t.semester === recapPeriod;
        const okMajor = recapMajor === 'Semua' || t.programStudi === recapMajor;
        return hasDefense && okPeriod && okMajor;
      }),
    [theses, recapPeriod, recapMajor],
  );

  const recapMatrixByMajor = useMemo(() => {
    const majors = Array.from(new Set(recapRecords.map((r) => r.programStudi)));
    return majors.map((major) => {
      const subset = recapRecords.filter((r) => r.programStudi === major);
      return {
        major,
        diterima: subset.filter((r) => r.status === 'Diterima').length,
        diperbaiki: subset.filter(
          (r) => r.status === 'Diperbaiki' || r.status === 'Perlu Revisi',
        ).length,
        bersyarat: subset.filter((r) => r.status === 'Perbaikan Bersyarat').length,
        ditolak: subset.filter((r) => r.status === 'Ditolak').length,
        total: subset.length,
      };
    });
  }, [recapRecords]);

  const previewWeighted = Number(
    (perumusan * 0.25 + pustaka * 0.2 + metodologi * 0.35 + presentasi * 0.2).toFixed(1),
  );

  const openModal = (record: ThesisRecord) => {
    setSelected(record);
    if (record.defenseScore) {
      setPerumusan(record.defenseScore.perumusanMasalah);
      setPustaka(record.defenseScore.tinjauanPustaka);
      setMetodologi(record.defenseScore.metodologi);
      setPresentasi(record.defenseScore.presentasiTanyaJawab);
    } else {
      setPerumusan(82);
      setPustaka(80);
      setMetodologi(84);
      setPresentasi(85);
    }
    setDecision(
      record.status === 'Diterima' ||
        record.status === 'Diperbaiki' ||
        record.status === 'Perbaikan Bersyarat' ||
        record.status === 'Ditolak'
        ? record.status
        : 'Diperbaiki',
    );
    setNotes('');
  };

  const handleDownloadProposal = (record: ThesisRecord) => {
    const latest = record.submissions[0];
    if (!latest) {
      showToast('Berkas proposal belum tersedia untuk diunduh.', 'error');
      return;
    }
    void downloadPdfPayload({
      id: latest.id,
      fileName: latest.fileName,
      title: latest.pdfTitle ?? latest.versionLabel,
      subtitle: `${record.studentName} (${record.studentNim})`,
      lines: latest.pdfLines ?? [
        `Judul: ${record.title}`,
        `Program Studi: ${record.programStudi}`,
        `Abstrak: ${record.abstract}`,
      ],
      hasRealBlob: latest.hasRealBlob,
    });
    showToast(`Mengunduh ${latest.fileName}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    if (!notes.trim()) {
      showToast('Catatan berita acara sidang wajib diisi.', 'error');
      return;
    }
    submitDefenseScore(
      selected.id,
      {
        perumusanMasalah: perumusan,
        tinjauanPustaka: pustaka,
        metodologi,
        presentasiTanyaJawab: presentasi,
      },
      decision,
      notes.trim(),
    );
    setSelected(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="headline-lg text-[#0B1C30]">Sidang Proposal &amp; Rekapitulasi</h1>
          <p className="body-base text-[#475569] mt-1">
            Penulisan hasil sidang proposal serta rekap status kelulusan per periode dan jurusan
          </p>
        </div>

        {tab === 'rekap-hasil' && (
          <button
            type="button"
            onClick={() => {
              exportThesesToCsv(recapRecords, lecturers, 'rekap-hasil-sidang-istts');
              showToast('Rekap hasil sidang berhasil diekspor ke CSV');
            }}
            className="btn-secondary shrink-0"
          >
            <Download className="w-4 h-4 stroke-[1.5]" />
            Ekspor Rekap CSV
          </button>
        )}
      </div>

      {/* Main Card with Tabs */}
      <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 overflow-hidden">
        <div className="flex items-center border-b border-[#E2E8F0] px-6 gap-6">
          <button
            type="button"
            onClick={() => setTab('input-hasil')}
            className={`relative py-4 body-semibold cursor-pointer ${
              tab === 'input-hasil' ? 'text-[#0F2A66]' : 'text-[#475569] hover:text-[#0F2A66]'
            }`}
          >
            Tulis Hasil Sidang ({assignedDefenses.length})
            {tab === 'input-hasil' && (
              <span className="absolute bottom-0 inset-x-0 h-[3px] bg-[#0F2A66]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setTab('rekap-hasil')}
            className={`relative py-4 body-semibold cursor-pointer ${
              tab === 'rekap-hasil' ? 'text-[#0F2A66]' : 'text-[#475569] hover:text-[#0F2A66]'
            }`}
          >
            Rekap Hasil Sidang Proposal
            {tab === 'rekap-hasil' && (
              <span className="absolute bottom-0 inset-x-0 h-[3px] bg-[#0F2A66]" />
            )}
          </button>
        </div>

        {tab === 'input-hasil' ? (
          assignedDefenses.length === 0 ? (
            <EmptyState message="Belum ada jadwal Sidang Proposal yang ditugaskan." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0]">
                    <th className="py-3 px-6 label-md uppercase text-[#475569]">Mahasiswa</th>
                    <th className="py-3 px-4 label-md uppercase text-[#475569]">Judul Proposal</th>
                    <th className="py-3 px-4 label-md uppercase text-[#475569]">Waktu &amp; Ruang</th>
                    <th className="py-3 px-4 label-md uppercase text-[#475569]">Status</th>
                    <th className="py-3 px-4 label-md uppercase text-[#475569] text-right">
                      Nilai
                    </th>
                    <th className="py-3 px-6 label-md uppercase text-[#475569] text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {assignedDefenses.map((item, idx) => (
                    <tr key={item.id} className={idx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'}>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <p className="body-semibold text-[#0B1C30]">{item.studentName}</p>
                        <p className="code-meta text-[#475569]">{item.studentNim}</p>
                      </td>
                      <td className="py-4 px-4 max-w-sm">
                        <p className="body-medium text-[#0B1C30]">{item.title}</p>
                        <p className="code-meta text-[#475569] mt-0.5">
                          {item.evaluations.length} catatan penilai tercatat
                        </p>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <p className="body-base text-[#0B1C30]">
                          {formatDateId(item.defenseSchedule!.date)}
                        </p>
                        <p className="code-meta text-[#475569]">
                          {item.defenseSchedule!.time} — {item.defenseSchedule!.room}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="py-4 px-4 body-semibold text-[#0F2A66] text-right whitespace-nowrap">
                        {item.defenseScore
                          ? `${item.defenseScore.totalScore.toFixed(1)} (${item.defenseScore.grade})`
                          : '-'}
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDownloadProposal(item)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 label-md text-[#1E293B] hover:bg-[#F1F5F9] cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 stroke-[1.5]" />
                            Unduh Proposal
                          </button>
                          <button
                            type="button"
                            onClick={() => openModal(item)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 label-md text-[#1E293B] hover:bg-[#F1F5F9] cursor-pointer"
                          >
                            <ClipboardEdit className="w-3.5 h-3.5 stroke-[1.5]" />
                            Tulis Hasil
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* Recap Tab */
          <div>
            <div className="p-6 border-b border-[#E2E8F0] bg-[#F8FAFC] grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="recap-period" className="block label-md text-[#0B1C30] mb-1.5">
                  Periode Akademik
                </label>
                <select
                  id="recap-period"
                  value={recapPeriod}
                  onChange={(e) => setRecapPeriod(e.target.value)}
                  className="input-field"
                >
                  {recapPeriods.map((p) => (
                    <option key={p} value={p}>
                      {p === 'Semua' ? 'Semua Periode' : p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="recap-major" className="block label-md text-[#0B1C30] mb-1.5">
                  Jurusan / Program Studi
                </label>
                <select
                  id="recap-major"
                  value={recapMajor}
                  onChange={(e) => setRecapMajor(e.target.value)}
                  className="input-field"
                >
                  {recapMajors.map((m) => (
                    <option key={m} value={m}>
                      {m === 'Semua' ? 'Semua Jurusan' : m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Structured Summary Matrix */}
            <div className="p-6 border-b border-[#E2E8F0]">
              <h2 className="headline-sm text-[#0B1C30] mb-4">
                Matriks Rekapitulasi Status per Jurusan
              </h2>
              {recapMatrixByMajor.length === 0 ? (
                <p className="body-base text-[#475569]">Tidak ada data pada filter ini.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-[#E2E8F0]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0]">
                        <th className="py-3 px-4 label-md uppercase text-[#475569]">Jurusan</th>
                        <th className="py-3 px-4 label-md uppercase text-[#15803D] text-right">
                          Diterima
                        </th>
                        <th className="py-3 px-4 label-md uppercase text-[#C2410C] text-right">
                          Diperbaiki
                        </th>
                        <th className="py-3 px-4 label-md uppercase text-[#C2410C] text-right">
                          Perbaikan Bersyarat
                        </th>
                        <th className="py-3 px-4 label-md uppercase text-[#B91C1C] text-right">
                          Ditolak
                        </th>
                        <th className="py-3 px-4 label-md uppercase text-[#0F2A66] text-right">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {recapMatrixByMajor.map((row, idx) => (
                        <tr key={row.major} className={idx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'}>
                          <td className="py-3 px-4 body-semibold text-[#0B1C30]">{row.major}</td>
                          <td className="py-3 px-4 body-medium text-[#0B1C30] text-right">
                            {row.diterima}
                          </td>
                          <td className="py-3 px-4 body-medium text-[#0B1C30] text-right">
                            {row.diperbaiki}
                          </td>
                          <td className="py-3 px-4 body-medium text-[#0B1C30] text-right">
                            {row.bersyarat}
                          </td>
                          <td className="py-3 px-4 body-medium text-[#0B1C30] text-right">
                            {row.ditolak}
                          </td>
                          <td className="py-3 px-4 body-semibold text-[#0F2A66] text-right">
                            {row.total}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Detailed Recap Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0]">
                    <th className="py-3 px-6 label-md uppercase text-[#475569]">Mahasiswa</th>
                    <th className="py-3 px-4 label-md uppercase text-[#475569]">Jurusan &amp; Periode</th>
                    <th className="py-3 px-4 label-md uppercase text-[#475569]">Judul</th>
                    <th className="py-3 px-4 label-md uppercase text-[#475569]">Keputusan</th>
                    <th className="py-3 px-6 label-md uppercase text-[#475569] text-right">
                      Nilai
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {recapRecords.map((item, idx) => (
                    <tr key={item.id} className={idx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'}>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <p className="body-semibold text-[#0B1C30]">{item.studentName}</p>
                        <p className="code-meta text-[#475569]">{item.studentNim}</p>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <p className="body-base text-[#0B1C30]">{item.programStudi}</p>
                        <p className="code-meta text-[#475569]">{item.semester}</p>
                      </td>
                      <td className="py-4 px-4 max-w-md body-medium text-[#0B1C30]">
                        {item.title}
                      </td>
                      <td className="py-4 px-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="py-4 px-6 body-semibold text-[#0F2A66] text-right whitespace-nowrap">
                        {item.defenseScore
                          ? `${item.defenseScore.totalScore.toFixed(1)} (${item.defenseScore.grade})`
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Modal Tulis Hasil Sidang */}
      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Tulis Hasil Sidang Proposal"
        maxWidthClass="max-w-3xl"
      >
        {selected && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-[#E2E8F0]">
              <div>
                <p className="code-meta text-[#475569]">
                  {selected.studentName} ({selected.studentNim}) — {selected.programStudi}
                </p>
                <h3 className="headline-sm text-[#0B1C30] mt-1">{selected.title}</h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {selected.submissions[0] && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const latest = selected.submissions[0];
                        openFilePreview({
                          id: latest.id,
                          fileName: latest.fileName,
                          title: latest.pdfTitle ?? latest.versionLabel,
                          subtitle: `${selected.studentName} (${selected.studentNim})`,
                          lines: latest.pdfLines ?? [`Judul: ${selected.title}`],
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
                      onClick={() => handleDownloadProposal(selected)}
                      className="btn-secondary"
                    >
                      <Download className="w-4 h-4 stroke-[1.5]" />
                      Unduh Proposal
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Catatan Penguji & Pembimbing Lain */}
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E2E8F0]">
                <h4 className="label-md uppercase text-[#0F2A66]">
                  Catatan Penguji &amp; Pembimbing Lain
                </h4>
              </div>
              {selected.evaluations.length === 0 ? (
                <p className="body-base text-[#475569] px-4 py-4">
                  Belum ada catatan dari penguji atau pembimbing lain.
                </p>
              ) : (
                <div className="divide-y divide-[#E2E8F0]">
                  {selected.evaluations.map((ev) => (
                    <div key={ev.id} className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="body-semibold text-[#0B1C30]">
                          {ev.evaluatorRole} — {ev.evaluatorName}
                        </p>
                        <StatusBadge status={ev.status} />
                      </div>
                      <p className="body-base text-[#0B1C30] mt-1">{ev.notes}</p>
                      <p className="code-meta text-[#64748B] mt-1">
                        {formatDateTimeId(ev.evaluatedAt)}
                        {typeof ev.score === 'number' ? ` — Skor: ${ev.score}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="rubric-1" className="block label-md text-[#0B1C30] mb-1.5">
                  Perumusan Masalah (25%)
                </label>
                <input
                  id="rubric-1"
                  type="number"
                  min={0}
                  max={100}
                  value={perumusan}
                  onChange={(e) => setPerumusan(Number(e.target.value))}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label htmlFor="rubric-2" className="block label-md text-[#0B1C30] mb-1.5">
                  Tinjauan Pustaka (20%)
                </label>
                <input
                  id="rubric-2"
                  type="number"
                  min={0}
                  max={100}
                  value={pustaka}
                  onChange={(e) => setPustaka(Number(e.target.value))}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label htmlFor="rubric-3" className="block label-md text-[#0B1C30] mb-1.5">
                  Kelayakan Metodologi (35%)
                </label>
                <input
                  id="rubric-3"
                  type="number"
                  min={0}
                  max={100}
                  value={metodologi}
                  onChange={(e) => setMetodologi(Number(e.target.value))}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label htmlFor="rubric-4" className="block label-md text-[#0B1C30] mb-1.5">
                  Presentasi &amp; Tanya Jawab (20%)
                </label>
                <input
                  id="rubric-4"
                  type="number"
                  min={0}
                  max={100}
                  value={presentasi}
                  onChange={(e) => setPresentasi(Number(e.target.value))}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
              <span className="body-medium text-[#475569]">Nilai Akhir Terbobot</span>
              <span className="headline-md text-[#0F2A66]">{previewWeighted.toFixed(1)}</span>
            </div>

            <div>
              <label htmlFor="def-decision" className="block label-md text-[#0B1C30] mb-1.5">
                Keputusan Hasil Sidang Proposal
              </label>
              <select
                id="def-decision"
                value={decision}
                onChange={(e) => setDecision(e.target.value as AcademicStatus)}
                className="input-field"
              >
                <option value="Diterima">Diterima</option>
                <option value="Diperbaiki">Diperbaiki</option>
                <option value="Perbaikan Bersyarat">Perbaikan Bersyarat</option>
                <option value="Ditolak">Ditolak</option>
              </select>
            </div>

            <div>
              <label htmlFor="def-notes" className="block label-md text-[#0B1C30] mb-1.5">
                Catatan Berita Acara Sidang
              </label>
              <textarea
                id="def-notes"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Cantumkan rincian revisi atau keputusan dewan penguji sidang proposal."
                className="textarea-field"
                required
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
              <button type="submit" className="btn-primary">
                Simpan Hasil Sidang
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
