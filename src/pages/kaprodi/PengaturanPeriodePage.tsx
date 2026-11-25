import React, { useState } from 'react';
import { usePortal } from '../../context/PortalContext';

function isoToDateInput(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '2026-12-01';
  return date.toISOString().slice(0, 10);
}

function isoToDateTimeLocalInput(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '2026-11-29T17:00';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export const PengaturanPeriodePage: React.FC = () => {
  const { period, updateAcademicPeriod } = usePortal();

  const [semesterLabel, setSemesterLabel] = useState(period.semesterLabel);
  const [proposalDeadline, setProposalDeadline] = useState(
    isoToDateInput(period.proposalDeadline),
  );
  const [defenseWindow, setDefenseWindow] = useState(period.defenseWindow);
  const [revisionDeadline, setRevisionDeadline] = useState(
    isoToDateTimeLocalInput(period.revisionDeadline),
  );
  const [maxAdvisorQuota, setMaxAdvisorQuota] = useState(period.maxAdvisorQuota);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateAcademicPeriod({
      semesterLabel: semesterLabel.trim(),
      proposalDeadline: new Date(`${proposalDeadline}T23:59:00`).toISOString(),
      defenseWindow: defenseWindow.trim(),
      revisionDeadline: new Date(revisionDeadline).toISOString(),
      maxAdvisorQuota,
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="headline-lg text-[#0B1C30]">Pengaturan Periode</h1>
        <p className="body-base text-[#475569] mt-1">
          Konfigurasi tenggat pengajuan proposal, jadwal periode sidang, dan kuota pembimbingan
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-3xl rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 p-6 sm:p-8 space-y-5"
      >
        <h2 className="headline-md text-[#0F2A66] pb-4 border-b border-[#E2E8F0]">
          Parameter Periode Tugas Akhir
        </h2>

        <div>
          <label htmlFor="per-semester" className="block label-md text-[#0B1C30] mb-1.5">
            Label Periode Semester
          </label>
          <input
            id="per-semester"
            type="text"
            value={semesterLabel}
            onChange={(e) => setSemesterLabel(e.target.value)}
            className="input-field"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="per-prop" className="block label-md text-[#0B1C30] mb-1.5">
              Batas Akhir Pengajuan Proposal
            </label>
            <input
              id="per-prop"
              type="date"
              value={proposalDeadline}
              onChange={(e) => setProposalDeadline(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div>
            <label htmlFor="per-rev" className="block label-md text-[#0B1C30] mb-1.5">
              Batas Akhir Unggah Revisi Sidang
            </label>
            <input
              id="per-rev"
              type="datetime-local"
              value={revisionDeadline}
              onChange={(e) => setRevisionDeadline(e.target.value)}
              className="input-field"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="per-def" className="block label-md text-[#0B1C30] mb-1.5">
              Rentang Pelaksanaan Sidang Proposal
            </label>
            <input
              id="per-def"
              type="text"
              value={defenseWindow}
              onChange={(e) => setDefenseWindow(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div>
            <label htmlFor="per-quota" className="block label-md text-[#0B1C30] mb-1.5">
              Kuota Maksimal Bimbingan per Dosen
            </label>
            <input
              id="per-quota"
              type="number"
              min={1}
              max={20}
              value={maxAdvisorQuota}
              onChange={(e) => setMaxAdvisorQuota(Number(e.target.value))}
              className="input-field"
              required
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-[#E2E8F0]">
          <button type="submit" className="btn-primary">
            Simpan Pengaturan
          </button>
        </div>
      </form>
    </div>
  );
};
