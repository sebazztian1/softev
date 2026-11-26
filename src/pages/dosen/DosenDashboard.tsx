import React from 'react';
import { Calendar, ClipboardCheck, QrCode, Shield } from 'lucide-react';
import { AlertBanner } from '../../components/ui/AlertBanner';
import { EmptyState } from '../../components/ui/EmptyState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { usePortal } from '../../context/PortalContext';
import { DosenStructuralRole } from '../../types/portal';
import { formatDateId, formatDateTimeId } from '../../utils/format';

const STRUCTURAL_ROLE_OPTIONS: Array<{
  key: DosenStructuralRole;
  label: string;
  description: string;
}> = [
  {
    key: 'reviewer-proposal',
    label: 'Reviewer & Penguji Proposal',
    description: 'Menulis catatan review proposal, sidang, serta pengesahan revisi (TTD dosen atau QR opsional).',
  },
  {
    key: 'promotor-s3',
    label: 'Promotor & Ko-Promotor (S3)',
    description: 'Membimbing kandidat doktoral melalui log book riset dan sidang bertingkat.',
  },
  {
    key: 'koordinator-jadwal',
    label: 'Koordinator Sinkronisasi Jadwal',
    description: 'Memindai slot sidang bebas bentrok terhadap jadwal mengajar dan bimbingan.',
  },
];

