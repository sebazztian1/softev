import React, { useMemo, useState } from 'react';
import { Download, Eye, Search } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { usePortal } from '../../context/PortalContext';
import { AcademicStatus, ThesisRecord, ThesisStage } from '../../types/portal';
import {
  exportThesesToCsv,
  formatDateId,
  formatDateTimeId,
  getLecturerName,
} from '../../utils/format';

export const MonitoringTaPage: React.FC = () => {
  const { theses, lecturers, openFilePreview, showToast } = usePortal();
  const [query, setQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<'Semua' | ThesisStage>('Semua');
  const [statusFilter, setStatusFilter] = useState<'Semua' | AcademicStatus>('Semua');
  const [advisorFilter, setAdvisorFilter] = useState('Semua');
  const [selected, setSelected] = useState<ThesisRecord | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return theses.filter((item) => {
      const okQuery =
        !q ||
        item.studentName.toLowerCase().includes(q) ||
        item.studentNim.includes(q) ||
        item.title.toLowerCase().includes(q);
      const okStage = stageFilter === 'Semua' || item.stage === stageFilter;
      const okStatus = statusFilter === 'Semua' || item.status === statusFilter;
      const okAdvisor =
        advisorFilter === 'Semua' ||
        item.advisor1Id === advisorFilter ||
        item.advisor2Id === advisorFilter;
      return okQuery && okStage && okStatus && okAdvisor;
    });
  }, [theses, query, stageFilter, statusFilter, advisorFilter]);

  const handleExport = () => {
    exportThesesToCsv(filtered, lecturers);
    showToast('Rekap monitoring Tugas Akhir berhasil diekspor ke berkas CSV');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="headline-lg text-[#0B1C30]">Monitoring TA</h1>
          <p className="body-base text-[#475569] mt-1">
            Pemantauan progres seluruh mahasiswa Tugas Akhir Program Studi S1 Informatika
          </p>
        </div>

        <button type="button" onClick={handleExport} className="btn-secondary shrink-0">
          <Download className="w-4 h-4 stroke-[1.5]" />
          Ekspor CSV
        </button>
      </div>

      {/* Filters */}
      <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4">
            <label htmlFor="mon-search" className="block label-md text-[#0B1C30] mb-1.5">
              Cari NIM, Nama, atau Judul
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 stroke-[1.5]" />
              <input
                id="mon-search"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ketik NIM atau nama mahasiswa..."
                className="input-field pl-9"
              />
            </div>
          </div>

          <div className="lg:col-span-3">
            <label htmlFor="mon-stage" className="block label-md text-[#0B1C30] mb-1.5">
              Tahap
            </label>
            <select
              id="mon-stage"
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value as 'Semua' | ThesisStage)}
              className="input-field"
            >
              <option value="Semua">Semua Tahap</option>
              <option value="Pengajuan Proposal">Pengajuan Proposal</option>
              <option value="Verifikasi Kaprodi">Verifikasi Kaprodi</option>
              <option value="Sidang Proposal">Sidang Proposal</option>
              <option value="Revisi Proposal">Revisi Proposal</option>
              <option value="Pengesahan Akhir">Pengesahan Akhir</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="mon-status" className="block label-md text-[#0B1C30] mb-1.5">
              Status
            </label>
            <select
              id="mon-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'Semua' | AcademicStatus)}
              className="input-field"
            >
              <option value="Semua">Semua</option>
              <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
              <option value="Perlu Revisi">Perlu Revisi</option>
              <option value="Diterima">Diterima</option>
              <option value="Ditolak">Ditolak</option>
            </select>
          </div>

          <div className="lg:col-span-3">
            <label htmlFor="mon-adv" className="block label-md text-[#0B1C30] mb-1.5">
              Dosen Pembimbing
            </label>
            <select
              id="mon-adv"
              value={advisorFilter}
              onChange={(e) => setAdvisorFilter(e.target.value)}
              className="input-field"
            >
              <option value="Semua">Semua Dosen</option>
              {lecturers.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Monitoring Table */}
      <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <h2 className="headline-sm text-[#0B1C30]">Data Progres Mahasiswa Tugas Akhir</h2>
          <span className="code-meta text-[#475569]">{filtered.length} mahasiswa</span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState message="Tidak ada data Tugas Akhir yang sesuai dengan kriteria filter." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0]">
                  <th className="py-3 px-6 label-md uppercase text-[#475569]">Mahasiswa</th>
                  <th className="py-3 px-4 label-md uppercase text-[#475569]">Judul &amp; Pembimbing</th>
                  <th className="py-3 px-4 label-md uppercase text-[#475569]">Tahap</th>
                  <th className="py-3 px-4 label-md uppercase text-[#475569]">Status</th>
                  <th className="py-3 px-4 label-md uppercase text-[#475569] text-right">
                    Pembaruan
                  </th>
                  <th className="py-3 px-6 label-md uppercase text-[#475569] text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filtered.map((item, idx) => (
                  <tr key={item.id} className={idx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'}>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <p className="body-semibold text-[#0B1C30]">{item.studentName}</p>
                      <p className="code-meta text-[#475569]">{item.studentNim}</p>
                    </td>
                    <td className="py-4 px-4 max-w-md">
                      <p className="body-medium text-[#0B1C30]">{item.title}</p>
                      <p className="code-meta text-[#475569] mt-0.5">
                        Pembimbing 1: {getLecturerName(lecturers, item.advisor1Id)}
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
                        onClick={() => setSelected(item)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 label-md text-[#1E293B] hover:bg-[#F1F5F9] cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 stroke-[1.5]" />
                        Detail
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
        title="Detail Progres Tugas Akhir"
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
              <div>
                <p className="code-meta text-[#475569]">
                  {selected.studentName} ({selected.studentNim}) — {selected.stage}
                </p>
                <h3 className="headline-sm text-[#0B1C30] mt-1">{selected.title}</h3>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="label-md uppercase text-[#475569]">Pembimbing 1</span>
                <p className="body-medium text-[#0B1C30] mt-0.5">
                  {getLecturerName(lecturers, selected.advisor1Id)}
                </p>
              </div>
              <div>
                <span className="label-md uppercase text-[#475569]">Pembimbing 2</span>
                <p className="body-medium text-[#0B1C30] mt-0.5">
                  {getLecturerName(lecturers, selected.advisor2Id)}
                </p>
              </div>
            </div>

            <div>
              <h4 className="label-md uppercase text-[#475569] mb-2">Riwayat Berkas</h4>
              <div className="rounded-xl border border-[#E2E8F0] divide-y divide-[#E2E8F0]">
                {selected.submissions.map((sub) => (
                  <div key={sub.id} className="p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="body-semibold text-[#0B1C30] truncate">
                        {sub.versionLabel} — {sub.fileName}
                      </p>
                      <p className="code-meta text-[#475569]">
                        {formatDateTimeId(sub.uploadedAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        openFilePreview({
                          id: sub.id,
                          fileName: sub.fileName,
                          title: sub.pdfTitle ?? sub.versionLabel,
                          subtitle: `${selected.studentName} (${selected.studentNim})`,
                          lines: sub.pdfLines ?? [`Judul: ${selected.title}`],
                          hasRealBlob: sub.hasRealBlob,
                        })
                      }
                      className="btn-secondary shrink-0"
                    >
                      Pratinjau
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="btn-secondary"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
