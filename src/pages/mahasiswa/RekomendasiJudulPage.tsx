import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { usePortal } from '../../context/PortalContext';
import type { TopicRecommendation } from '../../types/portal';
import { getAdvisorQuotaError } from '../../utils/studentSubmission';

export const RekomendasiJudulPage: React.FC = () => {
  const { topics, lecturers, theses, currentUser, period, maxQuotas, preselectedTopic, claimTopicForProposal } = usePortal();
  const [field, setField] = useState('');
  const [status, setStatus] = useState('Semua');
  const [detail, setDetail] = useState<TopicRecommendation | null>(null);
  const fields = [...new Set(topics.map((topic) => topic.field))];
  const filtered = topics.filter((topic) => (!field || topic.field === field) && (status === 'Semua' || topic.status === status));
  const closed = Date.now() >= Date.parse(period.proposalDeadline);

  const claimButton = (topic: TopicRecommendation, inDialog = false) => {
    const draft = preselectedTopic?.id === topic.id;
    const claimed = !draft && topic.reservedByNim === currentUser?.identifier;
    const advisorError = currentUser && getAdvisorQuotaError(topic.lecturerId, '', lecturers, theses, currentUser, period, maxQuotas);
    const unavailable = !draft && (claimed || topic.status !== 'Tersedia' || topic.takenCount >= topic.quota || !!advisorError);
    let label = inDialog ? 'Ajukan Topik Ini' : 'Ajukan Topik';
    if (draft) label = 'Lanjutkan pengajuan';
    else if (claimed) label = 'Sudah diajukan';
    else if (topic.status === 'Reserved') label = 'Sudah Reserved';
    else if (advisorError) label = 'Kuota pembimbing penuh';
    return <button type="button" disabled={closed || unavailable} className={inDialog ? 'btn-primary' : 'btn-secondary'}
      onClick={() => { setDetail(null); claimTopicForProposal(topic); }}>{label}</button>;
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h1 className="headline-lg text-[#0B1C30]">Rekomendasi Judul</h1>
        {closed && <p className="body-base text-[#92400E] mt-1">Batas waktu pengajuan proposal telah berakhir.</p>}
      </div>
      <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 border-b border-[#E2E8F0]">
          <div>
            <label htmlFor="rec-field" className="block label-md text-[#0B1C30] mb-1.5">Bidang Minat</label>
            <select id="rec-field" className="input-field" value={field || 'Semua'}
              onChange={(event) => setField(event.target.value === 'Semua' ? '' : event.target.value)}>
              <option value="Semua">Semua bidang</option>{fields.map((name) => <option key={name}>{name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="rec-status" className="block label-md text-[#0B1C30] mb-1.5">Status Kuota</label>
            <select id="rec-status" className="input-field" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="Semua">Semua status</option><option>Tersedia</option><option>Reserved</option><option>Penuh</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5">
          <h2 className="headline-sm text-[#0B1C30]">Penawaran Topik Dosen</h2>
          <p className="code-meta text-[#475569]" aria-live="polite">{filtered.length} topik</p>
        </div>
        {filtered.length === 0 ? <EmptyState icon={BookOpen} message="Tidak ada topik yang sesuai dengan filter." /> :
          <ul className="divide-y divide-[#E2E8F0] px-5">
            {filtered.map((topic) => <li key={topic.id} className="grid gap-3 py-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={topic.status} />
                  <span className="code-meta text-[#475569]">{topic.field}</span>
                </div>
                <h3 className="body-semibold break-words text-[#0B1C30]">{topic.title}</h3>
                <p className="body-base text-[#475569]">{topic.lecturerName} · {Math.max(0, topic.quota - topic.takenCount)} dari {topic.quota} tempat tersisa</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" className="btn-secondary" onClick={() => setDetail(topic)}>Lihat Detail</button>
                {claimButton(topic)}
              </div>
            </li>)}
          </ul>}
      </section>
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Detail Rekomendasi Judul">
        {detail && <div className="space-y-4">
          <div className="flex items-center gap-3"><StatusBadge status={detail.status} />
            <span className="code-meta text-[#475569]">{detail.field}</span></div>
          <h3 className="headline-sm text-[#0B1C30]">{detail.title}</h3>
          <p className="body-base text-[#0B1C30]">{detail.description}</p>
          <dl className="space-y-3 border-y border-[#E2E8F0] py-3">
            <div><dt className="label-md text-[#475569]">Dosen pengusul</dt><dd>{detail.lecturerName}</dd></div>
            <div><dt className="label-md text-[#475569]">Sisa kuota</dt><dd>{Math.max(0, detail.quota - detail.takenCount)} dari {detail.quota} tempat</dd></div>
            {detail.status === 'Reserved' && detail.reservedByName && <div>
              <dt className="label-md text-[#475569]">Direservasi oleh</dt><dd>{detail.reservedByName}</dd>
            </div>}
            <div><dt className="label-md text-[#475569]">Prasyarat teknis</dt><dd>{detail.prerequisites}</dd></div>
          </dl>
          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={() => setDetail(null)}>Tutup</button>
            {claimButton(detail, true)}
          </div>
        </div>}
      </Modal>
    </div>
  );
};