export const DosenDashboard: React.FC = () => {
  const {
    currentUser,
    theses,
    doctoralStudents,
    lecturerSchedules,
    period,
    navigateWithContext,
    toggleDosenStructuralRole,
  } = usePortal();

  if (!currentUser) return null;

  const activeStructuralRoles = currentUser.structuralRoles ?? [];
  const supervised = theses.filter(
    (t) =>
      t.advisor1Id === currentUser.id ||
      t.advisor2Id === currentUser.id ||
      t.proposedAdvisor1Id === currentUser.id,
  );
  const pendingReview = supervised.filter(
    (t) => t.status === 'Menunggu Verifikasi' || t.status === 'Perlu Revisi',
  );
  const pendingRevisions = theses.filter(
    (t) =>
      t.stage === 'Revisi Proposal' &&
      t.status !== 'Diterima' &&
      (t.advisor1Id === currentUser.id ||
        t.advisor2Id === currentUser.id ||
        t.defenseSchedule?.examiner1Id === currentUser.id),
  );
  const assignedDefenses = theses.filter(
    (t) =>
      t.defenseSchedule &&
      (t.defenseSchedule.examiner1Id === currentUser.id ||
        t.defenseSchedule.examiner2Id === currentUser.id ||
        t.advisor1Id === currentUser.id ||
        t.advisor2Id === currentUser.id),
  );
  const ungradedDefenses = assignedDefenses.filter(
    (t) => t.stage === 'Sidang Proposal' && !t.defenseScore,
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="headline-lg text-[#0B1C30]">Dashboard Dosen</h1>
          <p className="body-base text-[#475569] mt-1">
            {currentUser.name} — NIDN {currentUser.identifier} — {period.semesterLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigateWithContext('tulis-review', 'review-list')}
          className="btn-primary shrink-0"
        >
          Tulis Review Proposal
        </button>
      </div>

      {(pendingReview.length > 0 || ungradedDefenses.length > 0 || pendingRevisions.length > 0) && (
        <AlertBanner
          variant="info"
          title={`Terdapat ${pendingReview.length} proposal menunggu review, ${pendingRevisions.length} revisi siap disahkan, dan ${ungradedDefenses.length} sidang menunggu hasil.`}
          description={`Periode sidang proposal berlangsung pada ${period.defenseWindow}. Pengesahan revisi dapat dilakukan langsung (TTD dosen) atau melalui QR Code opsional sebagai pengganti TTD.`}
          action={
            pendingRevisions.length > 0 ? (
              <button
                type="button"
                onClick={() =>
                  navigateWithContext('tulis-review', 'qr-approval', pendingRevisions[0].id)
                }
                className="btn-secondary"
              >
                <QrCode className="w-4 h-4 stroke-[1.5]" />
                Approve Revisi (QR Opsional)
              </button>
            ) : undefined
          }
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Columns */}
        <div className="lg:col-span-8 space-y-6">
          {/* Antrean Review & Revisi */}
          <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E2E8F0]">
              <h2 className="headline-md text-[#0F2A66]">Antrean Review &amp; Bimbingan</h2>
              <button
                type="button"
                onClick={() => navigateWithContext('tulis-review', 'review-list')}
                className="body-semibold text-[#0284C7] hover:underline cursor-pointer"
              >
                Buka Tulis Review
              </button>
            </div>

            {supervised.length === 0 ? (
              <EmptyState message="Belum ada mahasiswa bimbingan yang ditetapkan pada periode ini." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0]">
                      <th className="py-3 px-6 label-md uppercase text-[#475569]">Mahasiswa</th>
                      <th className="py-3 px-4 label-md uppercase text-[#475569]">Judul &amp; Periode</th>
                      <th className="py-3 px-4 label-md uppercase text-[#475569]">Status</th>
                      <th className="py-3 px-6 label-md uppercase text-[#475569] text-right">
                        Pembaruan
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {supervised.slice(0, 5).map((item, idx) => (
                      <tr key={item.id} className={idx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'}>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <p className="body-semibold text-[#0B1C30]">{item.studentName}</p>
                          <p className="code-meta text-[#475569]">{item.studentNim}</p>
                        </td>
                        <td className="py-4 px-4 max-w-sm">
                          <button
                            type="button"
                            onClick={() =>
                              navigateWithContext('tulis-review', 'review-list', item.id)
                            }
                            className="body-medium text-[#0B1C30] hover:text-[#0284C7] text-left cursor-pointer"
                          >
                            {item.title}
                          </button>
                          <p className="code-meta text-[#475569] mt-0.5">
                            {item.semester} — {item.stage}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="py-4 px-6 code-meta text-[#475569] text-right whitespace-nowrap">
                          {formatDateId(item.updatedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Jadwal Sidang Terkait */}
          <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E2E8F0]">
              <h2 className="headline-sm text-[#0B1C30]">Jadwal Sidang Proposal Terkait</h2>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => navigateWithContext('sidang-proposal', 'rekap-hasil')}
                  className="body-semibold text-[#0284C7] hover:underline cursor-pointer"
                >
                  Rekap Hasil
                </button>
                <button
                  type="button"
                  onClick={() => navigateWithContext('sidang-proposal', 'input-hasil')}
                  className="body-semibold text-[#0284C7] hover:underline cursor-pointer"
                >
                  Tulis Hasil Sidang
                </button>
              </div>
            </div>

            {assignedDefenses.length === 0 ? (
              <EmptyState
                icon={Calendar}
                message="Belum ada jadwal sidang proposal yang ditugaskan kepada Anda."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0]">
                      <th className="py-3 px-6 label-md uppercase text-[#475569]">Mahasiswa</th>
                      <th className="py-3 px-4 label-md uppercase text-[#475569]">Jadwal &amp; Ruang</th>
                      <th className="py-3 px-4 label-md uppercase text-[#475569]">Status</th>
                      <th className="py-3 px-6 label-md uppercase text-[#475569] text-right">
                        Nilai
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {assignedDefenses.slice(0, 5).map((item, idx) => (
                      <tr key={item.id} className={idx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'}>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <p className="body-semibold text-[#0B1C30]">{item.studentName}</p>
                          <p className="code-meta text-[#475569]">{item.studentNim}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="body-medium text-[#0B1C30]">
                            {formatDateId(item.defenseSchedule!.date)}, {item.defenseSchedule!.time}
                          </p>
                          <p className="code-meta text-[#475569]">{item.defenseSchedule!.room}</p>
                        </td>
                        <td className="py-4 px-4">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="py-4 px-6 body-semibold text-[#0F2A66] text-right whitespace-nowrap">
                          {item.defenseScore
                            ? `${item.defenseScore.totalScore.toFixed(1)} (${item.defenseScore.grade})`
                            : 'Menunggu nilai'}
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
        <aside className="lg:col-span-4 space-y-6">
          {/* Dynamic Structural Roles Panel */}
          <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 p-6">
            <div className="flex items-center gap-2 pb-4 border-b border-[#E2E8F0]">
              <Shield className="w-5 h-5 text-[#0F2A66] stroke-[1.5]" />
              <h2 className="headline-sm text-[#0B1C30]">Peran Struktural Tambahan</h2>
            </div>

            <div className="divide-y divide-[#E2E8F0] mt-2">
              {STRUCTURAL_ROLE_OPTIONS.map((roleOpt) => {
                const enabled = activeStructuralRoles.includes(roleOpt.key);
                const isMandatory = roleOpt.key === 'reviewer-proposal';
                return (
                  <label
                    key={roleOpt.key}
                    className={`py-3 flex items-start justify-between gap-3 ${
                      isMandatory ? 'cursor-default' : 'cursor-pointer'
                    }`}
                  >
                    <div>
                      <p className="body-semibold text-[#0B1C30]">{roleOpt.label}</p>
                      <p className="code-meta text-[#475569] mt-0.5">{roleOpt.description}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={enabled}
                      disabled={isMandatory}
                      onChange={() => toggleDosenStructuralRole(roleOpt.key)}
                      className="mt-1 h-4 w-4 rounded border-[#CBD5E1] accent-[#0F2A66]"
                    />
                  </label>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 p-6">
            <div className="flex items-center gap-2 pb-4 border-b border-[#E2E8F0]">
              <ClipboardCheck className="w-5 h-5 text-[#0F2A66] stroke-[1.5]" />
              <h2 className="headline-sm text-[#0B1C30]">Ringkasan Aktivitas Akademik</h2>
            </div>

            <dl className="divide-y divide-[#E2E8F0] mt-2">
              <div className="py-3 flex items-center justify-between">
                <dt className="body-base text-[#475569]">Mahasiswa Bimbingan S1/S2</dt>
                <dd className="body-semibold text-[#0B1C30]">{supervised.length} mahasiswa</dd>
              </div>
              {activeStructuralRoles.includes('promotor-s3') && (
                <div className="py-3 flex items-center justify-between">
                  <dt className="body-base text-[#475569]">Kandidat Doktor (S3)</dt>
                  <dd className="body-semibold text-[#0B1C30]">
                    {doctoralStudents.length} kandidat
                  </dd>
                </div>
              )}
              {activeStructuralRoles.includes('koordinator-jadwal') && (
                <div className="py-3 flex items-center justify-between">
                  <dt className="body-base text-[#475569]">Agenda Kalender Terjadwal</dt>
                  <dd className="body-semibold text-[#0B1C30]">
                    {lecturerSchedules.length} agenda
                  </dd>
                </div>
              )}
              <div className="py-3 flex items-center justify-between">
                <dt className="body-base text-[#475569]">Batas Revisi Periode</dt>
                <dd className="code-meta text-[#0B1C30]">
                  {formatDateTimeId(period.revisionDeadline)}
                </dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
};
