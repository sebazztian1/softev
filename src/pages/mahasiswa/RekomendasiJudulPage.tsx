import React, { useMemo, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { usePortal } from '../../context/PortalContext';
import { TopicRecommendation } from '../../types/portal';

export const RekomendasiJudulPage: React.FC = () => {
  const { topics, claimTopicForProposal } = usePortal();
  const [fieldFilter, setFieldFilter] = useState('Semua');
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Tersedia' | 'Reserved' | 'Penuh'>(
    'Semua',
  );
  const [selectedTopic, setSelectedTopic] = useState<TopicRecommendation | null>(null);

  const fields = useMemo(
    () => ['Semua', ...Array.from(new Set(topics.map((t) => t.field)))],
    [topics],
  );

  const filtered = useMemo(
    () =>
      topics.filter((t) => {
        const okField = fieldFilter === 'Semua' || t.field === fieldFilter;
        const okStatus = statusFilter === 'Semua' || t.status === statusFilter;
        return okField && okStatus;
      }),
    [topics, fieldFilter, statusFilter],
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="headline-lg text-[#0B1C30]">Rekomendasi Judul</h1>
        <p className="body-base text-[#475569] mt-1">
          Daftar penawaran topik penelitian Tugas Akhir dari Dosen Program Studi S1 Informatika
        </p>
      </div>

      {/* Filters */}
      <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="rec-field" className="block label-md text-[#0B1C30] mb-1.5">
              Bidang Minat
            </label>
            <select
              id="rec-field"
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
          <div>
            <label htmlFor="rec-status" className="block label-md text-[#0B1C30] mb-1.5">
              Status Kuota
            </label>
            <select
              id="rec-status"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as 'Semua' | 'Tersedia' | 'Reserved' | 'Penuh',
                )
              }
              className="input-field"
            >
              <option value="Semua">Semua</option>
              <option value="Tersedia">Tersedia</option>
              <option value="Reserved">Reserved</option>
              <option value="Penuh">Penuh</option>
            </select>
          </div>
        </div>
      </section>

      {/* Topic List inside single Level 1 container */}
      <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <h2 className="headline-sm text-[#0B1C30]">Penawaran Topik Dosen</h2>
          <span className="code-meta text-[#475569]">{filtered.length} topik</span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            message="Tidak ada topik rekomendasi yang sesuai dengan filter yang dipilih."
          />
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {filtered.map((topic, idx) => {
              const unavailable = topic.status !== 'Tersedia';
              return (
                <div
                  key={topic.id}
                  className={`p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    idx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'
                  }`}
                >
                  <div className="space-y-1.5 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <StatusBadge status={topic.status} />
                      <span className="code-meta text-[#475569]">{topic.field}</span>
                      <span className="code-meta text-[#475569]">
                        Kuota: {topic.takenCount}/{topic.quota} mahasiswa
                      </span>
                    </div>
                    <h3 className="headline-sm text-[#0B1C30]">{topic.title}</h3>
                    <p className="body-base text-[#475569]">{topic.description}</p>
                    <p className="code-meta text-[#0F2A66]">
                      Dosen Pengusul: {topic.lecturerName}
                      {topic.status === 'Reserved' && topic.reservedByName
                        ? ` — Diambil oleh ${topic.reservedByName}`
                        : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedTopic(topic)}
                      className="btn-secondary"
                    >
                      Lihat Detail
                    </button>
                    <button
                      type="button"
                      disabled={unavailable}
                      onClick={() => claimTopicForProposal(topic)}
                      className="btn-secondary"
                    >
                      {topic.status === 'Reserved' ? 'Sudah Reserved' : 'Ajukan Topik'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Modal
        open={Boolean(selectedTopic)}
        onClose={() => setSelectedTopic(null)}
        title="Detail Rekomendasi Judul"
      >
        {selectedTopic && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <span className="code-meta text-[#475569]">{selectedTopic.field}</span>
              <StatusBadge status={selectedTopic.status} />
            </div>
            <h3 className="headline-sm text-[#0B1C30]">{selectedTopic.title}</h3>
            <p className="body-base text-[#0B1C30]">{selectedTopic.description}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3 border-y border-[#E2E8F0]">
              <div>
                <span className="label-md uppercase text-[#475569]">Dosen Pengusul</span>
                <p className="body-medium text-[#0B1C30] mt-0.5">{selectedTopic.lecturerName}</p>
              </div>
              <div>
                <span className="label-md uppercase text-[#475569]">Kuota Tersedia</span>
                <p className="body-medium text-[#0B1C30] mt-0.5">
                  {selectedTopic.takenCount} dari {selectedTopic.quota} mahasiswa
                </p>
              </div>
            </div>

            <div>
              <span className="label-md uppercase text-[#475569]">Prasyarat Teknis</span>
              <p className="body-base text-[#0B1C30] mt-1">{selectedTopic.prerequisites}</p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setSelectedTopic(null)}
                className="btn-secondary"
              >
                Tutup
              </button>
              <button
                type="button"
                disabled={selectedTopic.status !== 'Tersedia'}
                onClick={() => {
                  const chosen = selectedTopic;
                  setSelectedTopic(null);
                  claimTopicForProposal(chosen);
                }}
                className="btn-primary"
              >
                Ajukan Topik Ini
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
