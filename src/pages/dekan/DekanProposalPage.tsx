import React, { useMemo, useState } from 'react';
import { AdminProposal, getLecturer } from '../../types/adminPortal';
import { DekanEmpty, DekanError, DekanPanel } from './DekanPageParts';
import { loadDekanProposals, PERIODS, PROGRAMS } from './dekanData';

function downloadProposal(proposal: AdminProposal): void {
  const blob = new Blob(
    [`Proposal Tugas Akhir\n${proposal.studentName}\n${proposal.nrp}\n${proposal.title}`],
    { type: 'application/pdf' },
  );
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${proposal.nrp}_Proposal.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export const DekanProposalPage: React.FC = () => {
  const [proposals] = useState<AdminProposal[]>(loadDekanProposals);
  const [program, setProgram] = useState('');
  const [period, setPeriod] = useState('');
  const [appliedFilter, setAppliedFilter] = useState<{ program: string; period: string } | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [error, setError] = useState(() =>
    new URLSearchParams(window.location.search).get('simulate') === 'load:daftar-proposal'
      ? 'E-NET-003 — Daftar proposal gagal dimuat. Periksa koneksi, lalu coba lagi.'
      : '',
  );
  const [downloadError, setDownloadError] = useState('');
  const filtered = useMemo(
    () => appliedFilter
      ? proposals.filter((proposal) =>
          proposal.program === appliedFilter.program && proposal.period === appliedFilter.period,
        )
      : [],
    [appliedFilter, proposals],
  );
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const firstItem = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, filtered.length);
  const selectedPeriod = PERIODS.find((item) => item.code === appliedFilter?.period)?.label;

  const showResults = () => {
    if (!program || !period) return;
    setPage(1);
    setDownloadError('');
    setAppliedFilter({ program, period });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <h1 className="headline-lg text-[#0B1C30]">Daftar Proposal TA/Tesis</h1>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="dekan-proposal-program" className="mb-1.5 block label-md">Program Studi</label>
            <select id="dekan-proposal-program" className="input-field min-w-56" value={program} onChange={(event) => setProgram(event.target.value)}>
              <option value="">Pilih Program Studi</option>
              {PROGRAMS.map((item) => <option key={item.code} value={item.name}>{item.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="dekan-proposal-period" className="mb-1.5 block label-md">Periode</label>
            <select id="dekan-proposal-period" className="input-field min-w-48" value={period} onChange={(event) => setPeriod(event.target.value)}>
              <option value="">Pilih Periode</option>
              {PERIODS.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
            </select>
          </div>
          <button type="button" className="btn-primary" disabled={!program || !period} onClick={showResults}>Tampilkan</button>
        </div>
      </div>

      <DekanPanel title={appliedFilter ? `${appliedFilter.program} · ${selectedPeriod}` : 'Daftar Proposal'}>
        {error ? (
          <DekanError message={error} onRetry={() => setError('')} />
        ) : !appliedFilter ? (
          <DekanEmpty message="Pilih program studi dan periode untuk menampilkan daftar proposal." />
        ) : filtered.length === 0 ? (
          <DekanEmpty message="Tidak ada proposal yang sesuai dengan program studi dan periode yang dipilih." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[#F1F5F9]">
                    {['NRP', 'Nama', 'IPK', 'Judul', 'Pembimbing', 'Co-Pembimbing', 'Periode', 'Perpanjangan', 'Download'].map((heading) => (
                      <th key={heading} className={`px-4 py-3 label-md uppercase text-[#475569] ${heading === 'NRP' || heading === 'IPK' ? 'text-right' : ''}`}>{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {rows.map((proposal, index) => {
                    return (
                      <tr key={proposal.id} className={index % 2 ? 'bg-[#F8FAFC]' : 'bg-white'}>
                        <td className="whitespace-nowrap px-4 py-3 text-right code-meta">{proposal.nrp}</td>
                        <td className="px-4 py-3 body-base">{proposal.studentName}</td>
                        <td className="px-4 py-3 text-right code-meta">{proposal.ipk.toFixed(2)}</td>
                        <td className="min-w-72 px-4 py-3 body-base">{proposal.title}</td>
                        <td className="px-4 py-3 body-base">{getLecturer(proposal.advisorId)?.name ?? '—'}</td>
                        <td className="px-4 py-3 body-base">{getLecturer(proposal.coAdvisorId)?.name ?? '—'}</td>
                        <td className="whitespace-nowrap px-4 py-3 code-meta">{PERIODS.find((item) => item.code === proposal.period)?.label}</td>
                        <td className="px-4 py-3 body-base">{proposal.type === 'Perpanjangan' ? 'Ya' : 'Tidak'}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            className="body-semibold text-[#0284C7]"
                            onClick={() => {
                              if (proposal.damaged) {
                                setDownloadError(`E-DL-002 — Berkas proposal ${proposal.nrp} rusak dan tidak dapat diunduh.`);
                                return;
                              }
                              setDownloadError('');
                              downloadProposal(proposal);
                            }}
                          >
                            Unduh
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {downloadError && <DekanError message={downloadError} onRetry={() => setDownloadError('')} />}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0] px-5 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <label htmlFor="dekan-page-size" className="label-sm text-[#475569]">Jumlah entri</label>
                <select id="dekan-page-size" className="input-field h-9 w-20" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>
                  {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
                </select>
                <span className="code-meta text-[#475569]">Menampilkan {firstItem} sampai {lastItem} dari {filtered.length} data</span>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="btn-secondary h-9 px-3" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Sebelumnya</button>
                <span className="code-meta text-[#475569]">{page} / {Math.max(1, Math.ceil(filtered.length / pageSize))}</span>
                <button type="button" className="btn-secondary h-9 px-3" disabled={page >= Math.ceil(filtered.length / pageSize)} onClick={() => setPage((current) => Math.min(Math.ceil(filtered.length / pageSize), current + 1))}>Berikutnya</button>
              </div>
            </div>
          </>
        )}
      </DekanPanel>
    </div>
  );
};
