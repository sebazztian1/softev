import React from 'react';
import { CalendarClock, ShieldCheck } from 'lucide-react';
import { AlertBanner } from '../../components/ui/AlertBanner';
import { EmptyState } from '../../components/ui/EmptyState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { usePortal } from '../../context/PortalContext';
import { formatDateId } from '../../utils/format';

export const KaprodiDashboard: React.FC = () => {
  const { currentUser, theses, lecturers, period, setActiveTab } = usePortal();
  if (!currentUser) return null;

  const awaitingVerification = theses.filter(
    (t) => t.stage === 'Verifikasi Kaprodi' && t.status === 'Menunggu Verifikasi',
  );
  const readyForSchedule = theses.filter(
    (t) => t.stage === 'Verifikasi Kaprodi' && t.status === 'Diterima' && !t.defenseSchedule,
  );

  const stageCounts = [
    {
      label: 'Verifikasi Kaprodi',
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
          onClick={() => setActiveTab('verifikasi-proposal')}
          className="btn-primary shrink-0"
        >
          Verifikasi Proposal Masuk
        </button>
      </div>

      {(awaitingVerification.length > 0 || readyForSchedule.length > 0) && (
        <AlertBanner
          variant="info"
          title={`Terdapat ${awaitingVerification.length} proposal baru menunggu verifikasi dan ${readyForSchedule.length} proposal siap dijadwalkan Sidang Proposal.`}
          description={`Periode sidang berlangsung pada ${period.defenseWindow}.`}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Columns */}
        <div className="lg:col-span-8 space-y-6">
          {/* Antrean Verifikasi Proposal */}
          <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E2E8F0]">
              <h2 className="headline-md text-[#0F2A66]">
                Pengajuan Proposal Menunggu Verifikasi
              </h2>
              <button
                type="button"
                onClick={() => setActiveTab('verifikasi-proposal')}
                className="body-semibold text-[#0284C7] hover:underline cursor-pointer"
              >
                Lihat Semua
              </button>
            </div>

            {awaitingVerification.length === 0 ? (
              <EmptyState
                icon={ShieldCheck}
                message="Seluruh proposal baru telah selesai diverifikasi pada tahap Kaprodi."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0]">
                      <th className="py-3 px-6 label-md uppercase text-[#475569]">Mahasiswa</th>
                      <th className="py-3 px-4 label-md uppercase text-[#475569]">Judul Proposal</th>
                      <th className="py-3 px-4 label-md uppercase text-[#475569]">Status</th>
                      <th className="py-3 px-6 label-md uppercase text-[#475569] text-right">
                        Tanggal Unggah
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {awaitingVerification.map((item, idx) => (
                      <tr key={item.id} className={idx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'}>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <p className="body-semibold text-[#0B1C30]">{item.studentName}</p>
                          <p className="code-meta text-[#475569]">{item.studentNim}</p>
                        </td>
                        <td className="py-4 px-4 max-w-md">
                          <p className="body-medium text-[#0B1C30]">{item.title}</p>
                          <p className="code-meta text-[#475569] mt-0.5">{item.field}</p>
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
                onClick={() => setActiveTab('monitoring-ta')}
                className="body-semibold text-[#0284C7] hover:underline cursor-pointer"
              >
                Buka Monitoring Lengkap
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
          <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 p-6">
            <div className="flex items-center gap-2 pb-4 border-b border-[#E2E8F0]">
              <CalendarClock className="w-5 h-5 text-[#0F2A66] stroke-[1.5]" />
              <h2 className="headline-sm text-[#0B1C30]">Periode Akademik Aktif</h2>
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
                <dt className="label-md uppercase text-[#475569]">Periode Sidang Proposal</dt>
                <dd className="body-medium text-[#0B1C30] mt-0.5">{period.defenseWindow}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 p-6">
            <h2 className="headline-sm text-[#0B1C30] pb-4 border-b border-[#E2E8F0]">
              Distribusi Beban Pembimbing
            </h2>
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
