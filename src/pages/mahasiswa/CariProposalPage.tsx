import React, { useMemo, useState } from 'react';
import { Eye, Search } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { usePortal } from '../../context/PortalContext';
import { ArchiveEntry } from '../../types/portal';

interface CariProposalPageProps {
  pageTitle?: string;
}

export const CariProposalPage: React.FC<CariProposalPageProps> = ({
  pageTitle = 'Cari Proposal & TA',
}) => {
  const { archive, openFilePreview } = usePortal();
  const [query, setQuery] = useState('');
  const [fieldFilter, setFieldFilter] = useState('Semua');
  const [typeFilter, setTypeFilter] = useState('Semua');
  const [selectedEntry, setSelectedEntry] = useState<ArchiveEntry | null>(null);

  const fields = useMemo(
    () => ['Semua', ...Array.from(new Set(archive.map((a) => a.field)))],
    [archive],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return archive.filter((item) => {
      const matchesQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.studentName.toLowerCase().includes(q) ||
        item.studentNim.includes(q) ||
        item.keywords.some((k) => k.toLowerCase().includes(q));
      const matchesField = fieldFilter === 'Semua' || item.field === fieldFilter;
      const matchesType = typeFilter === 'Semua' || item.type === typeFilter;
      return matchesQuery && matchesField && matchesType;
    });
  }, [archive, query, fieldFilter, typeFilter]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="headline-lg text-[#0B1C30]">{pageTitle}</h1>
        <p className="body-base text-[#475569] mt-1">
          Direktori repositori proposal dan laporan Tugas Akhir ISTTS
        </p>
      </div>

      {/* Filter Panel */}
      <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 p-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6">
            <label htmlFor="archive-search" className="block label-md text-[#0B1C30] mb-1.5">
              Kata Kunci Judul, Penulis, atau Topik
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 stroke-[1.5]" />
              <input
                id="archive-search"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari judul, NIM, nama mahasiswa, atau kata kunci..."
                className="input-field pl-9"
              />
            </div>
          </div>

          <div className="md:col-span-4">
            <label htmlFor="archive-field" className="block label-md text-[#0B1C30] mb-1.5">
              Bidang Minat
            </label>
            <select
              id="archive-field"
              value={fieldFilter}
              onChange={(e) => setFieldFilter(e.target.value)}
              className="input-field"
            >
              {fields.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="archive-type" className="block label-md text-[#0B1C30] mb-1.5">
              Jenis Berkas
            </label>
            <select
              id="archive-type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input-field"
            >
              <option value="Semua">Semua</option>
              <option value="Proposal TA">Proposal TA</option>
              <option value="Laporan TA">Laporan TA</option>
            </select>
          </div>
        </div>
      </section>

      {/* Results Table */}
      <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <h2 className="headline-sm text-[#0B1C30]">Hasil Penelusuran Arsip</h2>
          <span className="code-meta text-[#475569]">{filtered.length} dokumen ditemukan</span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            message="Tidak ditemukan arsip proposal atau Tugas Akhir yang sesuai dengan filter pencarian."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0]">
                  <th className="py-3 px-6 label-md uppercase text-[#475569]">Judul &amp; Kata Kunci</th>
                  <th className="py-3 px-4 label-md uppercase text-[#475569]">Penulis</th>
                  <th className="py-3 px-4 label-md uppercase text-[#475569]">Bidang</th>
                  <th className="py-3 px-4 label-md uppercase text-[#475569] text-right">Tahun</th>
                  <th className="py-3 px-6 label-md uppercase text-[#475569] text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filtered.map((item, idx) => (
                  <tr key={item.id} className={idx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'}>
                    <td className="py-4 px-6 max-w-md">
                      <p className="body-semibold text-[#0B1C30]">{item.title}</p>
                      <p className="code-meta text-[#475569] mt-1">
                        {item.type} — {item.keywords.join(', ')}
                      </p>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <p className="body-medium text-[#0B1C30]">{item.studentName}</p>
                      <p className="code-meta text-[#475569]">{item.studentNim}</p>
                    </td>
                    <td className="py-4 px-4 body-base text-[#0B1C30]">{item.field}</td>
                    <td className="py-4 px-4 code-meta text-[#475569] text-right whitespace-nowrap">
                      {item.year}
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedEntry(item)}
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
        open={Boolean(selectedEntry)}
        onClose={() => setSelectedEntry(null)}
        title="Detail Arsip Tugas Akhir"
      >
        {selectedEntry && (
          <div className="space-y-4">
            <div>
              <span className="label-md uppercase text-[#475569]">{selectedEntry.type}</span>
              <h3 className="headline-sm text-[#0B1C30] mt-1">{selectedEntry.title}</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3 border-y border-[#E2E8F0]">
              <div>
                <span className="label-md uppercase text-[#475569]">Penulis</span>
                <p className="body-medium text-[#0B1C30] mt-0.5">
                  {selectedEntry.studentName} ({selectedEntry.studentNim})
                </p>
              </div>
              <div>
                <span className="label-md uppercase text-[#475569]">Tahun &amp; Bidang</span>
                <p className="body-medium text-[#0B1C30] mt-0.5">
                  {selectedEntry.year} — {selectedEntry.field}
                </p>
              </div>
              <div>
                <span className="label-md uppercase text-[#475569]">Pembimbing 1</span>
                <p className="body-base text-[#0B1C30] mt-0.5">{selectedEntry.advisor1Name}</p>
              </div>
              <div>
                <span className="label-md uppercase text-[#475569]">Pembimbing 2</span>
                <p className="body-base text-[#0B1C30] mt-0.5">{selectedEntry.advisor2Name}</p>
              </div>
            </div>

            <div>
              <span className="label-md uppercase text-[#475569]">Abstrak</span>
              <p className="body-base text-[#0B1C30] mt-1">{selectedEntry.abstract}</p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                className="btn-secondary"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = selectedEntry;
                  setSelectedEntry(null);
                  openFilePreview({
                    id: target.id,
                    fileName: `${target.studentNim}_Ringkasan_${target.year}.pdf`,
                    title: target.title,
                    subtitle: `${target.studentName} (${target.studentNim}) — ${target.type}`,
                    lines: [
                      `Judul: ${target.title}`,
                      `Penulis: ${target.studentName} (${target.studentNim})`,
                      `Pembimbing 1: ${target.advisor1Name}`,
                      `Pembimbing 2: ${target.advisor2Name}`,
                      `Abstrak: ${target.abstract}`,
                    ],
                    hasRealBlob: false,
                  });
                }}
                className="btn-primary"
              >
                Pratinjau Dokumen Ringkasan
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
