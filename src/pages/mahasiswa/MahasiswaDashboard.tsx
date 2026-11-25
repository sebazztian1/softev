import React, { useState } from 'react';
import { BookOpen, CalendarDays, Check, Clock, Eye, FileText } from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatCountdown, formatDateId, formatDateTimeId, getLecturerName, submissionPdf } from '../../utils/format';
import { needsRevision } from '../../utils/revision';
import { ThesisStage } from '../../types/portal';

const stages: ThesisStage[] = ['Pengajuan Proposal', 'Verifikasi Kaprodi', 'Sidang Proposal', 'Revisi Proposal', 'Pengesahan Akhir'];

export const MahasiswaDashboard: React.FC = () => {
  const { currentUser, studentThesis: thesis, period, lecturers, setActiveTab, openFilePreview } = usePortal();
  const [calendarOpen, setCalendarOpen] = useState(false);
  if (!currentUser) return null;

  const revisionDate = thesis?.revisionDeadline ?? period.revisionDeadline;
  const revision = formatCountdown(revisionDate);
  const proposal = formatCountdown(period.proposalDeadline);
  const schedule = thesis?.defenseSchedule;
  const revisionRequired = Boolean(thesis && needsRevision(thesis.status));
  const nextAction = !thesis || thesis.status === 'Ditolak'
    ? { tab: 'upload-proposal', label: thesis ? 'Ajukan Ulang Proposal' : 'Unggah Proposal', closed: proposal.isExpired }
    : revisionRequired
      ? { tab: 'upload-revisi', label: 'Unggah Revisi', closed: revision.isExpired }
      : { tab: 'hasil-sidang', label: 'Lihat Hasil Sidang', closed: false };
  const stageIndex = thesis ? stages.indexOf(thesis.stage) : -1;
  const latestFile = thesis?.submissions[0];
  const latestReview = thesis?.evaluations.find(ev => ev.evaluatorRole !== 'Kaprodi');
  const periods = [
    { label: 'Pengajuan proposal', date: period.proposalDeadline, countdown: proposal, tab: 'upload-proposal', action: 'Upload Proposal' },
    { label: 'Unggah revisi', date: revisionDate, countdown: revision, tab: 'upload-revisi', action: 'Upload Revisi' },
  ];
  const agenda = periods.map(item => ({ title: item.label, date: item.date, detail: formatDateTimeId(item.date) }));
  if (schedule) agenda.push({ title: 'Sidang proposal', date: schedule.date, detail: schedule.time + ' · ' + schedule.room });
  agenda.sort((a, b) => Date.parse(a.date) - Date.parse(b.date));

  return (
    <div className="space-y-5">
      <header>
        <h1 className="headline-lg text-ink">Dashboard Tugas Akhir</h1>
        <p className="body-base text-ink-secondary mt-1">{currentUser.name} · NRP {currentUser.identifier} · {currentUser.department}</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="student-panel p-5 sm:p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="label-md text-ink-secondary">Tugas akhir · {period.semesterLabel}</h2>
            {thesis && <StatusBadge status={thesis.status} />}
          </div>
          <p className="headline-md mt-3 text-navy">{thesis?.newTitle || thesis?.title || 'Belum ada berkas proposal yang diunggah.'}</p>
          {thesis && (
            <p className="body-base text-ink-secondary mt-2">
              Pembimbing · {[thesis.advisor1Id, thesis.advisor2Id].filter(Boolean).map(id => getLecturerName(lecturers, id)).join(' / ')}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <button className="btn-primary" disabled={nextAction.closed} onClick={() => setActiveTab(nextAction.tab)}>{nextAction.label}</button>
            {revisionRequired && <span className="inline-flex items-center gap-2 body-medium text-[#92400E]"><Clock size={16} />{revision.isExpired ? revision.label : 'Sisa waktu revisi · ' + revision.label}</span>}
          </div>
          {thesis && (
            <details className="student-disclosure mt-4">
              <summary>Tahap saat ini · {thesis.stage}</summary>
              <p className="body-base text-ink-secondary mt-3">{thesis.submissionType} · {thesis.field}</p>
              {thesis.newTitle && <p className="body-base text-ink-secondary mt-1">Judul pengajuan awal · {thesis.title}</p>}
              <ol className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                {stages.map((stage, index) => <li key={stage} aria-current={index === stageIndex ? 'step' : undefined}
                  className={'inline-flex items-center gap-1.5 code-meta ' + (index === stageIndex ? 'text-navy font-semibold' : 'text-ink-secondary')}>
                  {index < stageIndex ? <Check size={14} /> : <span>{index + 1}.</span>}{stage}
                </li>)}
              </ol>
            </details>
          )}
        </section>

        <section className="student-panel p-5 sm:p-6">
          <h2 className="flex items-center gap-2 headline-sm text-navy"><CalendarDays size={19} />Jadwal sidang</h2>
          {schedule ? (
            <div className="my-4">
              <p className="headline-md text-ink">{formatDateId(schedule.date)}</p>
              <p className="body-base mt-1">{schedule.time}</p>
              <p className="body-base text-ink-secondary">{schedule.room}</p>
            </div>
          ) : <p className="my-4 body-base text-ink-secondary">Jadwal sidang belum ditetapkan.</p>}
          <button type="button" className="btn-secondary" onClick={() => setCalendarOpen(true)}>Buka kalender</button>
        </section>
      </div>

      <section className="student-panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
          <h2 className="headline-sm">Periode tugas akhir</h2><span className="code-meta text-ink-secondary">{period.managedBy} · {period.semesterLabel}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-subtle text-ink-secondary"><tr>{['Periode', 'Status', 'Batas akhir', 'Sisa waktu', 'Aksi'].map(t => <th key={t} className="px-4 py-2 label-md whitespace-nowrap">{t}</th>)}</tr></thead>
            <tbody>{periods.map(item => <tr className="border-t border-border" key={item.tab}>
              <th scope="row" className="px-4 py-3 body-medium">{item.label}</th>
              <td className="px-4 py-3">{item.countdown.isExpired ? 'Ditutup' : 'Terbuka'}</td>
              <td className="px-4 py-3 whitespace-nowrap">{formatDateTimeId(item.date)}</td>
              <td className="px-4 py-3 whitespace-nowrap">{item.countdown.label}</td>
              <td className="px-4 py-3"><button type="button" className="student-link whitespace-nowrap" onClick={() => setActiveTab(item.tab)}>{item.action}</button></td>
            </tr>)}</tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="student-panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="headline-sm">Riwayat Unggahan Berkas</h2>
            <button className="student-link" onClick={() => setActiveTab('download-proposal')}>Lihat Semua Berkas</button>
          </div>
          {latestFile && thesis ? <div className="mt-3 flex items-center gap-3">
            <FileText className="shrink-0 text-ink-secondary" size={18} />
            <div className="min-w-0 flex-1"><p className="body-medium break-all">{latestFile.fileName}</p><p className="code-meta text-ink-secondary">{latestFile.versionLabel} · {formatDateId(latestFile.uploadedAt)}</p></div>
            <button aria-label="Pratinjau" title="Pratinjau" className="btn-secondary shrink-0" onClick={() => openFilePreview(submissionPdf(thesis, latestFile))}><Eye size={16} /></button>
          </div> : <p className="body-base text-ink-secondary mt-2">Belum ada berkas yang diunggah.</p>}
        </section>
        <section className="student-panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="headline-sm">Catatan penilai terbaru</h2>
            {latestReview && <button className="student-link" onClick={() => setActiveTab('hasil-sidang')}>Lihat hasil sidang</button>}
          </div>
          <p className="body-base mt-2">{latestReview?.notes ?? 'Belum ada catatan penilai.'}</p>
          {latestReview && <p className="code-meta text-ink-secondary mt-1">{latestReview.evaluatorName}</p>}
        </section>
      </div>
      <details className="student-panel p-4 body-base">
        <summary className="cursor-pointer font-semibold text-navy"><BookOpen size={16} className="inline mr-2" />Pedoman Pengajuan Proposal</summary>
        <ol className="mt-3 list-decimal pl-6 space-y-1 text-ink-secondary">
          <li>Konsultasikan topik dan ketersediaan pembimbing.</li><li>Lengkapi formulir proposal serta Bab 1–3 dalam satu PDF.</li>
          <li>Pilih tag topik, lalu unggah dan konfirmasi berkas.</li><li>Periksa hasil sidang dan kirim revisi sebelum tenggat.</li>
        </ol>
      </details>

      <Modal open={calendarOpen} title="Kalender akademik mahasiswa" onClose={() => setCalendarOpen(false)} maxWidthClass="max-w-lg">
        <p className="body-medium text-ink-secondary">{period.semesterLabel} · {currentUser.name}</p>
        <ol aria-label="Agenda akademik" className="divide-y divide-border mt-2">
          {agenda.map(event => <li key={event.title} className="py-3">
            <time dateTime={event.date} className="code-meta text-ink-secondary">{formatDateId(event.date)}</time>
            <p className="body-semibold text-navy">{event.title}</p><p className="body-base">{event.detail}</p>
          </li>)}
        </ol>
      </Modal>
    </div>
  );
};
