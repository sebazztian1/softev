import React from 'react';
import { Calendar, ClipboardCheck } from 'lucide-react';
import { AlertBanner } from '../../components/ui/AlertBanner';
import { EmptyState } from '../../components/ui/EmptyState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { usePortal } from '../../context/PortalContext';
import { formatDateId, formatDateTimeId } from '../../utils/format';

export const DosenDashboard: React.FC = () => {
  const { currentUser, theses, period, setActiveTab } = usePortal();
  if (!currentUser) return null;

  const supervised = theses.filter(
    (t) => t.advisor1Id === currentUser.id || t.advisor2Id === currentUser.id,
  );
  const pendingReview = supervised.filter(
    (t) => t.status === 'Menunggu Verifikasi' || t.status === 'Perlu Revisi',
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
          onClick={() => setActiveTab('mahasiswa-bimbingan')}
          className="btn-primary shrink-0"
        >
          Periksa Mahasiswa Bimbingan
        </button>
      </div>

      {(pendingReview.length > 0 || ungradedDefenses.length > 0) && (
        <AlertBanner
          variant="info"
          title={`Terdapat ${pendingReview.length} berkas bimbingan menunggu tindak lanjut dan ${ungradedDefenses.length} sidang menunggu input nilai.`}
          description={`Periode sidang proposal berlangsung pada ${period.defenseWindow}.`}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Columns */}
        <div className="lg:col-span-8 space-y-6">
          {/* Antrean Verifikasi & Revisi */}
          <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E2E8F0]">
              <h2 className="headline-md text-[#0F2A66]">Antrean Bimbingan &amp; Revisi</h2>
              <button
                type="button"
                onClick={() => setActiveTab('mahasiswa-bimbingan')}
                className="body-semibold text-[#0284C7] hover:underline cursor-pointer"
              >
                Kelola Semua
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
                      <th className="py-3 px-4 label-md uppercase text-[#475569]">Judul &amp; Tahap</th>
                      <th className="py-3 px-4 label-md uppercase text-[#475569]">Status</th>
                      <th className="py-3 px-6 label-md uppercase text-[#475569] text-right">
                        Pembaruan
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {supervised.map((item, idx) => (
                      <tr key={item.id} className={idx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'}>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <p className="body-semibold text-[#0B1C30]">{item.studentName}</p>
                          <p className="code-meta text-[#475569]">{item.studentNim}</p>
                        </td>
                        <td className="py-4 px-4 max-w-sm">
                          <p className="body-medium text-[#0B1C30] line-clamp-2">{item.title}</p>
                          <p className="code-meta text-[#475569] mt-0.5">{item.stage}</p>
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

          {/* Jadwal Sidang Proposal Mendatang */}
          <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E2E8F0]">
              <h2 className="headline-sm text-[#0B1C30]">Jadwal Sidang Proposal Terkait</h2>
              <button
                type="button"
                onClick={() => setActiveTab('sidang-penilaian')}
                className="body-semibold text-[#0284C7] hover:underline cursor-pointer"
              >
                Buka Penilaian Sidang
              </button>
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
                      <th className="py-3 px-4 label-md uppercase text-[#475569]">Peran</th>
                      <th className="py-3 px-6 label-md uppercase text-[#475569] text-right">
                        Nilai
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {assignedDefenses.map((item, idx) => {
                      const roleLabel =
                        item.defenseSchedule?.examiner1Id === currentUser.id
                          ? 'Penguji 1'
                          : item.defenseSchedule?.examiner2Id === currentUser.id
                            ? 'Penguji 2'
                            : item.advisor1Id === currentUser.id
                              ? 'Pembimbing 1'
                              : 'Pembimbing 2';
                      return (
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
                          <td className="py-4 px-4 body-base text-[#0B1C30] whitespace-nowrap">
                            {roleLabel}
                          </td>
                          <td className="py-4 px-6 body-semibold text-[#0F2A66] text-right whitespace-nowrap">
                            {item.defenseScore
                              ? `${item.defenseScore.totalScore.toFixed(1)} (${item.defenseScore.grade})`
                              : 'Menunggu nilai'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Right 4 Columns */}
        <aside className="lg:col-span-4 space-y-6">
          <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 p-6">
            <div className="flex items-center gap-2 pb-4 border-b border-[#E2E8F0]">
              <ClipboardCheck className="w-5 h-5 text-[#0F2A66] stroke-[1.5]" />
              <h2 className="headline-sm text-[#0B1C30]">Ringkasan Beban Bimbingan</h2>
            </div>

            <dl className="divide-y divide-[#E2E8F0] mt-2">
              <div className="py-3 flex items-center justify-between">
                <dt className="body-base text-[#475569]">Total Mahasiswa Bimbingan</dt>
                <dd className="body-semibold text-[#0B1C30]">{supervised.length} mahasiswa</dd>
              </div>
              <div className="py-3 flex items-center justify-between">
                <dt className="body-base text-[#475569]">Menunggu Verifikasi / Revisi</dt>
                <dd className="body-semibold text-[#0B1C30]">{pendingReview.length} berkas</dd>
              </div>
              <div className="py-3 flex items-center justify-between">
                <dt className="body-base text-[#475569]">Sidang Belum Dinilai</dt>
                <dd className="body-semibold text-[#0B1C30]">{ungradedDefenses.length} sidang</dd>
              </div>
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
