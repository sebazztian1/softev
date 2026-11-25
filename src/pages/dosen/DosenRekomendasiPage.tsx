import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { usePortal } from '../../context/PortalContext';
import { TopicRecommendation } from '../../types/portal';

export const DosenRekomendasiPage: React.FC = () => {
  const {
    currentUser,
    topics,
    addTopicRecommendation,
    setTopicStatus,
    deleteTopicRecommendation,
    showToast,
  } = usePortal();

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [field, setField] = useState('Computer Vision & Embedded AI');
  const [quota, setQuota] = useState(2);
  const [description, setDescription] = useState('');
  const [prerequisites, setPrerequisites] = useState('');

  if (!currentUser) return null;

  const myTopics = topics.filter((t) => t.lecturerId === currentUser.id);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      showToast('Judul dan deskripsi topik wajib diisi.', 'error');
      return;
    }
    addTopicRecommendation({
      title: title.trim(),
      field,
      quota,
      description: description.trim(),
      prerequisites: prerequisites.trim() || 'Sesuai kurikulum semester 7 S1 Informatika.',
    });
    setTitle('');
    setDescription('');
    setPrerequisites('');
    setModalOpen(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="headline-lg text-[#0B1C30]">Rekomendasi Judul Proposal</h1>
          <p className="body-base text-[#475569] mt-1">
            Tambahkan ide topik penelitian baru dan pantau status Reserved saat diambil mahasiswa
          </p>
        </div>
        <button type="button" onClick={() => setModalOpen(true)} className="btn-primary shrink-0">
          <Plus className="w-4 h-4 stroke-[1.75]" />
          Tambah Topik Baru
        </button>
      </div>

      <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <h2 className="headline-sm text-[#0B1C30]">Daftar Topik yang Anda Tawarkan</h2>
          <span className="code-meta text-[#475569]">{myTopics.length} topik</span>
        </div>

        {myTopics.length === 0 ? (
          <EmptyState message="Anda belum menambahkan penawaran topik Tugas Akhir pada periode ini." />
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {myTopics.map((topic, idx) => (
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
                  {topic.status === 'Reserved' && topic.reservedByName && (
                    <p className="code-meta text-[#1D4ED8] font-semibold">
                      Diambil oleh: {topic.reservedByName}
                      {topic.reservedByNim ? ` (${topic.reservedByNim})` : ''}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <select
                    aria-label={`Ubah status topik ${topic.title}`}
                    value={topic.status}
                    onChange={(e) =>
                      setTopicStatus(
                        topic.id,
                        e.target.value as TopicRecommendation['status'],
                      )
                    }
                    className="input-field w-36"
                  >
                    <option value="Tersedia">Tersedia</option>
                    <option value="Reserved">Reserved</option>
                    <option value="Penuh">Penuh</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => deleteTopicRecommendation(topic.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#FCA5A5] bg-white px-3 h-[42px] label-md text-[#B91C1C] hover:bg-[#FEE2E2] cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 stroke-[1.5]" />
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Tambah Rekomendasi Topik">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label htmlFor="topic-title" className="block label-md text-[#0B1C30] mb-1.5">
              Judul Topik Tugas Akhir
            </label>
            <input
              id="topic-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tuliskan judul topik penelitian yang ditawarkan"
              className="input-field"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="topic-field" className="block label-md text-[#0B1C30] mb-1.5">
                Bidang Minat
              </label>
              <select
                id="topic-field"
                value={field}
                onChange={(e) => setField(e.target.value)}
                className="input-field"
              >
                <option value="Computer Vision & Embedded AI">Computer Vision &amp; Embedded AI</option>
                <option value="Natural Language Processing">Natural Language Processing</option>
                <option value="Rekayasa Perangkat Lunak">Rekayasa Perangkat Lunak</option>
                <option value="Keamanan Jaringan & Cloud">Keamanan Jaringan &amp; Cloud</option>
                <option value="Data Engineering & Distributed Systems">
                  Data Engineering &amp; Distributed Systems
                </option>
              </select>
            </div>
            <div>
              <label htmlFor="topic-quota" className="block label-md text-[#0B1C30] mb-1.5">
                Kuota Mahasiswa
              </label>
              <input
                id="topic-quota"
                type="number"
                min={1}
                max={5}
                value={quota}
                onChange={(e) => setQuota(Number(e.target.value))}
                className="input-field"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="topic-desc" className="block label-md text-[#0B1C30] mb-1.5">
              Deskripsi Topik
            </label>
            <textarea
              id="topic-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan ruang lingkup sistem dan target penelitian."
              className="textarea-field"
              required
            />
          </div>

          <div>
            <label htmlFor="topic-pre" className="block label-md text-[#0B1C30] mb-1.5">
              Prasyarat Teknis Mahasiswa
            </label>
            <input
              id="topic-pre"
              type="text"
              value={prerequisites}
              onChange={(e) => setPrerequisites(e.target.value)}
              placeholder="Contoh: Menguasai Python, PyTorch, dan Docker"
              className="input-field"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-secondary"
            >
              Batal
            </button>
            <button type="submit" className="btn-primary">
              Simpan Topik
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
