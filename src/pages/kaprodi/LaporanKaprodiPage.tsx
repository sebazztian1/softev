import React, { useMemo, useState } from 'react';
import { Download, FileCheck } from 'lucide-react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { usePortal } from '../../context/PortalContext';
import { exportThesesToCsv, formatDateTimeId } from '../../utils/format';

export const LaporanKaprodiPage: React.FC = () => {
  const { theses, lecturers, issueSkForThesis, showToast } = usePortal();
  const [tab, setTab] = useState<'bimbingan' | 'review' | 'upload'>('bimbingan');
  const [periodFilter, setPeriodFilter] = useState('Semua');

  const periods = useMemo(
    () => ['Semua', ...Array.from(new Set(theses.map((t) => t.semester)))],
    [theses],
  );

  const filteredTheses = useMemo(
    () => theses.filter((t) => periodFilter === 'Semua' || t.semester === periodFilter),
    [theses, periodFilter],
  );

  const advisingSummary = useMemo(
    () =>
      lecturers.map((lec) => {
        const asMain = filteredTheses.filter((t) => t.advisor1Id === lec.id).length;
        const asCo = filteredTheses.filter((t) => t.advisor2Id === lec.id).length;
        return {
          lecturer: lec,
          asMain,
          asCo,
          total: asMain + asCo,
        };
      }),
    [lecturers, filteredTheses],
  );

  const reviewRows = useMemo(
    () =>
      filteredTheses.flatMap((t) =>
        t.evaluations
          .filter((ev) => ev.evaluatorRole !== 'Kaprodi')
          .map((ev) => ({
            thesis: t,
            evaluation: ev,
          })),
      ),
    [filteredTheses],
  );

  const uploadStatsByPeriod = useMemo(() => {
    const distinctPeriods = Array.from(new Set(filteredTheses.map((t) => t.semester)));
    return distinctPeriods.map((sem) => {
      const subset = filteredTheses.filter((t) => t.semester === sem);
      return {
        semester: sem,
        totalProposal: subset.length,
        diterima: subset.filter((t) => t.status === 'Diterima').length,
        diperbaiki: subset.filter(
          (t) => t.status === 'Diperbaiki' || t.status === 'Perlu Revisi',
        ).length,
        bersyarat: subset.filter((t) => t.status === 'Perbaikan Bersyarat').length,
        ditolak: subset.filter((t) => t.status === 'Ditolak').length,
        totalPdf: subset.reduce((acc, item) => acc + item.submissions.length, 0),
        totalSk: subset.filter((t) => Boolean(t.skIssued)).length,
      };
    });
  }, [filteredTheses]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="headline-lg text-[#0B1C30]">Laporan Akademik Kaprodi</h1>
          <p className="body-base text-[#475569] mt-1">
            Laporan akumulasi bimbingan dosen, catatan review proposal, serta statistik unggahan dan
            penerbitan SK
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            aria-label="Filter periode laporan"
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="input-field w-48"
          >
            {periods.map((p) => (
              <option key={p} value={p}>
                {p === 'Semua' ? 'Semua Periode' : p}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              exportThesesToCsv(filteredTheses, lecturers, 'laporan-kaprodi-istts');
              showToast('Laporan Kaprodi berhasil diekspor ke CSV');
            }}
            className="btn-secondary shrink-0"
          >
            <Download className="w-4 h-4 stroke-[1.5]" />
            Ekspor CSV
          </button>
        </div>
      </div>

      <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 overflow-hidden">
        <div className="flex flex-wrap items-center border-b border-[#E2E8F0] px-6 gap-6">
          <button
            type="button"
            onClick={() => setTab('bimbingan')}
            className={`relative py-4 body-semibold cursor-pointer ${
              tab === 'bimbingan' ? 'text-[#0F2A66]' : 'text-[#475569] hover:text-[#0F2A66]'
            }`}
          >
            Laporan Bimbingan
            {tab === 'bimbingan' && (
              <span className="absolute bottom-0 inset-x-0 h-[3px] bg-[#0F2A66]" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setTab('review')}
            className={`relative py-4 body-semibold cursor-pointer ${
              tab === 'review' ? 'text-[#0F2A66]' : 'text-[#475569] hover:text-[#0F2A66]'
            }`}
          >
            Laporan Review
            {tab === 'review' && (
              <span className="absolute bottom-0 inset-x-0 h-[3px] bg-[#0F2A66]" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setTab('upload')}
            className={`relative py-4 body-semibold cursor-pointer ${
              tab === 'upload' ? 'text-[#0F2A66]' : 'text-[#475569] hover:text-[#0F2A66]'
            }`}
          >
            Laporan Upload &amp; SK
            {tab === 'upload' && (
              <span className="absolute bottom-0 inset-x-0 h-[3px] bg-[#0F2A66]" />
            )}
          </button>
        </div>

        {tab === 'bimbingan' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0]">
                  <th className="py-3 px-6 label-md uppercase text-[#475569]">Nama Dosen</th>
                  <th className="py-3 px-4 label-md uppercase text-[#475569]">NIDN</th>
                  <th className="py-3 px-4 label-md uppercase text-[#475569] text-right">
                    Pembimbing Utama
                  </th>
                  <th className="py-3 px-4 label-md uppercase text-[#475569] text-right">
                    Co-Pembimbing
                  </th>
                  <th className="py-3 px-6 label-md uppercase text-[#0F2A66] text-right">
                    Total Akumulasi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {advisingSummary.map((row, idx) => (
                  <tr
                    key={row.lecturer.id}
                    className={idx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'}
                  >
                    <td className="py-4 px-6 body-semibold text-[#0B1C30]">
                      {row.lecturer.name}
                    </td>
                    <td className="py-4 px-4 code-meta text-[#475569]">{row.lecturer.nidn}</td>
                    <td className="py-4 px-4 body-medium text-[#0B1C30] text-right">
                      {row.asMain}
                    </td>
                    <td className="py-4 px-4 body-medium text-[#0B1C30] text-right">{row.asCo}</td>
                    <td className="py-4 px-6 body-semibold text-[#0F2A66] text-right">
                      {row.total} mahasiswa
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'review' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0]">
                  <th className="py-3 px-6 label-md uppercase text-[#475569]">Mahasiswa</th>
                  <th className="py-3 px-4 label-md uppercase text-[#475569]">Penilai</th>
                  <th className="py-3 px-4 label-md uppercase text-[#475569]">Status</th>
                  <th className="py-3 px-4 label-md uppercase text-[#475569]">Isi Review</th>
                  <th className="py-3 px-6 label-md uppercase text-[#475569] text-right">
                    Tanggal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {reviewRows.map(({ thesis, evaluation }, idx) => (
                  <tr
                    key={evaluation.id}
                    className={idx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'}
                  >
                    <td className="py-4 px-6 whitespace-nowrap">
                      <p className="body-semibold text-[#0B1C30]">{thesis.studentName}</p>
                      <p className="code-meta text-[#475569]">{thesis.semester}</p>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <p className="body-medium text-[#0B1C30]">{evaluation.evaluatorName}</p>
                      <p className="code-meta text-[#475569]">{evaluation.evaluatorRole}</p>
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={evaluation.status} />
                    </td>
                    <td className="py-4 px-4 body-base text-[#0B1C30] max-w-md">
                      {evaluation.notes}
                    </td>
                    <td className="py-4 px-6 code-meta text-[#475569] text-right whitespace-nowrap">
                      {formatDateTimeId(evaluation.evaluatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'upload' && (
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0]">
                    <th className="py-3 px-6 label-md uppercase text-[#475569]">Periode</th>
                    <th className="py-3 px-4 label-md uppercase text-[#475569] text-right">
                      Diunggah
                    </th>
                    <th className="py-3 px-4 label-md uppercase text-[#15803D] text-right">
                      Diterima
                    </th>
                    <th className="py-3 px-4 label-md uppercase text-[#C2410C] text-right">
                      Diperbaiki
                    </th>
                    <th className="py-3 px-4 label-md uppercase text-[#C2410C] text-right">
                      Bersyarat
                    </th>
                    <th className="py-3 px-4 label-md uppercase text-[#B91C1C] text-right">
                      Ditolak
                    </th>
                    <th className="py-3 px-4 label-md uppercase text-[#475569] text-right">
                      File PDF
                    </th>
                    <th className="py-3 px-6 label-md uppercase text-[#0F2A66] text-right">
                      SK Terbit
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {uploadStatsByPeriod.map((row, idx) => (
                    <tr
                      key={row.semester}
                      className={idx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'}
                    >
                      <td className="py-3.5 px-6 body-semibold text-[#0B1C30]">
                        {row.semester}
                      </td>
                      <td className="py-3.5 px-4 body-medium text-right">{row.totalProposal}</td>
                      <td className="py-3.5 px-4 body-medium text-right">{row.diterima}</td>
                      <td className="py-3.5 px-4 body-medium text-right">{row.diperbaiki}</td>
                      <td className="py-3.5 px-4 body-medium text-right">{row.bersyarat}</td>
                      <td className="py-3.5 px-4 body-medium text-right">{row.ditolak}</td>
                      <td className="py-3.5 px-4 body-medium text-right">{row.totalPdf}</td>
                      <td className="py-3.5 px-6 body-semibold text-[#0F2A66] text-right">
                        {row.totalSk}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 pb-6">
              <h3 className="headline-sm text-[#0B1C30] mb-3">
                Status Penerbitan SK per Mahasiswa
              </h3>
              <div className="rounded-xl border border-[#E2E8F0] overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0]">
                      <th className="py-3 px-4 label-md uppercase text-[#475569]">Mahasiswa</th>
                      <th className="py-3 px-4 label-md uppercase text-[#475569]">Status</th>
                      <th className="py-3 px-4 label-md uppercase text-[#475569]">Status SK</th>
                      <th className="py-3 px-4 label-md uppercase text-[#475569] text-right">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {filteredTheses.map((item, idx) => (
                      <tr key={item.id} className={idx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'}>
                        <td className="py-3 px-4">
                          <p className="body-semibold text-[#0B1C30]">{item.studentName}</p>
                          <p className="code-meta text-[#475569]">{item.studentNim}</p>
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="py-3 px-4 code-meta text-[#0B1C30]">
                          {item.skIssued ? 'SK Sudah Diterbitkan' : 'Belum Diterbitkan'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {!item.skIssued && (
                            <button
                              type="button"
                              onClick={() => issueSkForThesis(item.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 label-md text-[#1E293B] hover:bg-[#F1F5F9] cursor-pointer"
                            >
                              <FileCheck className="w-3.5 h-3.5 stroke-[1.5]" />
                              Terbitkan SK
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
