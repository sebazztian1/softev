import React, { useMemo, useState } from 'react';
import { BookMarked, Check, CheckCircle2, Plus } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { usePortal } from '../../context/PortalContext';
import { DoctoralLogEntry, DoctoralStage, DoctoralStudentRecord } from '../../types/portal';
import { formatDateId } from '../../utils/format';

const DOCTORAL_STAGES: DoctoralStage[] = [
  'Ujian Kualifikasi',
  'Proposal Disertasi',
  'Seminar Hasil Riset',
  'Ujian Tertutup',
  'Sidang Terbuka',
];

export const PromotorS3Page: React.FC = () => {
  const { doctoralStudents, reviewDoctoralLog, addDoctoralLogNote, advanceDoctoralStage, showToast } =
    usePortal();

  const [selectedId, setSelectedId] = useState<string>(doctoralStudents[0]?.id ?? '');
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logTopic, setLogTopic] = useState('');
  const [logSummary, setLogSummary] = useState('');

  const [reviewingLog, setReviewingLog] = useState<DoctoralLogEntry | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'Disetujui' | 'Perlu Revisi'>('Disetujui');
  const [reviewNote, setReviewNote] = useState('');

  const [stageModalOpen, setStageModalOpen] = useState(false);
  const [stageNote, setStageNote] = useState('');

  const activeStudent: DoctoralStudentRecord | undefined = useMemo(
    () => doctoralStudents.find((s) => s.id === selectedId) ?? doctoralStudents[0],
    [doctoralStudents, selectedId],
  );

  if (!activeStudent) {
    return (
      <div className="space-y-6">
        <h1 className="headline-lg text-[#0B1C30]">Promotor &amp; Ko-Promotor (S3)</h1>
        <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1">
          <EmptyState message="Belum ada kandidat mahasiswa doktoral (S3) yang dibimbing." />
        </div>
      </div>
    );
  }

  const currentStageIndex = DOCTORAL_STAGES.indexOf(activeStudent.currentStage);
  const nextStage =
    currentStageIndex >= 0 && currentStageIndex < DOCTORAL_STAGES.length - 1
      ? DOCTORAL_STAGES[currentStageIndex + 1]
      : null;

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logTopic.trim() || !logSummary.trim()) {
      showToast('Topik riset dan ringkasan progres log book wajib diisi.', 'error');
      return;
    }
    addDoctoralLogNote(activeStudent.id, logTopic.trim(), logSummary.trim());
    setLogTopic('');
    setLogSummary('');
    setLogModalOpen(false);
  };

  const handleSubmitReviewLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingLog) return;
    if (!reviewNote.trim()) {
      showToast('Catatan promotor wajib diisi.', 'error');
      return;
    }
    reviewDoctoralLog(activeStudent.id, reviewingLog.id, reviewDecision, reviewNote.trim());
    setReviewingLog(null);
    setReviewNote('');
  };

  const handleAdvanceStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nextStage) return;
    advanceDoctoralStage(
      activeStudent.id,
      nextStage,
      stageNote.trim() || `Kandidat dinyatakan layak melanjutkan ke tahap ${nextStage}.`,
    );
    setStageNote('');
    setStageModalOpen(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="headline-lg text-[#0B1C30]">Promotor &amp; Ko-Promotor (S3)</h1>
          <p className="body-base text-[#475569] mt-1">
            Pembimbingan mahasiswa program doktoral melalui log book riset dan tahapan sidang
            bertingkat
          </p>
        </div>

        <button
          type="button"
          onClick={() => setLogModalOpen(true)}
          className="btn-primary shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[1.75]" />
          Tambah Catatan Log Book
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Candidate Selector Sidebar (4 cols) */}
        <aside className="lg:col-span-4 space-y-6">
          <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E8F0]">
              <h2 className="headline-sm text-[#0B1C30]">Kandidat Doktor Bimbingan</h2>
            </div>
            <div className="divide-y divide-[#E2E8F0]">
              {doctoralStudents.map((student) => {
                const isSelected = student.id === activeStudent.id;
                return (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => setSelectedId(student.id)}
                    className={`w-full text-left p-5 transition-colors cursor-pointer ${
                      isSelected ? 'bg-[#EFF6FF] border-l-4 border-l-[#0F2A66]' : 'bg-white hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="label-md text-[#0F2A66]">{student.lecturerRole}</span>
                      <StatusBadge status={student.stageStatus} />
                    </div>
                    <p className="body-semibold text-[#0B1C30] mt-1.5">{student.name}</p>
                    <p className="code-meta text-[#475569]">
                      NIM {student.nim} — {student.programStudi}
                    </p>
                    <p className="code-meta text-[#0284C7] mt-1.5">
                      Tahap: {student.currentStage}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        </aside>

        {/* Doctoral Progress & Log Book (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Tiered Doctoral Defense Stages */}
          <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-[#E2E8F0]">
              <div>
                <span className="label-md uppercase text-[#475569]">
                  {activeStudent.lecturerRole} — Mitra: {activeStudent.partnerName}
                </span>
                <h2 className="headline-sm text-[#0B1C30] mt-1">
                  {activeStudent.dissertationTitle}
                </h2>
              </div>
              {nextStage && (
                <button
                  type="button"
                  onClick={() => setStageModalOpen(true)}
                  className="btn-secondary shrink-0"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[1.5]" />
                  Sahkan ke {nextStage}
                </button>
              )}
            </div>

            <div className="pt-5">
              <span className="label-md uppercase text-[#475569]">
                Tahapan Sidang Doktoral Bertingkat
              </span>
              <ol className="mt-4 grid grid-cols-1 sm:grid-cols-5 gap-3">
                {DOCTORAL_STAGES.map((stage, index) => {
                  const isDone = index < currentStageIndex;
                  const isCurrent = index === currentStageIndex;
                  return (
                    <li
                      key={stage}
                      className="flex sm:flex-col items-center sm:items-start gap-2.5"
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center label-md border shrink-0 ${
                          isDone
                            ? 'bg-[#DCFCE7] border-[#86EFAC] text-[#15803D]'
                            : isCurrent
                              ? 'bg-[#0F2A66] border-[#0F2A66] text-white'
                              : 'bg-[#F1F5F9] border-[#CBD5E1] text-[#64748B]'
                        }`}
                      >
                        {isDone ? <Check className="w-4 h-4 stroke-[2]" /> : index + 1}
                      </div>
                      <span
                        className={`code-meta ${
                          isCurrent
                            ? 'font-semibold text-[#0F2A66]'
                            : isDone
                              ? 'text-[#0B1C30]'
                              : 'text-[#64748B]'
                        }`}
                      >
                        {stage}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          </section>

          {/* Research Log Book Table */}
          <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 overflow-hidden">
            <div className="px-6 py-5 border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookMarked className="w-5 h-5 text-[#0F2A66] stroke-[1.5]" />
                <h2 className="headline-sm text-[#0B1C30]">Log Book Riset Doktoral</h2>
              </div>
              <span className="code-meta text-[#475569]">
                {activeStudent.logBooks.length} catatan riset
              </span>
            </div>

            {activeStudent.logBooks.length === 0 ? (
              <EmptyState message="Belum ada entri log book riset untuk kandidat ini." />
            ) : (
              <div className="divide-y divide-[#E2E8F0]">
                {activeStudent.logBooks.map((log, idx) => (
                  <div
                    key={log.id}
                    className={`p-6 space-y-2 ${idx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="code-meta text-[#475569]">
                          {formatDateId(log.date)}
                        </span>
                        <h3 className="body-semibold text-[#0B1C30] mt-0.5">{log.topic}</h3>
                      </div>
                      <StatusBadge status={log.status} />
                    </div>
                    <p className="body-base text-[#0B1C30]">{log.progressSummary}</p>
                    {log.publicationNote && (
                      <p className="code-meta text-[#0284C7]">
                        Target Publikasi: {log.publicationNote}
                      </p>
                    )}
                    {log.promoterNote && (
                      <p className="code-meta text-[#475569] pt-1">
                        Catatan Promotor: {log.promoterNote}
                      </p>
                    )}
                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setReviewingLog(log);
                          setReviewDecision(
                            log.status === 'Perlu Revisi' ? 'Perlu Revisi' : 'Disetujui',
                          );
                          setReviewNote(log.promoterNote ?? '');
                        }}
                        className="btn-secondary"
                      >
                        Verifikasi Log Book
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Add Log Note Modal */}
      <Modal
        open={logModalOpen}
        onClose={() => setLogModalOpen(false)}
        title="Tambah Catatan Log Book Riset S3"
      >
        <form onSubmit={handleAddLog} className="space-y-4">
          <div>
            <label htmlFor="s3-log-topic" className="block label-md text-[#0B1C30] mb-1.5">
              Topik Eksperimen / Pertemuan Bimbingan
            </label>
            <input
              id="s3-log-topic"
              type="text"
              value={logTopic}
              onChange={(e) => setLogTopic(e.target.value)}
              placeholder="Contoh: Evaluasi ablasi arsitektur pada dataset uji"
              className="input-field"
              required
            />
          </div>
          <div>
            <label htmlFor="s3-log-sum" className="block label-md text-[#0B1C30] mb-1.5">
              Ringkasan Hasil &amp; Arahan Riset
            </label>
            <textarea
              id="s3-log-sum"
              rows={4}
              value={logSummary}
              onChange={(e) => setLogSummary(e.target.value)}
              placeholder="Uraikan hasil diskusi, target publikasi Q1/Q2, serta rencana eksperimen berikutnya."
              className="textarea-field"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setLogModalOpen(false)}
              className="btn-secondary"
            >
              Batal
            </button>
            <button type="submit" className="btn-primary">
              Simpan Log Book
            </button>
          </div>
        </form>
      </Modal>

      {/* Review Log Modal */}
      <Modal
        open={Boolean(reviewingLog)}
        onClose={() => setReviewingLog(null)}
        title="Verifikasi Log Book Riset"
      >
        {reviewingLog && (
          <form onSubmit={handleSubmitReviewLog} className="space-y-4">
            <div className="pb-3 border-b border-[#E2E8F0]">
              <p className="code-meta text-[#475569]">{formatDateId(reviewingLog.date)}</p>
              <h3 className="headline-sm text-[#0B1C30] mt-1">{reviewingLog.topic}</h3>
              <p className="body-base text-[#475569] mt-1">{reviewingLog.progressSummary}</p>
            </div>
            <div>
              <label htmlFor="s3-rev-status" className="block label-md text-[#0B1C30] mb-1.5">
                Status Verifikasi Log
              </label>
              <select
                id="s3-rev-status"
                value={reviewDecision}
                onChange={(e) =>
                  setReviewDecision(e.target.value as 'Disetujui' | 'Perlu Revisi')
                }
                className="input-field"
              >
                <option value="Disetujui">Disetujui</option>
                <option value="Perlu Revisi">Perlu Revisi</option>
              </select>
            </div>
            <div>
              <label htmlFor="s3-rev-note" className="block label-md text-[#0B1C30] mb-1.5">
                Catatan Promotor / Ko-Promotor
              </label>
              <textarea
                id="s3-rev-note"
                rows={3}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Berikan arahan metodologi atau persetujuan kelanjutan eksperimen."
                className="textarea-field"
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setReviewingLog(null)}
                className="btn-secondary"
              >
                Batal
              </button>
              <button type="submit" className="btn-primary">
                Simpan Verifikasi
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Advance Doctoral Stage Modal */}
      <Modal
        open={stageModalOpen}
        onClose={() => setStageModalOpen(false)}
        title={`Pengesahan Tahap Menuju ${nextStage ?? ''}`}
      >
        <form onSubmit={handleAdvanceStage} className="space-y-4">
          <p className="body-base text-[#0B1C30]">
            Sahkan penyelesaian tahap <strong>{activeStudent.currentStage}</strong> untuk{' '}
            <strong>{activeStudent.name}</strong> dan lanjutkan ke tahap{' '}
            <strong>{nextStage}</strong>.
          </p>
          <div>
            <label htmlFor="s3-stage-note" className="block label-md text-[#0B1C30] mb-1.5">
              Berita Acara Kelayakan Tahap
            </label>
            <textarea
              id="s3-stage-note"
              rows={3}
              value={stageNote}
              onChange={(e) => setStageNote(e.target.value)}
              placeholder="Contoh: Seluruh luaran publikasi dan naskah tahap saat ini telah memenuhi syarat."
              className="textarea-field"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setStageModalOpen(false)}
              className="btn-secondary"
            >
              Batal
            </button>
            <button type="submit" className="btn-primary">
              Sahkan Tahap
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
