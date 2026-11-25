import React, { useState } from 'react';
import { Eye } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { usePortal } from '../../context/PortalContext';
import { formatDateId, formatDateTimeId, getLecturerName } from '../../utils/format';
import { needsRevision } from '../../utils/revision';

export const HasilSidangPage: React.FC = () => {
  const { studentThesis: activeThesis, theses, currentUser, focusedThesisId, lecturers, setActiveTab, navigateWithContext, openFilePreview } = usePortal();
  const [selectedId, setSelectedId] = useState(focusedThesisId ?? '');
  const records = theses.filter(item => item.studentId === currentUser?.id);
  const studentThesis = records.find(item => item.id === selectedId) ?? activeThesis;

  if (!studentThesis) {
    return (
      <div className="space-y-6">
        <h1 className="headline-lg text-[#0B1C30]">Hasil Sidang Proposal</h1>
        <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1">
          <EmptyState
            message="Belum ada data sidang proposal karena berkas proposal belum diajukan."
            action={
              <button
                type="button"
                onClick={() => setActiveTab('upload-proposal')}
                className="btn-primary"
              >
                Unggah Proposal
              </button>
            }
          />
        </div>
      </div>
    );
  }

  const reviewerEvaluations = studentThesis.evaluations
    .filter(ev => ev.evaluatorRole !== 'Kaprodi' && ev.stage !== 'Revisi Proposal')
    .filter((ev, index, list) => list.findIndex(other => other.evaluatorId === ev.evaluatorId) === index)
    .slice(0, 4);
  const requirements = [...new Set(reviewerEvaluations.flatMap(ev => ev.requirements ?? []))];
  const canRevise = studentThesis.id === activeThesis?.id && needsRevision(studentThesis.status);
  const schedule = studentThesis.defenseSchedule;
  const score = studentThesis.defenseScore;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="headline-lg">Hasil Sidang Proposal</h1>
          <p className="body-base mt-1 text-ink-secondary">{studentThesis.studentName} · NRP {studentThesis.studentNim} · {studentThesis.semester}</p>
        </div>
        {records.length > 1 && <label className="body-medium max-w-full">Riwayat pengajuan
          <select className="input-field mt-1 max-w-96" id="hasil-pengajuan" value={studentThesis.id} onChange={e => setSelectedId(e.target.value)}>
            {records.map(thesis => <option key={thesis.id} value={thesis.id}>{thesis.id === activeThesis?.id ? 'Aktif' : 'Riwayat'} · {thesis.title}</option>)}
          </select>
        </label>}
      </div>
      <section className="student-panel p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusBadge status={studentThesis.status} />
          <span className="body-medium text-ink-secondary">Nilai sidang · <strong className="text-navy">{score ? score.totalScore.toFixed(1) + ' (' + score.grade + ')' : 'Belum dinilai'}</strong></span>
        </div>
        <h2 className="headline-md text-navy mt-3">{studentThesis.newTitle || studentThesis.title}</h2>
        {studentThesis.newTitle && <details className="mt-2 text-sm text-ink-secondary"><summary className="cursor-pointer">Judul sebelum penyesuaian</summary><p className="mt-1">{studentThesis.title}</p></details>}
        <p className="body-base mt-3">Pembimbing · {[studentThesis.advisor1Id, studentThesis.advisor2Id].filter(Boolean).map(id => getLecturerName(lecturers, id)).join(' / ')}</p>
        {schedule && <p className="body-base text-ink-secondary mt-1">{formatDateId(schedule.date)} · {schedule.time} · {schedule.room}</p>}
        {requirements.length > 0 && <details className="student-disclosure mt-4">
          <summary>Syarat perbaikan ({requirements.length})</summary>
          <ul className="list-disc pl-5 mt-2 space-y-1">{requirements.map(req => <li key={req}>{req}</li>)}</ul>
        </details>}
        <button type="button" className="btn-primary mt-4" onClick={() => canRevise
          ? setActiveTab('upload-revisi')
          : navigateWithContext('download-proposal', undefined, studentThesis.id)}>
          {canRevise ? 'Unggah Revisi Sidang' : 'Unduh Berkas Proposal'}
        </button>
      </section>

      {/* Evaluation Detail Table (Max 4 Penguji, No Penguji ke-5, No Revisi Kaprodi) */}
      <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 overflow-hidden">
        <div className="px-6 py-5 border-b border-[#E2E8F0] flex items-center justify-between">
          <h2 className="headline-sm text-[#0B1C30]">
            Catatan penguji
          </h2>
          <span className="code-meta text-[#475569]">{reviewerEvaluations.length} penguji</span>
        </div>

        {reviewerEvaluations.length === 0 ? (
          <EmptyState message="Belum ada rincian penilaian sidang yang diterbitkan." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0]">
                  <th className="py-3 px-6 label-md uppercase text-[#475569]">Penguji</th>
                  <th className="py-3 px-4 label-md uppercase text-[#475569]">Status</th>
                  <th className="py-3 px-4 label-md uppercase text-[#475569]">
                    Catatan &amp; Saran Perbaikan
                  </th>
                  <th className="py-3 px-4 label-md uppercase text-[#475569] text-right">Tanggal</th>
                  <th className="py-3 px-6 label-md uppercase text-[#475569] text-right">
                    Berkas Koreksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {reviewerEvaluations.map((ev, idx) => (
                  <tr key={ev.id} className={idx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'}>
                    <td className="py-4 px-6 align-top">
                      <p className="body-semibold text-[#0B1C30]">{ev.evaluatorName}</p>
                      <p className="code-meta text-[#475569]">{ev.evaluatorRole}</p>
                    </td>
                    <td className="py-4 px-4 align-top">
                      <StatusBadge status={ev.status} />
                    </td>
                    <td className="py-4 px-4 align-top body-base text-[#0B1C30] max-w-md">
                      {ev.notes}
                    </td>
                    <td className="py-4 px-4 align-top code-meta text-[#475569] text-right whitespace-nowrap">
                      {formatDateTimeId(ev.evaluatedAt)}
                    </td>
                    <td className="py-4 px-6 align-top text-right whitespace-nowrap">
                      {ev.correctionFile ? (
                        <button
                          type="button"
                          onClick={() =>
                            openFilePreview({
                              id: ev.correctionFile!.id,
                              fileName: ev.correctionFile!.fileName,
                              title: `Catatan Koreksi — ${ev.evaluatorName}`,
                              subtitle: `${studentThesis.studentName} (${studentThesis.studentNim})`,
                              lines: [
                                `Penilai: ${ev.evaluatorName} (${ev.evaluatorRole})`,
                                `Status: ${ev.status}`,
                                `Catatan: ${ev.notes}`,
                              ],
                              hasRealBlob: ev.correctionFile!.hasRealBlob,
                            })
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 label-md text-[#1E293B] hover:bg-[#F1F5F9] cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 stroke-[1.5]" />
                          Lihat Koreksi
                        </button>
                      ) : (
                        <span className="code-meta text-[#64748B]">Tidak ada lampiran</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
