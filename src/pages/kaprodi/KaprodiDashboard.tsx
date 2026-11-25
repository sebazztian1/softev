import React from 'react';
import { CalendarClock, Sparkles } from 'lucide-react';
import { AlertBanner } from '../../components/ui/AlertBanner';
import { EmptyState } from '../../components/ui/EmptyState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { usePortal } from '../../context/PortalContext';
import { formatDateId } from '../../utils/format';

export const KaprodiDashboard: React.FC = () => {
  const { currentUser, theses, lecturers, period, navigateWithContext, setActiveTab } =
    usePortal();
  if (!currentUser) return null;

  const awaitingPlotting = theses.filter((t) => t.proposalReviewers.length === 0);
  const readyForSchedule = theses.filter(
    (t) => t.proposalReviewers.length > 0 && !t.defenseSchedule && t.status !== 'Ditolak',
  );

  const stageCounts = [
    {
      label: 'Verifikasi Kaprodi / Plotting',
      count: theses.filter((t) => t.stage === 'Verifikasi Kaprodi').length,
    },
    {
      label: 'Sidang Proposal',
      count: theses.filter((t) => t.stage === 'Sidang Proposal').length,
    },
    {
      label: 'Revisi Proposal',
      count: theses.filter((t) => t.stage === 'Revisi Proposal').length,
    },
    {
      label: 'Pengesahan Akhir',
      count: theses.filter((t) => t.stage === 'Pengesahan Akhir').length,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="headline-lg text-[#0B1C30]">Dashboard Kaprodi</h1>
          <p className="body-base text-[#475569] mt-1">
            {currentUser.name} — {currentUser.department} — {period.semesterLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigateWithContext('plotting-reviewer', 'proposal')}
          className="btn-primary shrink-0"
        >
          Plotting Reviewer Proposal
        </button>
      </div>

      {(awaitingPlotting.length > 0 || readyForSchedule.length > 0) && (
        <AlertBanner
          variant="info"
          title={`Terdapat ${awaitingPlotting.length} proposal menunggu plotting reviewer dan ${readyForSchedule.length} proposal siap dijadwalkan Sidang Proposal.`}
          description={`Periode pelaksanaan sidang dikelola oleh ${period.managedBy} (${period.defenseWindow}).`}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Columns */}
        <div className="lg:col-span-8 space-y-6">
          {/* Antrean Plotting Reviewer Proposal */}
          <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E2E8F0]">
              <h2 className="headline-md text-[#0F2A66]">
                Proposal Menunggu Plotting Reviewer (Recommender System)
              </h2>
              <button
                type="button"
                onClick={() => navigateWithContext('plotting-reviewer', 'proposal')}
                className="body-semibold text-[#0284C7] hover:underline cursor-pointer"
              >
                Lihat Semua
              </button>
            </div>

            {awaitingPlotting.length === 0 ? (
              <EmptyState
                icon={Sparkles}
                message="Seluruh proposal masuk telah memiliki tim reviewer yang ditetapkan."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0]">
                      <th className="py-3 px-6 label-md uppercase text-[#475569]">Mahasiswa</th>
                      <th className="py-3 px-4 label-md uppercase text-[#475569]">
                        Judul &amp; Tag
                      </th>
                      <th className="py-3 px-4 label-md uppercase text-[#475569]">Status</th>
                      <th className="py-3 px-6 label-md uppercase text-[#475569] text-right">
                        Tanggal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {awaitingPlotting.map((item, idx) => (
                      <tr key={item.id} className={idx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'}>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <p className="body-semibold text-[#0B1C30]">{item.studentName}</p>
                          <p className="code-meta text-[#475569]">{item.studentNim}</p>
                        </td>
                        <td className="py-4 px-4 max-w-md">
                          <button
                            type="button"
                            onClick={() =>
                              navigateWithContext('plotting-reviewer', 'proposal', item.id)
                            }
                            className="body-medium text-[#0B1C30] hover:text-[#0284C7] text-left cursor-pointer"
                          >
                            {item.title}
                          </button>
                          <p className="code-meta text-[#0284C7] mt-0.5">
                            Tag: {item.tags.join(', ')}
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

          {/* Rekapitulasi Tahap Tugas Akhir */}
          <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E2E8F0]">
              <h2 className="headline-sm text-[#0B1C30]">Rekapitulasi Tahap Tugas Akhir</h2>
              <button
                type="button"
                onClick={() => setActiveTab('laporan')}
                className="body-semibold text-[#0284C7] hover:underline cursor-pointer"
              >
                Buka Laporan Kaprodi
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0]">
                    <th className="py-3 px-6 label-md uppercase text-[#475569]">Tahap Akademik</th>
                    <th className="py-3 px-6 label-md uppercase text-[#475569] text-right">
                      Jumlah Mahasiswa
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {stageCounts.map((row, idx) => (
                    <tr key={row.label} className={idx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'}>
                      <td className="py-3.5 px-6 body-medium text-[#0B1C30]">{row.label}</td>
                      <td className="py-3.5 px-6 body-semibold text-[#0F2A66] text-right">
                        {row.count} mahasiswa
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right 4 Columns */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Read-only BAA Period Card (Master Periode removed from Kaprodi) */}
          <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 p-6">
            <div className="flex items-center gap-2 pb-4 border-b border-[#E2E8F0]">
              <CalendarClock className="w-5 h-5 text-[#0F2A66] stroke-[1.5]" />
              <h2 className="headline-sm text-[#0B1C30]">Periode Aktif ({period.managedBy})</h2>
            </div>

            <dl className="divide-y divide-[#E2E8F0] mt-2">
              <div className="py-3">
                <dt className="label-md uppercase text-[#475569]">Semester</dt>
                <dd className="body-medium text-[#0B1C30] mt-0.5">{period.semesterLabel}</dd>
              </div>
              <div className="py-3">
                <dt className="label-md uppercase text-[#475569]">Batas Pengajuan Proposal</dt>
                <dd className="body-medium text-[#0B1C30] mt-0.5">
                  {formatDateId(period.proposalDeadline)}
                </dd>
              </div>
              <div className="py-3">
                <dt className="label-md uppercase text-[#475569]">Periode Sidang Serentak</dt>
                <dd className="body-medium text-[#0B1C30] mt-0.5">{period.defenseWindow}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
              <h2 className="headline-sm text-[#0B1C30]">Distribusi Beban Pembimbing</h2>
              <button
                type="button"
                onClick={() => setActiveTab('setting-maksimum')}
                className="label-md text-[#0284C7] hover:underline cursor-pointer"
              >
                Atur Batas
              </button>
            </div>
            <div className="divide-y divide-[#E2E8F0]">
              {lecturers.map((lec) => {
                const activeCount = theses.filter(
                  (t) => t.advisor1Id === lec.id || t.advisor2Id === lec.id,
                ).length;
                return (
                  <div key={lec.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="body-medium text-[#0B1C30] truncate">{lec.name}</p>
                      <p className="code-meta text-[#475569] truncate">{lec.expertise}</p>
                    </div>
                    <span className="body-semibold text-[#0F2A66] whitespace-nowrap">
                      {activeCount}/{lec.maxQuota}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};
