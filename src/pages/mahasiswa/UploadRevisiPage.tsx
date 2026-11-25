import { useEffect, useState, type FormEvent } from 'react';
import { AlertBanner } from '../../components/ui/AlertBanner';
import { EmptyState } from '../../components/ui/EmptyState';
import { FileDropzone } from '../../components/ui/FileDropzone';
import { QrCodeSvg } from '../../components/ui/QrCodeSvg';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { usePortal } from '../../context/PortalContext';
import type { ThesisRecord, UserAccount } from '../../types/portal';
import { formatCountdown, formatDateTimeId, getLecturerName } from '../../utils/format';
import { getRevisionDetails, needsRevision } from '../../utils/revision';
import { advisorQuotaFull } from '../../utils/studentSubmission';

function RevisionForm({ thesis, student }: { thesis: ThesisRecord; student: UserAccount }) {
  const { lecturers, theses, period, maxQuotas, uploadRevision, showToast } = usePortal();
  const [details, setDetails] = useState(() => getRevisionDetails(thesis));
  const [summary, setSummary] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const locked = thesis.submissionType === 'Perpanjangan';
  const quota = maxQuotas.find((setting) => setting.department === student.department)?.maxPerPeriod
    ?? period.maxAdvisorQuota;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!file) {
      showToast('Pilih berkas revisi dalam format PDF terlebih dahulu.', 'error');
      return;
    }
    setSaving(true);
    try {
      await uploadRevision(thesis.id, summary, file, details);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Berkas revisi gagal disimpan.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="student-panel space-y-4 p-5 sm:p-6">
      <h2 className="headline-md text-navy">Berkas perbaikan</h2>
      <details className="student-disclosure">
        <summary>Jenis pengerjaan dan pembimbing · {details.submissionType}</summary>
        {locked ? (
          <div className="mt-3 space-y-1 body-base">
            <p>{details.title}</p>
            <p>{[details.advisor1Id, details.advisor2Id].filter(Boolean).map((id) => getLecturerName(lecturers, id)).join(' / ')}</p>
          </div>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="label-md" htmlFor="rev-type">Jenis pengerjaan
              <select id="rev-type" className="input-field mt-1" value={details.submissionType}
                onChange={(event) => setDetails({ ...details, submissionType: event.target.value as ThesisRecord['submissionType'] })}>
                <option>Judul Baru</option><option>Perpanjangan</option>
              </select>
            </label>
            <label className="label-md sm:col-span-2" htmlFor="rev-title">Judul tugas akhir
              <textarea required id="rev-title" className="textarea-field mt-1" rows={2} value={details.title}
                onChange={(event) => setDetails({ ...details, title: event.target.value })} />
            </label>
            {(['advisor1Id', 'advisor2Id'] as const).map((key) => {
              const primary = key === 'advisor1Id';
              return <label key={key} htmlFor={`rev-${key}`} className="label-md">
                {primary ? 'Dosen pembimbing utama' : 'Co-pembimbing (opsional)'}
                <select id={`rev-${key}`} className="input-field mt-1" required={primary} value={details[key]}
                  onChange={(event) => setDetails({ ...details, [key]: event.target.value })}>
                  <option value="">{primary ? 'Pilih pembimbing' : 'Tanpa co-pembimbing'}</option>
                  {lecturers.map((lecturer) => {
                    const full = advisorQuotaFull(lecturer, theses, student, period, maxQuotas);
                    const selectedOther = lecturer.id === details[primary ? 'advisor2Id' : 'advisor1Id'];
                    return <option key={lecturer.id} value={lecturer.id} disabled={full || selectedOther}>
                      {lecturer.name}{full ? ' (kuota penuh)' : ''}
                    </option>;
                  })}
                </select>
              </label>;
            })}
            <p className="code-meta text-ink-secondary sm:col-span-2">Maksimal {quota} bimbingan per dosen pada periode ini.</p>
          </div>
        )}
      </details>
      {details.submissionType === 'Perpanjangan' && (
        <p className="rounded-lg border border-[#FCA5A5] bg-[#FEE2E2] px-3 py-2 body-base text-[#991B1B]">
          {locked ? 'Judul dan pembimbing terkunci untuk perpanjangan ini.'
            : 'Setelah perpanjangan dikirim, judul dan pembimbing akan terkunci.'}
        </p>
      )}
      <label className="block label-md" htmlFor="rev-summary">Ringkasan perubahan
        <textarea id="rev-summary" required rows={3} className="textarea-field mt-1" value={summary}
          onChange={(event) => setSummary(event.target.value)} />
      </label>
      <FileDropzone file={file} onFileSelect={setFile} headline="Tarik & lepaskan file revisi di sini, atau klik untuk memilih file"
        helperText="PDF · Maksimal 20 MB" />
      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Mengunggah…' : 'Unggah revisi'}</button>
      </div>
    </form>
  );
}

