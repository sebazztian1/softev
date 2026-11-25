import React, { useMemo, useState } from 'react';
import { usePortal } from '../../context/PortalContext';
import { formatDateId } from '../../utils/format';
import { DekanEmpty, DekanError, DekanPanel } from './DekanPageParts';
import {
  AdminProposal,
  ProposalStatus,
} from '../../types/adminPortal';
import {
  getDekanPendingRevisions,
  loadDekanProposals,
  loadDekanRevisions,
  PERIODS,
  PROGRAMS,
} from './dekanData';

const STATUS_TONES: Record<ProposalStatus, string> = {
  Diajukan: 'bg-[#1D4ED8]',
  'Dalam Review': 'bg-[#2563EB]',
  Diterima: 'bg-[#15803D]',
  Diperbaiki: 'bg-[#D97706]',
  'Perbaikan Bersyarat': 'bg-[#F59E0B]',
  Ditolak: 'bg-[#B91C1C]',
};

export const DekanDashboard: React.FC = () => {
  const { setActiveTab } = usePortal();
  const [proposals] = useState<AdminProposal[]>(loadDekanProposals);
  const [revisions] = useState(loadDekanRevisions);
  const [period, setPeriod] = useState('202612');
  const [displayedPeriod, setDisplayedPeriod] = useState('202612');
  const [loadError, setLoadError] = useState(() => {
    const panel = new URLSearchParams(window.location.search).get('simulate')?.slice(5);
    return panel === 'progres' || panel === 'persetujuan' ? panel : '';
  });
  const visibleProposals = useMemo(
    () => proposals.filter((proposal) => proposal.period === displayedPeriod),
    [displayedPeriod, proposals],
  );
  const pendingRevisions = getDekanPendingRevisions(revisions, proposals);
  const counts: [ProposalStatus, number][] = [
    ['Diajukan', visibleProposals.filter((item) => item.status === 'Diajukan').length],
    ['Dalam Review', visibleProposals.filter((item) => item.status === 'Dalam Review').length],
    ['Diterima', visibleProposals.filter((item) => item.status === 'Diterima').length],
    ['Diperbaiki', visibleProposals.filter((item) => item.status === 'Diperbaiki' || item.status === 'Perbaikan Bersyarat').length],
    ['Ditolak', visibleProposals.filter((item) => item.status === 'Ditolak').length],
  ];
  const cards = [
    ['Proposal periode ini', visibleProposals.length],
    ['Diajukan', counts[0][1]],
    ['Dalam Review', counts[1][1]],
    ['Menunggu persetujuan Anda', pendingRevisions.length],
  ];

  const openRevision = (code: string) => {
    localStorage.setItem('tuntas-proto-v2:dekan:revision-code', code);
    setActiveTab('approve');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <h1 className="headline-lg text-[#0B1C30]">Ringkasan Fakultas</h1>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="dekan-dashboard-period" className="mb-1.5 block label-md text-[#0B1C30]">Periode</label>
            <select id="dekan-dashboard-period" className="input-field min-w-48" value={period} onChange={(event) => setPeriod(event.target.value)}>
              {PERIODS.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
            </select>
          </div>
          <button type="button" className="btn-secondary" onClick={() => setDisplayedPeriod(period)}>Tampilkan</button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, count]) => (
          <section key={label} className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-level-1">
            <p className="label-md text-[#475569]">{label}</p>
            <p className="mt-2 font-['Manrope'] text-3xl font-bold text-[#0F2A66]">{count}</p>
          </section>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <DekanPanel title="Progres per Jurusan" className="xl:col-span-8">
          {loadError === 'progres' ? (
            <DekanError message="E-NET-003 — Data progres fakultas gagal dimuat. Coba muat ulang panel ini." onRetry={() => setLoadError('')} />
          ) : displayedPeriod === '202702' ? (
            <DekanEmpty message="Tidak ada proposal pada periode FEBRUARI 2027." />
          ) : (
            <div className="divide-y divide-[#E2E8F0]">
              {PROGRAMS.map((program) => {
                const rows = visibleProposals.filter((proposal) => proposal.program === program.name);
                return (
                  <div key={program.code} className="px-5 py-4">
                    <div className="mb-2 flex justify-between gap-3">
                      <span className="body-medium">{program.name}</span>
                      <span className="code-meta text-[#475569]">{rows.length} / {rows.length}</span>
                    </div>
                    <div className="flex h-3 overflow-hidden rounded-full bg-[#F1F5F9]" aria-label={`Progres ${program.name}`}>
                      {counts.map(([status]) => {
                        const programCount = rows.filter((proposal) =>
                          status === 'Diperbaiki'
                            ? proposal.status === 'Diperbaiki' || proposal.status === 'Perbaikan Bersyarat'
                            : proposal.status === status,
                        ).length;
                        return (
                          <span
                            key={status}
                            title={`${status}: ${programCount}`}
                            className={STATUS_TONES[status]}
                            style={{ width: `${rows.length ? (programCount / rows.length) * 100 : 0}%` }}
                          />
                        );
                      })}
                    </div>
                    <p className="code-meta mt-2 text-[#475569]">
                      {counts.map(([status]) => `${status} ${rows.filter((proposal) =>
                        status === 'Diperbaiki'
                          ? proposal.status === 'Diperbaiki' || proposal.status === 'Perbaikan Bersyarat'
                          : proposal.status === status,
                      ).length}`).join(' · ')}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </DekanPanel>

        <DekanPanel
          title="Persetujuan Revisi Menunggu"
          className="xl:col-span-4"
          action={<button type="button" className="body-semibold text-[#0284C7]" onClick={() => setActiveTab('approve')}>Buka antrean</button>}
        >
          {loadError === 'persetujuan' ? (
            <DekanError message="E-NET-003 — Antrean persetujuan gagal dimuat. Coba muat ulang panel ini." onRetry={() => setLoadError('')} />
          ) : pendingRevisions.length === 0 ? (
            <DekanEmpty message="Tidak ada permintaan persetujuan revisi yang menunggu." />
          ) : (
            <div className="divide-y divide-[#E2E8F0]">
              {pendingRevisions.slice(0, 5).map((revision) => {
                const proposal = proposals.find((item) => item.id === revision.proposalId);
                if (!proposal) return null;
                return (
                  <div key={revision.code} className="px-5 py-4">
                    <p className="body-semibold">{proposal.studentName} <span className="code-meta font-normal">({proposal.nrp})</span></p>
                    <p className="code-meta mt-1 text-[#475569]">{proposal.program} · {proposal.title.slice(0, 56)}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="code-meta text-[#475569]">Batas {formatDateId(revision.expiresAt)}</span>
                      <button type="button" className="body-semibold text-[#0284C7]" onClick={() => openRevision(revision.code)}>Buka</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DekanPanel>
      </div>
    </div>
  );
};
