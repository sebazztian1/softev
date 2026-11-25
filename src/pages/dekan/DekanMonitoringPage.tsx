import React, { useMemo, useState } from 'react';
import { AdminProposal, ProposalStatus } from '../../types/adminPortal';
import { formatDateId } from '../../utils/format';
import { DekanEmpty, DekanError, DekanPanel } from './DekanPageParts';
import {
  loadDekanProposals,
  loadDekanRevisions,
  PERIODS,
  PROGRAMS,
} from './dekanData';

const STATUSES: ProposalStatus[] = [
  'Diajukan',
  'Dalam Review',
  'Diterima',
  'Diperbaiki',
  'Perbaikan Bersyarat',
  'Ditolak',
];

const OCTOBER_REVISION_COUNTS: Record<string, [number, number, number, number]> = {
  IF: [4, 3, 1, 1],
  SI: [3, 2, 1, 1],
  TE: [2, 2, 0, 1],
  TI: [2, 1, 0, 0],
  S2TI: [1, 1, 0, 0],
};

const formatPeriod = (period: string) =>
  PERIODS.find((item) => item.code === period)?.label ?? period;

export const DekanMonitoringPage: React.FC = () => {
  const [proposals] = useState<AdminProposal[]>(loadDekanProposals);
  const [revisions] = useState(loadDekanRevisions);
  const [period, setPeriod] = useState('202612');
  const [programFilter, setProgramFilter] = useState('');
  const [loadError, setLoadError] = useState(() => {
    const panel = new URLSearchParams(window.location.search).get('simulate')?.slice(5);
    return panel?.startsWith('monitoring') ? panel : '';
  });
  const selectedPrograms = useMemo(
    () => PROGRAMS.filter((program) => !programFilter || program.name === programFilter),
    [programFilter],
  );
  const scheduledProposals = proposals.filter((proposal) =>
    proposal.period === '202612' && proposal.status === 'Dalam Review',
  ).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <h1 className="headline-lg text-[#0B1C30]">Monitoring Fakultas</h1>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="dekan-monitoring-period" className="mb-1.5 block label-md">Periode</label>
            <select id="dekan-monitoring-period" className="input-field min-w-48" value={period} onChange={(event) => setPeriod(event.target.value)}>
              {PERIODS.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="dekan-monitoring-program" className="mb-1.5 block label-md">Program Studi</label>
            <select id="dekan-monitoring-program" className="input-field min-w-56" value={programFilter} onChange={(event) => setProgramFilter(event.target.value)}>
              <option value="">Semua Program Studi</option>
              {PROGRAMS.map((item) => <option key={item.code} value={item.name}>{item.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <DekanPanel title="Matriks Status Proposal">
        {loadError === 'monitoring' ? (
          <DekanError message="E-NET-003 — Matriks status proposal gagal dimuat." onRetry={() => setLoadError('')} />
        ) : period === '202702' ? (
          <DekanEmpty message="Tidak ada data proposal pada periode FEBRUARI 2027." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#F1F5F9]">
                  <th className="px-4 py-3 label-md uppercase">Program Studi</th>
                  {STATUSES.map((status) => <th key={status} className="px-3 py-3 text-right label-md uppercase">{status}</th>)}
                  <th className="px-4 py-3 text-right label-md uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {selectedPrograms.map((program) => {
                  const rows = proposals.filter((proposal) =>
                    proposal.program === program.name && proposal.period === period,
                  );
                  return (
                    <tr key={program.code}>
                      <td className="px-4 py-4 body-medium">{program.name}</td>
                      {STATUSES.map((status) => (
                        <td key={status} className="px-3 py-4 text-right code-meta">
                          {rows.filter((proposal) => proposal.status === status).length}
                        </td>
                      ))}
                      <td className="px-4 py-4 text-right body-semibold">{rows.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DekanPanel>

      <DekanPanel title={`Ringkasan Status Revisi · ${formatPeriod(period)}`}>
        {loadError === 'monitoring-revisi' ? (
          <DekanError message="E-NET-003 — Ringkasan status revisi gagal dimuat." onRetry={() => setLoadError('')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="bg-[#F1F5F9]">{['Program Studi', 'Menunggu Persetujuan', 'Disetujui', 'Ditolak', 'Perlu Revisi'].map((heading) => <th key={heading} className="px-4 py-3 label-md uppercase">{heading}</th>)}</tr></thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {selectedPrograms.map((program) => {
                  const values = period === '202610'
                    ? OCTOBER_REVISION_COUNTS[program.code]
                    : [
                        revisions.filter((item) => {
                          const related = proposals.find((proposal) => proposal.id === item.proposalId);
                          return related?.program === program.name && related.period === period && item.status === 'Menunggu Persetujuan';
                        }).length,
                        revisions.filter((item) => {
                          const related = proposals.find((proposal) => proposal.id === item.proposalId);
                          return related?.program === program.name && related.period === period && item.status === 'Disetujui';
                        }).length,
                        revisions.filter((item) => {
                          const related = proposals.find((proposal) => proposal.id === item.proposalId);
                          return related?.program === program.name && related.period === period && item.status === 'Ditolak';
                        }).length,
                        revisions.filter((item) => {
                          const related = proposals.find((proposal) => proposal.id === item.proposalId);
                          return related?.program === program.name && related.period === period && item.status === 'Perlu Revisi';
                        }).length,
                      ];
                  return (
                    <tr key={program.code}>
                      <td className="px-4 py-3 body-medium">{program.name}</td>
                      {values.map((value, index) => <td key={`${program.code}-${index}`} className="px-4 py-3 text-right code-meta">{value}</td>)}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DekanPanel>

      <DekanPanel title="Agenda Sidang Fakultas">
        {loadError === 'monitoring-agenda' ? (
          <DekanError message="E-NET-003 — Agenda sidang gagal dimuat." onRetry={() => setLoadError('')} />
        ) : period === '202702' || scheduledProposals.length === 0 ? (
          <DekanEmpty message="Tidak ada agenda sidang dalam 14 hari ke depan." />
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {scheduledProposals.map((proposal, index) => (
              <div key={proposal.id} className="flex flex-wrap justify-between gap-2 px-5 py-3">
                <div>
                  <p className="body-medium">{proposal.studentName} · {proposal.program}</p>
                  <p className="code-meta mt-1 text-[#475569]">{proposal.title}</p>
                </div>
                <span className="code-meta text-[#475569]">{formatDateId(`2026-12-02T${index % 2 ? '09:30' : '08:00'}:00+07:00`)} · Ruang A.20{index % 3 + 1} · Dijadwalkan</span>
              </div>
            ))}
          </div>
        )}
      </DekanPanel>
    </div>
  );
};
