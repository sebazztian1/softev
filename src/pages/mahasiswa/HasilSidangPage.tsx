import React from 'react';
import { Eye } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { usePortal } from '../../context/PortalContext';
import { formatDateId, formatDateTimeId, getLecturerName } from '../../utils/format';

export const HasilSidangPage: React.FC = () => {
  const { studentThesis, lecturers, setActiveTab, openFilePreview } = usePortal();

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

  // Filter strictly to up to 4 examiners/reviewers (no Penguji ke-5 and no Revisi Kaprodi section per Alteration)
  const reviewerEvaluations = studentThesis.evaluations
    .filter((ev) => ev.evaluatorRole !== 'Kaprodi')
    .slice(0, 4);

  const allRequirements = reviewerEvaluations.flatMap((ev) => ev.requirements ?? []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="headline-lg text-[#0B1C30]">Hasil Sidang Proposal</h1>
          <p className="body-base text-[#475569] mt-1">
            {studentThesis.studentName} — NRP {studentThesis.studentNim} — Periode{' '}
            {studentThesis.semester}
          </p>
        </div>
        <StatusBadge status={studentThesis.status} />
      </div>

      {/* Summary Card */}
      <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E2E8F0]">
          <h2 className="headline-md text-[#0F2A66]">Informasi Tugas Akhir &amp; Hasil Sidang</h2>
          {studentThesis.status === 'Perlu Revisi' || studentThesis.status === 'Diperbaiki' ? (
            <button
              type="button"
              onClick={() => setActiveTab('upload-revisi')}
              className="btn-primary shrink-0"
            >
              Unggah Revisi Sidang
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveTab('download-proposal')}
              className="btn-primary shrink-0"
            >
              Unduh Berkas Proposal
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
          <div>
            <span className="label-md uppercase text-[#475569]">Judul yang Disetujui</span>
            <p className="body-semibold text-[#0B1C30] mt-1">{studentThesis.title}</p>
          </div>
          {studentThesis.newTitle && (
            <div>
              <span className="label-md uppercase text-[#475569]">
                Judul Baru (Penyesuaian Sidang)
              </span>
              <p className="body-semibold text-[#0F2A66] mt-1">{studentThesis.newTitle}</p>
            </div>
          )}
          <div>
            <span className="label-md uppercase text-[#475569]">Periode Pengerjaan TA</span>
            <p className="body-medium text-[#0B1C30] mt-1">{studentThesis.semester}</p>
          </div>
          <div>
            <span className="label-md uppercase text-[#475569]">Nilai Sidang Proposal</span>
            <p className="headline-md text-[#0F2A66] mt-1">
              {studentThesis.defenseScore
                ? `${studentThesis.defenseScore.totalScore.toFixed(1)} (${studentThesis.defenseScore.grade})`
                : 'Belum dinilai'}
            </p>
          </div>
          <div>
            <span className="label-md uppercase text-[#475569]">Dosen Pembimbing</span>
            <p className="body-medium text-[#0B1C30] mt-1">
              {getLecturerName(lecturers, studentThesis.advisor1Id)}
            </p>
          </div>
          <div>
            <span className="label-md uppercase text-[#475569]">Co-Pembimbing</span>
            <p className="body-medium text-[#0B1C30] mt-1">
              {getLecturerName(lecturers, studentThesis.advisor2Id)}
            </p>
          </div>
          {studentThesis.defenseSchedule && (
            <div className="md:col-span-2 pt-3 border-t border-[#E2E8F0]">
              <span className="label-md uppercase text-[#475569]">Pelaksanaan Sidang</span>
              <p className="body-medium text-[#0B1C30] mt-1">
                {formatDateId(studentThesis.defenseSchedule.date)},{' '}
                {studentThesis.defenseSchedule.time} — {studentThesis.defenseSchedule.room}
              </p>
            </div>
          )}
        </div>

        {allRequirements.length > 0 && (
          <div className="mt-5 pt-5 border-t border-[#E2E8F0]">
            <span className="label-md uppercase text-[#C2410C]">Syarat / Poin Revisi Wajib</span>
            <ul className="mt-2 space-y-1.5 list-disc list-inside body-base text-[#0B1C30]">
              {allRequirements.map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Evaluation Detail Table (Max 4 Penguji, No Penguji ke-5, No Revisi Kaprodi) */}
      <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 overflow-hidden">
        <div className="px-6 py-5 border-b border-[#E2E8F0] flex items-center justify-between">
          <h2 className="headline-sm text-[#0B1C30]">
            Hasil Review Dewan Penguji Proposal (Maksimal 4 Penguji)
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
