import React, { useMemo, useState } from 'react';
import { Download, Eye, Search } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { usePortal } from '../../context/PortalContext';
import { AVAILABLE_TAGS } from '../../data/seedData';
import { ArchiveEntry } from '../../types/portal';
import { downloadPdfPayload } from '../../utils/format';

interface CariProposalPageProps {
  pageTitle?: string;
}

export const CariProposalPage: React.FC<CariProposalPageProps> = ({
  pageTitle = 'Cari Proposal & TA',
}) => {
  const { archive, lecturers, openFilePreview, showToast } = usePortal();
  const [query, setQuery] = useState('');
  const [advisorFilter, setAdvisorFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showEntries, setShowEntries] = useState(5);
  const [pageInput, setPageInput] = useState(1);
  const [selectedEntry, setSelectedEntry] = useState<ArchiveEntry | null>(null);

  const toggleTag = (tag: string) => {
    setPageInput(1);
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  // Simplified search: no checkboxes, only searches against non-empty fields + matching selected tags
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return archive.filter((item) => {
      const okQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.studentName.toLowerCase().includes(q) ||
        item.studentNim.includes(q) ||
        item.keywords.some((k) => k.toLowerCase().includes(q));
      const okAdvisor =
        !advisorFilter ||
        item.advisor1Name === advisorFilter ||
        item.advisor2Name === advisorFilter;
      const okType = !typeFilter || item.type === typeFilter;
      const okTags =
        selectedTags.length === 0 ||
        selectedTags.every((tag) => item.tags.includes(tag));
      return okQuery && okAdvisor && okType && okTags;
    });
  }, [archive, query, advisorFilter, typeFilter, selectedTags]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / showEntries));
  const currentPage = Math.min(Math.max(1, pageInput), totalPages);
  const pagedItems = filtered.slice(
    (currentPage - 1) * showEntries,
    currentPage * showEntries,
  );

  const toPdfPayload = (entry: ArchiveEntry) => ({
    id: entry.id,
    fileName: `${entry.studentNim}_${entry.type.replace(/\s+/g, '_')}_${entry.year}.pdf`,
    title: entry.title,
    subtitle: `${entry.studentName} (${entry.studentNim}) — ${entry.type}`,
    lines: [
      `Judul: ${entry.title}`,
      `Penulis: ${entry.studentName} (${entry.studentNim}) | IPK: ${entry.ipk.toFixed(2)}`,
      `Periode: ${entry.semester} | Perpanjangan: ${entry.isExtension ? 'Ya' : 'Tidak'}`,
      `Pembimbing: ${entry.advisor1Name}`,
      `Co-Pembimbing: ${entry.advisor2Name}`,
      `Tag: ${entry.tags.join(', ')}`,
      `Abstrak: ${entry.abstract}`,
    ],
    hasRealBlob: false,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="headline-lg text-[#0B1C30]">{pageTitle}</h1>
        <p className="body-base text-[#475569] mt-1">
          Pencarian repositori dokumen Proposal, Tugas Akhir, Tesis S2, dan Disertasi S3 ISTTS
        </p>
      </div>

      {/* Simplified Filter Panel (No Checkboxes, Tag Field, Show Entries) */}
      <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-5">
            <label htmlFor="archive-search" className="block label-md text-[#0B1C30] mb-1.5">
              Kata Kunci Judul, NRP, atau Nama
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 stroke-[1.5]" />
              <input
                id="archive-search"
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPageInput(1);
                }}
                placeholder="Kosongkan untuk menampilkan seluruh data..."
                className="input-field pl-9"
              />
            </div>
          </div>

          <div className="md:col-span-4">
            <label htmlFor="archive-adv" className="block label-md text-[#0B1C30] mb-1.5">
              Dosen Pembimbing
            </label>
            <select
              id="archive-adv"
              value={advisorFilter}
              onChange={(e) => {
                setAdvisorFilter(e.target.value);
                setPageInput(1);
              }}
              className="input-field"
            >
              <option value="">Semua Dosen</option>
              {lecturers.map((l) => (
                <option key={l.id} value={l.name}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label htmlFor="archive-type" className="block label-md text-[#0B1C30] mb-1.5">
              Jenis Dokumen
            </label>
            <select
              id="archive-type"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPageInput(1);
              }}
              className="input-field"
            >
              <option value="">Semua Jenis</option>
              <option value="Proposal TA">Proposal TA</option>
              <option value="Laporan TA">Laporan TA</option>
              <option value="Tesis S2">Tesis S2</option>
              <option value="Disertasi S3">Disertasi S3</option>
            </select>
          </div>
        </div>

        {/* Tag Selector Field */}
        <div>
          <span className="block label-md text-[#0B1C30] mb-2">
            Tag Topik (Menampilkan dokumen yang memuat seluruh tag terpilih)
          </span>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_TAGS.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full px-3 py-1 label-md border transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#0F2A66] text-white border-[#0F2A66]'
                      : 'bg-white text-[#475569] border-[#CBD5E1] hover:bg-[#F1F5F9]'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Results Table with Exact Columns + Show Entries + Direct Page Jump */}
      <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <label htmlFor="show-entries" className="body-medium text-[#475569]">
              Show Entries
            </label>
            <select
              id="show-entries"
              value={showEntries}
              onChange={(e) => {
                setShowEntries(Number(e.target.value));
                setPageInput(1);
              }}
              className="input-field w-24 h-9"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>
            <span className="code-meta text-[#475569]">{filtered.length} dokumen ditemukan</span>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="jump-page" className="body-medium text-[#475569]">
              Halaman
            </label>
            <input
              id="jump-page"
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => setPageInput(Number(e.target.value) || 1)}
              className="input-field w-20 h-9 text-center"
            />
            <span className="code-meta text-[#475569]">dari {totalPages}</span>
          </div>
        </div>

        {pagedItems.length === 0 ? (
          <EmptyState
            icon={Search}
            message="Tidak ditemukan dokumen Tugas Akhir atau Tesis yang sesuai dengan filter pencarian."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0]">
                  <th className="py-3 px-4 label-md uppercase text-[#475569]">NRP</th>
                  <th className="py-3 px-4 label-md uppercase text-[#475569]">Nama</th>
                  <th className="py-3 px-3 label-md uppercase text-[#475569] text-right">IPK</th>
                  <th className="py-3 px-4 label-md uppercase text-[#475569]">Judul</th>
                  <th className="py-3 px-4 label-md uppercase text-[#475569]">Pembimbing</th>
                  <th className="py-3 px-4 label-md uppercase text-[#475569]">Co-Pembimbing</th>
                  <th className="py-3 px-4 label-md uppercase text-[#475569]">Periode</th>
                  <th className="py-3 px-3 label-md uppercase text-[#475569]">Perpanjangan</th>
                  <th className="py-3 px-4 label-md uppercase text-[#475569] text-right">
                    Download
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {pagedItems.map((item, idx) => (
                  <tr key={item.id} className={idx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'}>
                    <td className="py-3.5 px-4 code-meta text-[#0B1C30] whitespace-nowrap">
                      {item.studentNim}
                    </td>
                    <td className="py-3.5 px-4 body-semibold text-[#0B1C30] whitespace-nowrap">
                      {item.studentName}
                    </td>
                    <td className="py-3.5 px-3 body-semibold text-[#0F2A66] text-right whitespace-nowrap">
                      {item.ipk.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <button
                        type="button"
                        onClick={() => setSelectedEntry(item)}
                        className="body-medium text-[#0B1C30] hover:text-[#0284C7] text-left cursor-pointer"
                      >
                        {item.title}
                      </button>
                      <p className="code-meta text-[#475569] mt-0.5">
                        {item.type} — {item.tags.join(', ')}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 code-meta text-[#0B1C30] max-w-[160px]">
                      {item.advisor1Name}
                    </td>
                    <td className="py-3.5 px-4 code-meta text-[#475569] max-w-[160px]">
                      {item.advisor2Name}
                    </td>
                    <td className="py-3.5 px-4 code-meta text-[#475569] whitespace-nowrap">
                      {item.semester}
                    </td>
                    <td className="py-3.5 px-3 code-meta text-[#0B1C30] whitespace-nowrap">
                      {item.isExtension ? 'Ya' : 'Tidak'}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedEntry(item)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#CBD5E1] bg-white px-2.5 py-1.5 label-md text-[#1E293B] hover:bg-[#F1F5F9] cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 stroke-[1.5]" />
                          Detail
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const payload = toPdfPayload(item);
                            void downloadPdfPayload(payload);
                            showToast(`Mengunduh ${payload.fileName}`);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#CBD5E1] bg-white px-2.5 py-1.5 label-md text-[#1E293B] hover:bg-[#F1F5F9] cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 stroke-[1.5]" />
                          Unduh
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
        open={Boolean(selectedEntry)}
        onClose={() => setSelectedEntry(null)}
        title="Detail Dokumen Arsip"
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
                  {selectedEntry.studentName} ({selectedEntry.studentNim}) — IPK{' '}
                  {selectedEntry.ipk.toFixed(2)}
                </p>
              </div>
              <div>
                <span className="label-md uppercase text-[#475569]">Periode &amp; Perpanjangan</span>
                <p className="body-medium text-[#0B1C30] mt-0.5">
                  {selectedEntry.semester} — {selectedEntry.isExtension ? 'Perpanjangan' : 'Reguler'}
                </p>
              </div>
              <div>
                <span className="label-md uppercase text-[#475569]">Pembimbing</span>
                <p className="body-base text-[#0B1C30] mt-0.5">{selectedEntry.advisor1Name}</p>
              </div>
              <div>
                <span className="label-md uppercase text-[#475569]">Co-Pembimbing</span>
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
                  openFilePreview(toPdfPayload(target));
                }}
                className="btn-primary"
              >
                Pratinjau Dokumen PDF
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