export function UploadRevisiPage() {
  const { currentUser, studentThesis: thesis, period, setActiveTab } = usePortal();
  const deadline = thesis?.revisionDeadline ?? period.revisionDeadline;
  const [countdown, setCountdown] = useState(() => formatCountdown(deadline));
  useEffect(() => {
    let timer: number;
    const refresh = () => {
      setCountdown(formatCountdown(deadline));
      const remaining = Date.parse(deadline) - Date.now();
      if (remaining > 0) timer = window.setTimeout(refresh, Math.min(remaining, 60_000));
    };
    refresh();
    return () => window.clearTimeout(timer);
  }, [deadline]);

  if (!currentUser) return null;
  if (!thesis) return (
    <div className="space-y-5">
      <h1 className="headline-lg">Upload Revisi</h1>
      <div className="student-panel"><EmptyState message="Belum ada berkas proposal yang diajukan untuk direvisi."
        action={<button className="btn-primary" onClick={() => setActiveTab('upload-proposal')}>Unggah Proposal</button>} /></div>
    </div>
  );

  const requested = needsRevision(thesis.status);
  const revision = thesis.submissions.find((submission) => submission.kind === 'revisi');
  const qrToken = revision?.revisionQrToken ?? (revision ? thesis.revisionQrToken : undefined);
  const note = thesis.evaluations.find((evaluation) => needsRevision(evaluation.status));
  const waiting = thesis.stage === 'Revisi Proposal' && thesis.status === 'Menunggu Verifikasi';
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="headline-lg">Upload Revisi</h1>
          <p className="body-base text-ink-secondary mt-1">{currentUser.name} · {period.semesterLabel}</p>
        </div>
        <StatusBadge status={thesis.status} />
      </header>
      {requested && <AlertBanner variant="warning"
        title={countdown.isExpired ? 'Batas waktu telah berakhir' : `Batas akhir revisi · ${countdown.label}`}
        description={formatDateTimeId(deadline)} />}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          {requested && !countdown.isExpired && <RevisionForm key={thesis.id} thesis={thesis} student={currentUser} />}
          {revision && (
            <section className="student-panel p-5 sm:p-6">
              <h2 className="headline-sm text-navy">{waiting ? 'Revisi menunggu verifikasi' : 'Revisi terakhir'}</h2>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                {qrToken && <QrCodeSvg value={qrToken} size={132} />}
                <div className="min-w-0 flex-1 basis-44 space-y-1">
                  <p className="body-semibold break-all">{revision.fileName}</p>
                  <p className="code-meta text-ink-secondary">{revision.versionLabel} · {formatDateTimeId(revision.uploadedAt)}</p>
                  {qrToken && <p className="body-medium break-all text-navy">{qrToken}</p>}
                  {waiting && qrToken && <p className="body-base text-ink-secondary">Tunjukkan kode QR ini kepada pembimbing atau Kaprodi.</p>}
                  <button className="student-link" onClick={() => setActiveTab('download-proposal')}>Lihat berkas</button>
                </div>
              </div>
            </section>
          )}
          {!requested && !revision && <section className="student-panel p-5 body-base">Belum ada permintaan revisi untuk proposal ini.</section>}
        </div>
        <aside className="min-w-0 space-y-4">
          <section className="student-panel p-5">
            <h2 className="headline-sm text-navy">Catatan perbaikan</h2>
            {note ? <div className="mt-3 space-y-2">
              <p className="body-base">{note.notes}</p>
              <p className="code-meta text-ink-secondary">{note.evaluatorName} · {note.evaluatorRole}</p>
            </div> : <p className="mt-2 body-base text-ink-secondary">Belum ada catatan perbaikan.</p>}
            <button className="student-link mt-3" onClick={() => setActiveTab('hasil-sidang')}>Lihat hasil sidang</button>
          </section>
          <details className="student-panel p-4">
            <summary className="body-semibold cursor-pointer text-navy">Profil mahasiswa</summary>
            <dl className="mt-3 space-y-2 body-base">
              {[
                ['NRP / Username', `${currentUser.identifier} (@${currentUser.username})`],
                ['Email', currentUser.email], ['Jurusan', currentUser.department],
                ['IPK', (currentUser.ipk ?? thesis.ipk).toFixed(2)],
              ].map(([label, value]) => <div key={label}><dt className="code-meta text-ink-secondary">{label}</dt><dd className="break-words">{value}</dd></div>)}
            </dl>
          </details>
        </aside>
      </div>
    </div>
  );
}
