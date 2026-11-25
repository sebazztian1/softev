import React, { useMemo, useState } from 'react';
import { Eye, ShieldCheck } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { usePortal } from '../../context/PortalContext';
import { AcademicStatus, ThesisRecord } from '../../types/portal';
import { formatDateId } from '../../utils/format';

export const VerifikasiProposalPage: React.FC = () => {
  const { theses, lecturers, openFilePreview, kaprodiVerifyProposal, showToast } = usePortal();
  const [filterStatus, setFilterStatus] = useState<'Semua' | AcademicStatus>('Semua');
  const [selected, setSelected] = useState<ThesisRecord | null>(null);
  const [decision, setDecision] = useState<AcademicStatus>('Diterima');
  const [advisor1, setAdvisor1] = useState('');
  const [advisor2, setAdvisor2] = useState('');
  const [notes, setNotes] = useState('');

  const rows = useMemo(() => {
    return theses.filter((t) => {
      const inScope = t.stage === 'Verifikasi Kaprodi' || t.stage === 'Pengajuan Proposal';
      const okStatus = filterStatus === 'Semua' || t.status === filterStatus;
      return inScope && okStatus;
    });
  }, [theses, filterStatus]);

  const getLoad = (lecturerId: string) =>
    theses.filter((t) => t.advisor1Id === lecturerId || t.advisor2Id === lecturerId).length;

  const openVerifyModal = (record: ThesisRecord) => {
    setSelected(record);
    setDecision(record.status === 'Ditolak' ? 'Ditolak' : 'Diterima');
    setAdvisor1(record.advisor1Id || record.proposedAdvisor1Id || lecturers[0]?.id || '');
    setAdvisor2(record.advisor2Id || record.proposedAdvisor2Id || lecturers[1]?.id || '');
    setNotes('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    if (!notes.trim()) {
      showToast('Catatan verifikasi Kaprodi wajib diisi.', 'error');
      return;
    }
    if (decision === 'Diterima' && (!advisor1 || !advisor2 || advisor1 === advisor2)) {
      showToast('Pilih Dosen Pembimbing 1 dan Pembimbing 2 yang berbeda.', 'error');
      return;
    }
    kaprodiVerifyProposal(selected.id, decision, advisor1, advisor2, notes.trim());
    setSelected(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="headline-lg text-[#0B1C30]">Verifikasi Proposal</h1>
          <p className="body-base text-[#475569] mt-1">
            Validasi kelayakan proposal masuk dan penetapan Dosen Pembimbing Tugas Akhir
          </p>
        </div>

        <div className="w-full sm:w-56">
          <select
            aria-label="Filter status verifikasi"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'Semua' | AcademicStatus)}
            className="input-field"
          >
            <option value="Semua">Semua Status</option>
            <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
            <option value="Diterima">Diterima</option>
            <option value="Perlu Revisi">Perlu Revisi</option>
            <option value="Ditolak">Ditolak</option>
          </select>
        </div>
      </div>

      <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <h2 className="headline-sm text-[#0B1C30]">Daftar Proposal Tahap Verifikasi</h2>
          <span className="code-meta text-[#475569]">{rows.length} proposal</span>
        </div>

        {rows.length === 0 ? (
          <EmptyState message="Tidak ada proposal pada kategori status yang dipilih." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0]">
                  <th className="py-3 px-6 label-md uppercase text-[#475569]">Mahasiswa</th>
                  <th className="py-3 px-4 label-md uppercase text-[#475569]">Judul Proposal</th>
                  <th className="py-3 px-4 label-md uppercase text-[#475569]">Status</th>
                  <th className="py-3 px-4 label-md uppercase text-[#475569] text-right">
                    Tanggal
                  </th>
                  <th className="py-3 px-6 label-md uppercase text-[#475569] text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {rows.map((item, idx) => (
                  <tr key={item.id} className={idx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'}>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <p className="body-semibold text-[#0B1C30]">{item.studentName}</p>
                      <p className="code-meta text-[#475569]">{item.studentNim}</p>
                    </td>
                    <td className="py-4 px-4 max-w-md">
                      <p className="body-medium text-[#0B1C30]">{item.title}</p>
                      <p className="code-meta text-[#475569] mt-0.5">{item.field}</p>
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
                        onClick={() => openVerifyModal(item)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 label-md text-[#1E293B] hover:bg-[#F1F5F9] cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 stroke-[1.5]" />
                        Verifikasi
                      </button>
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
        title="Verifikasi Proposal & Penetapan Pembimbing"
      >
        {selected && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="pb-3 border-b border-[#E2E8F0]">
              <p className="code-meta text-[#475569]">
                {selected.studentName} ({selected.studentNim}) — {selected.field}
              </p>
              <h3 className="headline-sm text-[#0B1C30] mt-1">{selected.title}</h3>
              <p className="body-base text-[#475569] mt-2">{selected.abstract}</p>
            </div>

            {selected.submissions[0] && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                <div className="min-w-0">
                  <p className="body-semibold text-[#0B1C30] truncate">
                    {selected.submissions[0].fileName}
                  </p>
                  <p className="code-meta text-[#475569]">{selected.submissions[0].versionLabel}</p>
                </div>
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
                  className="btn-secondary shrink-0"
                >
                  <Eye className="w-4 h-4 stroke-[1.5]" />
                  Pratinjau PDF
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="kap-adv1" className="block label-md text-[#0B1C30] mb-1.5">
                  Tetapkan Dosen Pembimbing 1
                </label>
                <select
                  id="kap-adv1"
                  value={advisor1}
                  onChange={(e) => setAdvisor1(e.target.value)}
                  className="input-field"
                >
                  {lecturers.map((lec) => (
                    <option key={lec.id} value={lec.id}>
                      {lec.name} ({getLoad(lec.id)}/{lec.maxQuota})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="kap-adv2" className="block label-md text-[#0B1C30] mb-1.5">
                  Tetapkan Dosen Pembimbing 2
                </label>
                <select
                  id="kap-adv2"
                  value={advisor2}
                  onChange={(e) => setAdvisor2(e.target.value)}
                  className="input-field"
                >
                  {lecturers.map((lec) => (
                    <option key={lec.id} value={lec.id}>
                      {lec.name} ({getLoad(lec.id)}/{lec.maxQuota})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="kap-decision" className="block label-md text-[#0B1C30] mb-1.5">
                Keputusan Verifikasi
              </label>
              <select
                id="kap-decision"
                value={decision}
                onChange={(e) => setDecision(e.target.value as AcademicStatus)}
                className="input-field"
              >
                <option value="Diterima">Diterima (Lanjut ke Penjadwalan Sidang)</option>
                <option value="Perlu Revisi">Perlu Revisi Administratif</option>
                <option value="Ditolak">Ditolak</option>
              </select>
            </div>

            <div>
              <label htmlFor="kap-notes" className="block label-md text-[#0B1C30] mb-1.5">
                Catatan Keputusan Kaprodi
              </label>
              <textarea
                id="kap-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tuliskan alasan persetujuan, penetapan pembimbing, atau catatan perbaikan."
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
                Simpan Keputusan
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
