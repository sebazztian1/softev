import React, { useMemo, useState } from 'react';
import { Eye, FileCheck2 } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { FileDropzone } from '../../components/ui/FileDropzone';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { usePortal } from '../../context/PortalContext';
import { AcademicStatus, ThesisRecord } from '../../types/portal';
import { formatDateId, getLecturerName } from '../../utils/format';

export const MahasiswaBimbinganPage: React.FC = () => {
  const {
    currentUser,
    theses,
    lecturers,
    openFilePreview,
    submitDosenEvaluation,
    showToast,
  } = usePortal();

  const [statusFilter, setStatusFilter] = useState<'Semua' | AcademicStatus>('Semua');
  const [selected, setSelected] = useState<ThesisRecord | null>(null);
  const [decision, setDecision] = useState<AcademicStatus>('Diterima');
  const [notes, setNotes] = useState('');
  const [correctionFile, setCorrectionFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const supervised = useMemo(() => {
    if (!currentUser) return [];
    return theses.filter((item) => {
      const isAdvisor =
        item.advisor1Id === currentUser.id ||
        item.advisor2Id === currentUser.id ||
        item.proposedAdvisor1Id === currentUser.id;
      const matchesStatus = statusFilter === 'Semua' || item.status === statusFilter;
      return isAdvisor && matchesStatus;
    });
  }, [theses, currentUser, statusFilter]);

  const openEvaluationModal = (record: ThesisRecord) => {
    setSelected(record);
    setDecision(record.status === 'Diterima' ? 'Diterima' : 'Perlu Revisi');
    setNotes('');
    setCorrectionFile(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    if (!notes.trim()) {
      showToast('Catatan evaluasi wajib diisi.', 'error');
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="headline-lg text-[#0B1C30]">Mahasiswa Bimbingan</h1>
          <p className="body-base text-[#475569] mt-1">
            Pemeriksaan naskah proposal, berkas revisi, dan catatan bimbingan mahasiswa
          </p>
        </div>

        <div className="w-full sm:w-56">
          <select
            aria-label="Filter status bimbingan"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'Semua' | AcademicStatus)}
            className="input-field"
          >
            <option value="Semua">Semua Status</option>
            <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
            <option value="Perlu Revisi">Perlu Revisi</option>
            <option value="Diterima">Diterima</option>
            <option value="Ditolak">Ditolak</option>
          </select>
        </div>
      </div>

      <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <h2 className="headline-sm text-[#0B1C30]">Daftar Mahasiswa Bimbingan</h2>
          <span className="code-meta text-[#475569]">{supervised.length} mahasiswa</span>
        </div>

        {supervised.length === 0 ? (
          <EmptyState message="Tidak ada data mahasiswa bimbingan pada filter status ini." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0]">
                  <th className="py-3 px-6 label-md uppercase text-[#475569]">Mahasiswa</th>
                  <th className="py-3 px-4 label-md uppercase text-[#475569]">Judul Tugas Akhir</th>
                  <th className="py-3 px-4 label-md uppercase text-[#475569]">Tahap</th>
                  <th className="py-3 px-4 label-md uppercase text-[#475569]">Status</th>
                  <th className="py-3 px-4 label-md uppercase text-[#475569] text-right">
                    Pembaruan
                  </th>
                  <th className="py-3 px-6 label-md uppercase text-[#475569] text-right">Aksi</th>
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
                      <p className="code-meta text-[#475569] mt-0.5">{item.field}</p>
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
                        Periksa &amp; Evaluasi
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
        title="Pemeriksaan Berkas & Evaluasi Bimbingan"
      >
        {selected && (
          <form onSubmit={handleSave} className="space-y-5">
            <div className="pb-4 border-b border-[#E2E8F0]">
              <p className="code-meta text-[#475569]">
                {selected.studentName} ({selected.studentNim}) — {selected.stage}
              </p>
              <h3 className="headline-sm text-[#0B1C30] mt-1">{selected.title}</h3>
              <p className="code-meta text-[#475569] mt-1">
                Pembimbing 1: {getLecturerName(lecturers, selected.advisor1Id)} | Pembimbing 2:{' '}
                {getLecturerName(lecturers, selected.advisor2Id)}
              </p>
            </div>

            {selected.submissions[0] && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                <div className="min-w-0">
                  <p className="body-semibold text-[#0B1C30] truncate">
                    {selected.submissions[0].fileName}
                  </p>
                  <p className="code-meta text-[#475569] mt-0.5">
                    {selected.submissions[0].versionLabel} — {selected.submissions[0].summary}
                  </p>
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
                Catatan Evaluasi untuk Mahasiswa
              </label>
              <textarea
                id="eval-notes"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tuliskan poin revisi atau catatan persetujuan secara jelas dan terstruktur."
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
                {saving ? 'Menyimpan...' : 'Simpan Evaluasi'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
