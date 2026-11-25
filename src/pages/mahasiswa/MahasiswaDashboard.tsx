import React from 'react';
import { BookOpen, Calendar, Check, Eye, FileText } from 'lucide-react';
import { AlertBanner } from '../../components/ui/AlertBanner';
import { EmptyState } from '../../components/ui/EmptyState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { usePortal } from '../../context/PortalContext';
import { ThesisStage } from '../../types/portal';
import {
  formatCountdown,
  formatDateId,
  formatDateTimeId,
  formatFileSize,
  getLecturerName,
} from '../../utils/format';

const STAGES: ThesisStage[] = [
  'Pengajuan Proposal',
  'Verifikasi Kaprodi',
  'Sidang Proposal',
  'Revisi Proposal',
  'Pengesahan Akhir',
];

export const MahasiswaDashboard: React.FC = () => {
  const {
    currentUser,
    studentThesis,
    lecturers,
    period,
    setActiveTab,
    openFilePreview,
  } = usePortal();

  if (!currentUser) return null;

  const currentStageIndex = studentThesis ? STAGES.indexOf(studentThesis.stage) : 0;
  const countdownRevision = formatCountdown(
    studentThesis?.revisionDeadline ?? period.revisionDeadline,
  );
  const countdownProposal = formatCountdown(period.proposalDeadline);

  const getPrimaryCta = () => {
    if (!studentThesis) {
      return { label: 'Unggah Proposal', tab: 'upload-proposal' };
    }
    if (
      studentThesis.status === 'Perlu Revisi' ||
      studentThesis.status === 'Diperbaiki' ||
      studentThesis.stage === 'Revisi Proposal'
    ) {
      return { label: 'Unggah Revisi', tab: 'upload-revisi' };
    }
    if (studentThesis.status === 'Ditolak') {
      return { label: 'Ajukan Ulang Proposal', tab: 'upload-proposal' };
    }
    return { label: 'Lihat Hasil Sidang', tab: 'hasil-sidang' };
  };

  const primaryCta = getPrimaryCta();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="headline-lg text-[#0B1C30]">Dashboard Tugas Akhir</h1>
          <p className="body-base text-[#475569] mt-1">
            {currentUser.name} — NRP {currentUser.identifier} — {currentUser.department} —{' '}
            {period.semesterLabel}
          </p>
        </div>
        {studentThesis && <StatusBadge status={studentThesis.status} />}
      </div>

      {/* Deadline Warning Banner */}
      {studentThesis &&
        (studentThesis.status === 'Perlu Revisi' || studentThesis.status === 'Diperbaiki') && (
          <AlertBanner
            variant="warning"
            title={`Batas Akhir Unggah Revisi Sidang Proposal: ${countdownRevision.label}`}
            description={`Pastikan berkas revisi dalam format .PDF diunggah sebelum ${formatDateTimeId(
              studentThesis.revisionDeadline ?? period.revisionDeadline,
            )}.`}
          />
        )}

      {/* Tabel Tanggal Periode TA Berjalan */}
      <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#0F2A66] stroke-[1.5]" />
            <h2 className="headline-sm text-[#0B1C30]">Periode Tugas Akhir Berjalan</h2>
          </div>
          <span className="code-meta text-[#475569]">Ditetapkan oleh {period.managedBy}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0]">
                <th className="py-3 px-6 label-md uppercase text-[#475569]">Periode</th>
                <th className="py-3 px-4 label-md uppercase text-[#475569]">Status</th>
                <th className="py-3 px-4 label-md uppercase text-[#475569]">Tanggal</th>
                <th className="py-3 px-4 label-md uppercase text-[#475569]">Countdown</th>
                <th className="py-3 px-6 label-md uppercase text-[#475569] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              <tr className="bg-white">
                <td className="py-3.5 px-6 body-semibold text-[#0B1C30]">
                  Pengajuan Proposal ({period.semesterLabel})
                </td>
                <td className="py-3.5 px-4">
                  <StatusBadge status="Tersedia" />
                </td>
                <td className="py-3.5 px-4 body-base text-[#0B1C30]">
                  s.d. {formatDateId(period.proposalDeadline)}
                </td>
                <td className="py-3.5 px-4 code-meta text-[#0F2A66] font-semibold">
                  {countdownProposal.label}
                </td>
                <td className="py-3.5 px-6 text-right">
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload-proposal')}
                    className="btn-secondary"
                  >
                    Upload Proposal
                  </button>
                </td>
              </tr>
              <tr className="bg-[#F8FAFC]">
                <td className="py-3.5 px-6 body-semibold text-[#0B1C30]">
                  Unggah Revisi Sidang Proposal
                </td>
                <td className="py-3.5 px-4">
                  <StatusBadge status={studentThesis?.status ?? 'Menunggu Verifikasi'} />
                </td>
                <td className="py-3.5 px-4 body-base text-[#0B1C30]">
                  {formatDateTimeId(studentThesis?.revisionDeadline ?? period.revisionDeadline)}
                </td>
                <td className="py-3.5 px-4 code-meta text-[#C2410C] font-semibold">
                  {countdownRevision.label}
                </td>
                <td className="py-3.5 px-6 text-right">
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload-revisi')}
                    className="btn-secondary"
                  >
                    Upload Revisi
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Main 12-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Columns */}
        <div className="lg:col-span-8 space-y-6">
          {/* Thesis Summary Card */}
          <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E2E8F0]">
              <h2 className="headline-md text-[#0F2A66]">Ringkasan Tugas Akhir</h2>
              <button
                type="button"
                onClick={() => setActiveTab(primaryCta.tab)}
                className="btn-primary shrink-0"
              >
                {primaryCta.label}
              </button>
            </div>

            {!studentThesis ? (
              <EmptyState
                message="Belum ada berkas proposal yang diunggah pada periode akademik ini."
                action={
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload-proposal')}
                    className="btn-secondary"
                  >
                    Buka Formulir Proposal
                  </button>
                }
              />
            ) : (
              <div className="mt-5 space-y-6">
                <div>
                  <span className="label-md uppercase text-[#475569]">
                    Judul Tugas Akhir ({studentThesis.submissionType})
                  </span>
                  <p className="headline-sm text-[#0B1C30] mt-1">{studentThesis.title}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#E2E8F0]">
                  <div>
                    <span className="label-md uppercase text-[#475569]">Bidang Minat</span>
                    <p className="body-medium text-[#0B1C30] mt-1">{studentThesis.field}</p>
                  </div>
                  <div>
                    <span className="label-md uppercase text-[#475569]">Tahap Saat Ini</span>
                    <p className="body-medium text-[#0B1C30] mt-1">{studentThesis.stage}</p>
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
                </div>

                {/* Linear Milestone Tracker */}
                <div className="pt-5 border-t border-[#E2E8F0]">
                  <span className="label-md uppercase text-[#475569]">
                    Tahapan Progres Tugas Akhir
                  </span>
                  <ol className="mt-4 grid grid-cols-1 sm:grid-cols-5 gap-3">
                    {STAGES.map((stage, index) => {
                      const isDone =
                        index < currentStageIndex ||
                        (stage === 'Pengesahan Akhir' &&
                          studentThesis.stage === 'Pengesahan Akhir' &&
                          studentThesis.status === 'Diterima');
                      const isCurrent = index === currentStageIndex && !isDone;
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
              </div>
            )}
          </section>

          {/* Riwayat Unggahan Berkas */}
          <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E2E8F0]">
              <h2 className="headline-sm text-[#0B1C30]">Riwayat Unggahan Berkas</h2>
              <button
                type="button"
                onClick={() => setActiveTab('download-proposal')}
                className="body-semibold text-[#0284C7] hover:underline cursor-pointer"
              >
                Lihat Semua Berkas
              </button>
            </div>

            {!studentThesis || studentThesis.submissions.length === 0 ? (
              <EmptyState message="Belum ada berkas yang diunggah." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0]">
                      <th className="py-3 px-6 label-md uppercase text-[#475569]">Versi</th>
                      <th className="py-3 px-4 label-md uppercase text-[#475569]">Nama Berkas</th>
                      <th className="py-3 px-4 label-md uppercase text-[#475569] text-right">
                        Ukuran
                      </th>
                      <th className="py-3 px-4 label-md uppercase text-[#475569] text-right">
                        Tanggal
                      </th>
                      <th className="py-3 px-6 label-md uppercase text-[#475569] text-right">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {studentThesis.submissions.map((sub, idx) => (
                      <tr key={sub.id} className={idx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'}>
                        <td className="py-3.5 px-6 body-semibold text-[#0B1C30] whitespace-nowrap">
                          {sub.versionLabel}
                        </td>
                        <td className="py-3.5 px-4 body-base text-[#0B1C30]">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-[#475569] shrink-0 stroke-[1.5]" />
                            <span className="truncate max-w-[240px]">{sub.fileName}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 code-meta text-[#475569] text-right whitespace-nowrap">
                          {formatFileSize(sub.fileSize)}
                        </td>
                        <td className="py-3.5 px-4 code-meta text-[#475569] text-right whitespace-nowrap">
                          {formatDateId(sub.uploadedAt)}
                        </td>
                        <td className="py-3.5 px-6 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() =>
                              openFilePreview({
                                id: sub.id,
                                fileName: sub.fileName,
                                title: sub.pdfTitle ?? sub.versionLabel,
                                subtitle: `${studentThesis.studentName} (${studentThesis.studentNim})`,
                                lines: sub.pdfLines ?? [
                                  `Berkas: ${sub.fileName}`,
                                  `Diunggah oleh: ${sub.uploadedBy}`,
                                  `Ringkasan: ${sub.summary}`,
                                ],
                                hasRealBlob: sub.hasRealBlob,
                              })
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 label-md text-[#1E293B] hover:bg-[#F1F5F9] cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 stroke-[1.5]" />
                            Pratinjau
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Right 4 Columns */}
        <div className="lg:col-span-4 space-y-6">
          {/* Pedoman Pengajuan Proposal TA/Tesis */}
          <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 p-6">
            <div className="flex items-center gap-2 pb-4 border-b border-[#E2E8F0]">
              <BookOpen className="w-5 h-5 text-[#0F2A66] stroke-[1.5]" />
              <h2 className="headline-sm text-[#0B1C30]">Pedoman Pengajuan Proposal</h2>
            </div>

            <ol className="divide-y divide-[#E2E8F0] mt-1">
              <li className="py-3 body-base text-[#0B1C30]">
                1. Konsultasikan topik dengan calon Dosen Pembimbing yang kuotanya belum penuh.
              </li>
              <li className="py-3 body-base text-[#0B1C30]">
                2. Unduh Formulir Proposal TA dari halaman Upload Proposal dan lengkapi Bab 1-3.
              </li>
              <li className="py-3 body-base text-[#0B1C30]">
                3. Pilih tag topik yang sesuai agar sistem dapat merekomendasikan tim reviewer.
              </li>
              <li className="py-3 body-base text-[#0B1C30]">
                4. Unggah berkas revisi pasca-sidang sebelum tenggat dan tunjukkan QR verifikasi.
              </li>
            </ol>
          </section>

          {/* Catatan Penilai Terbaru */}
          <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
              <h2 className="headline-sm text-[#0B1C30]">Catatan Evaluasi Terbaru</h2>
            </div>

            {!studentThesis || studentThesis.evaluations.length === 0 ? (
              <p className="body-base text-[#475569] py-6">
                Belum ada catatan evaluasi dari dosen pembimbing maupun penguji.
              </p>
            ) : (
              <div className="divide-y divide-[#E2E8F0]">
                {studentThesis.evaluations.slice(0, 4).map((ev) => (
                  <div key={ev.id} className="py-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="body-semibold text-[#0B1C30]">{ev.evaluatorRole}</span>
                      <StatusBadge status={ev.status} />
                    </div>
                    <p className="code-meta text-[#475569] mt-0.5">{ev.evaluatorName}</p>
                    <p className="body-base text-[#0B1C30] mt-2">{ev.notes}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
