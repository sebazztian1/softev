import React, { useMemo, useState } from 'react';
import { ClipboardEdit, Eye } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { usePortal } from '../../context/PortalContext';
import { AcademicStatus, ThesisRecord } from '../../types/portal';
import { formatDateId } from '../../utils/format';

export const SidangPenilaianPage: React.FC = () => {
  const { currentUser, theses, openFilePreview, submitDefenseScore, showToast } = usePortal();
  const [selected, setSelected] = useState<ThesisRecord | null>(null);
  const [perumusan, setPerumusan] = useState(82);
  const [pustaka, setPustaka] = useState(80);
  const [metodologi, setMetodologi] = useState(84);
  const [presentasi, setPresentasi] = useState(85);
  const [decision, setDecision] = useState<AcademicStatus>('Perlu Revisi');
  const [notes, setNotes] = useState('');

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
    setDecision(record.status === 'Diterima' ? 'Diterima' : 'Perlu Revisi');
    setNotes('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    if (!notes.trim()) {
      showToast('Berita acara / catatan sidang wajib diisi.', 'error');
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
      <div>
        <h1 className="headline-lg text-[#0B1C30]">Sidang &amp; Penilaian</h1>
        <p className="body-base text-[#475569] mt-1">
          Jadwal pengujian dan pengisian rubrik penilaian Sidang Proposal
        </p>
      </div>

      <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <h2 className="headline-sm text-[#0B1C30]">Daftar Sidang Proposal</h2>
          <span className="code-meta text-[#475569]">{assignedDefenses.length} jadwal</span>
        </div>

        {assignedDefenses.length === 0 ? (
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
                    Nilai Akhir
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
                        {item.submissions[0] && (
                          <button
                            type="button"
                            onClick={() => {
                              const latest = item.submissions[0];
                              openFilePreview({
                                id: latest.id,
                                fileName: latest.fileName,
                                title: latest.pdfTitle ?? latest.versionLabel,
                                subtitle: `${item.studentName} (${item.studentNim})`,
                                lines: latest.pdfLines ?? [`Judul: ${item.title}`],
                                hasRealBlob: latest.hasRealBlob,
                              });
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 label-md text-[#1E293B] hover:bg-[#F1F5F9] cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 stroke-[1.5]" />
                            Naskah
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openModal(item)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 label-md text-[#1E293B] hover:bg-[#F1F5F9] cursor-pointer"
                        >
                          <ClipboardEdit className="w-3.5 h-3.5 stroke-[1.5]" />
                          Input Penilaian
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Input Nilai Sidang Proposal"
      >
        {selected && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="pb-3 border-b border-[#E2E8F0]">
              <p className="code-meta text-[#475569]">
                {selected.studentName} ({selected.studentNim})
              </p>
              <h3 className="headline-sm text-[#0B1C30] mt-1">{selected.title}</h3>
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
                Keputusan Sidang Proposal
              </label>
              <select
                id="def-decision"
                value={decision}
                onChange={(e) => setDecision(e.target.value as AcademicStatus)}
                className="input-field"
              >
                <option value="Diterima">Diterima tanpa revisi</option>
                <option value="Perlu Revisi">Lulus dengan Perlu Revisi</option>
                <option value="Ditolak">Ditolak / Mengulang Sidang</option>
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
                placeholder="Cantumkan rincian revisi yang harus diselesaikan mahasiswa."
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
                Simpan Penilaian
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
