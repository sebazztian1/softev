import React, { useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { AlertBanner } from '../../components/ui/AlertBanner';
import { FileDropzone } from '../../components/ui/FileDropzone';
import { ProposalUploadPayload, UploadReceipt, usePortal } from '../../context/PortalContext';
import { AVAILABLE_TAGS } from '../../data/seedData';
import type { ThesisRecord, TopicRecommendation } from '../../types/portal';
import { downloadPdfPayload, formatDateTimeId, formatFileSize } from '../../utils/format';
import { advisorQuotaFull, getAdvisorQuotaError } from '../../utils/studentSubmission';
import { getTemplateDocument, proposalForm } from '../../utils/templateDocuments';

const FIELDS = [
  'Computer Vision & Embedded AI', 'Natural Language Processing', 'Rekayasa Perangkat Lunak',
  'Keamanan Jaringan & Cloud', 'Data Engineering & Distributed Systems', 'IoT & Jaringan Komputer',
];

function initialData(type: ProposalUploadPayload['submissionType'], thesis?: ThesisRecord, topic?: TopicRecommendation | null): ProposalUploadPayload {
  const prior = type === 'Perpanjangan' ? thesis : undefined;
  return {
    submissionType: type, title: topic?.title ?? prior?.title ?? '', field: topic?.field ?? prior?.field ?? '',
    tags: prior?.tags ?? [], abstract: topic?.description ?? prior?.abstract ?? '',
    proposedAdvisor1Id: topic?.lecturerId ?? prior?.advisor1Id ?? '', proposedAdvisor2Id: prior?.advisor2Id ?? '',
    summary: '',
  };
}

const labelClass = 'block label-md text-[#0B1C30] mb-1.5';
const panelClass = 'rounded-xl border border-[#E2E8F0] bg-white p-5 sm:p-7 shadow-level-1';

function ProposalForm({ onSuccess }: { onSuccess: (receipt: UploadReceipt) => void }) {
  const { currentUser, studentThesis, lecturers, theses, period, maxQuotas, topics, preselectedTopic, clearPreselectedTopic, uploadProposal } = usePortal();
  const [data, setData] = useState(() => initialData(
    preselectedTopic ? 'Judul Baru' : studentThesis?.submissionType ?? 'Judul Baru', studentThesis, preselectedTopic,
  ));
  const [step, setStep] = useState<1 | 2>(1);
  const [file, setFile] = useState<File | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const moveFocus = useRef(false);

  useEffect(() => {
    if (moveFocus.current) stepHeading.current?.focus();
  }, [step]);

  if (!currentUser) return null;
  const student = currentUser;
  const closed = Date.now() >= Date.parse(period.proposalDeadline);
  const extension = data.submissionType === 'Perpanjangan';
  const locked = extension && studentThesis?.submissionType === 'Perpanjangan';
  const fields = [...new Set([...FIELDS, ...topics.map((topic) => topic.field), data.field].filter(Boolean))];
  const advisorOptions = lecturers.map((lecturer) => {
    const full = advisorQuotaFull(lecturer, theses, student, period, maxQuotas);
    return <option key={lecturer.id} value={lecturer.id} disabled={full}>{lecturer.name}{full ? ' (kuota penuh)' : ''}</option>;
  });
  function update<K extends keyof ProposalUploadPayload>(key: K, value: ProposalUploadPayload[K]) {
    setData((previous) => ({ ...previous, [key]: value }));
    setError('');
  }
  function goTo(next: 1 | 2) {
    moveFocus.current = true;
    setError('');
    setStep(next);
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (Date.now() >= Date.parse(period.proposalDeadline)) {
      setError('Batas waktu pengajuan proposal telah berakhir.');
      return;
    }
    if (step === 1) {
      if (!data.title.trim() || !data.abstract.trim()) return setError('Isi judul dan abstrak proposal.');
      if (!data.tags.length) return setError('Pilih minimal satu tag topik proposal.');
      const advisorError = getAdvisorQuotaError(data.proposedAdvisor1Id, data.proposedAdvisor2Id, lecturers, theses, student, period, maxQuotas);
      if (advisorError) return setError(advisorError);
      goTo(2);
      return;
    }
    if (!file) return setError('Pilih berkas proposal dalam format .PDF.');
    if (!confirmed) return setError('Centang konfirmasi kebenaran berkas sebelum mengirim.');
    setSubmitting(true);
    setError('');
    try {
      const receipt = await uploadProposal({
        ...data, title: data.title.trim(), abstract: data.abstract.trim(),
        summary: data.summary.trim() || 'Pengajuan berkas proposal Tugas Akhir.',
      }, file);
      onSuccess(receipt);
    } catch (cause) {
      setError(cause instanceof Error && !(cause instanceof DOMException) ? cause.message :
        'Berkas gagal disimpan di perangkat ini. Periksa ruang penyimpanan lalu coba lagi.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {closed && <AlertBanner variant="warning" title="Batas waktu telah berakhir"
        description={`Pengajuan proposal ditutup pada ${formatDateTimeId(period.proposalDeadline)}.`} />}
      {preselectedTopic && <AlertBanner variant="info" title="Topik rekomendasi terpilih"
        description={preselectedTopic.title} action={<button type="button" className="btn-secondary"
          disabled={submitting} onClick={clearPreselectedTopic}>Bersihkan Pilihan</button>} />}
      {!closed && <form onSubmit={submit} className={`${panelClass} space-y-5`}>
        <div>
          <p className="label-md text-[#475569]">Langkah {step} dari 2</p>
          <h2 ref={stepHeading} tabIndex={-1} className="headline-md text-[#0F2A66] mt-1">
            {step === 1 ? 'Data proposal' : 'Unggah dan konfirmasi berkas'}
          </h2>
        </div>
        {step === 1 ? <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="prop-type" className={labelClass}>Jenis Pengajuan</label>
              <select id="prop-type" className="input-field" value={data.submissionType}
                disabled={!!preselectedTopic} onChange={(event) => {
                  setData(initialData(event.target.value as ProposalUploadPayload['submissionType'], studentThesis));
                  setConfirmed(false); setFile(null); setError('');
                }}>
                <option>Judul Baru</option><option>Perpanjangan</option>
              </select>
            </div>
            <div>
              <label htmlFor="prop-field" className={labelClass}>Bidang Minat</label>
              <select id="prop-field" className="input-field" required value={data.field}
                disabled={!!preselectedTopic} onChange={(event) => update('field', event.target.value)}>
                <option value="">Pilih bidang minat</option>
                {fields.map((field) => <option key={field}>{field}</option>)}
              </select>
            </div>
          </div>
          {extension && <AlertBanner variant="warning" title="Peringatan Pengajuan Perpanjangan"
            description={locked ? 'Judul dan dosen pembimbing terkunci sejak perpanjangan dikirim.' :
              'Periksa judul dan dosen pembimbing. Keduanya akan dikunci setelah perpanjangan dikirim.'} />}
          <div>
            <label htmlFor="prop-title" className={labelClass}>Judul Tugas Akhir</label>
            <input id="prop-title" className="input-field" value={data.title} required
              readOnly={locked || !!preselectedTopic} onChange={(event) => update('title', event.target.value)} />
          </div>
          <div>
            <label htmlFor="prop-abstract" className={labelClass}>Abstrak Singkat</label>
            <textarea id="prop-abstract" className="textarea-field" rows={3} required value={data.abstract}
              onChange={(event) => update('abstract', event.target.value)} />
          </div>
          <fieldset>
            <legend className={labelClass}>Tag topik proposal (pilih minimal satu)</legend>
            <div className="flex flex-wrap gap-2">
              {[...new Set([...AVAILABLE_TAGS, ...data.tags])].map((tag) => {
                const selected = data.tags.includes(tag);
                return <button type="button" key={tag} aria-pressed={selected} onClick={() =>
                  update('tags', selected ? data.tags.filter((item) => item !== tag) : [...data.tags, tag])}
                  className={`rounded-full border px-3 py-1.5 label-md cursor-pointer ${selected ?
                    'bg-[#0F2A66] text-white border-[#0F2A66]' : 'border-[#CBD5E1] text-[#475569] hover:bg-[#F1F5F9]'}`}>
                  {tag}
                </button>;
              })}
            </div>
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="prop-adv1" className={labelClass}>Dosen Pembimbing</label>
              <select id="prop-adv1" required className="input-field" value={data.proposedAdvisor1Id}
                disabled={locked || !!preselectedTopic} onChange={(event) => update('proposedAdvisor1Id', event.target.value)}>
                <option value="">Pilih dosen pembimbing</option>{advisorOptions}
              </select>
            </div>
            <div>
              <label htmlFor="prop-adv2" className={labelClass}>Co-Pembimbing (opsional)</label>
              <select id="prop-adv2" className="input-field" value={data.proposedAdvisor2Id} disabled={locked}
                onChange={(event) => update('proposedAdvisor2Id', event.target.value)}>
                <option value="">Tanpa co-pembimbing</option>{advisorOptions}
              </select>
            </div>
          </div>
        </> : <>
          <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-4 space-y-1 break-words">
            <p className="body-semibold text-[#0B1C30]">{data.title}</p>
            <p className="body-base text-[#475569]">{student.name} · {student.identifier} · {data.submissionType}</p>
            <p className="body-base text-[#475569]">Pembimbing: {[data.proposedAdvisor1Id, data.proposedAdvisor2Id].map((id) =>
              lecturers.find((lecturer) => lecturer.id === id)?.name).filter(Boolean).join(' dan ')}</p>
          </div>
          <div>
            <p className={labelClass}>Formulir dan naskah proposal</p>
            <FileDropzone file={file} onFileSelect={(value) => { setFile(value); setConfirmed(false); setError(''); }} />
          </div>
          <div>
            <label htmlFor="prop-summary" className={labelClass}>Keterangan pengajuan (opsional)</label>
            <input id="prop-summary" className="input-field" value={data.summary}
              onChange={(event) => update('summary', event.target.value)} />
          </div>
          <label className="flex items-start gap-2.5 body-base text-[#0B1C30]">
            <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-[#0F2A66]" checked={confirmed}
              onChange={(event) => { setConfirmed(event.target.checked); setError(''); }} />
            Berkas yang saya unggah sudah benar dan telah disetujui dosen pembimbing.
          </label>
        </>}
        {error && <p role="alert" className="body-base text-[#B91C1C]">{error}</p>}
        <div className="flex flex-wrap justify-end gap-3 border-t border-[#E2E8F0] pt-4">
          {step === 2 && <button type="button" className="btn-secondary" disabled={submitting}
            onClick={() => goTo(1)}>Kembali ke data</button>}
          <button type="submit" className="btn-primary" disabled={submitting}>
            {step === 1 ? 'Lanjut ke unggah berkas' : submitting ? 'Menyimpan…' : 'Kirim proposal'}
          </button>
        </div>
      </form>}
    </div>
  );
}

export const UploadProposalPage: React.FC = () => {
  const { currentUser, period, templates, preselectedTopic, navigateWithContext, showToast } = usePortal();
  const [receipt, setReceipt] = useState<UploadReceipt | null>(null);
  const template = templates.find((item) => item.id === proposalForm.id);
  async function downloadTemplate() {
    if (!template) return;
    try {
      await downloadPdfPayload(getTemplateDocument(template).payload);
    } catch {
      showToast('Formulir proposal gagal diunduh. Coba kembali.', 'error');
    }
  }
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="headline-lg text-[#0B1C30]">Upload Proposal</h1>
          <p className="body-base text-[#475569] mt-1">{period.semesterLabel} · Batas akhir {formatDateTimeId(period.proposalDeadline)}</p>
        </div>
        {template && <button type="button" className="btn-secondary self-start sm:self-auto" onClick={downloadTemplate}>
          <Download aria-hidden="true" className="h-4 w-4" />Download Formulir Proposal TA
        </button>}
      </div>
      {receipt ? <section className={`${panelClass} space-y-4`}>
        <h2 className="headline-md text-[#0F2A66]" tabIndex={-1} ref={(node) => node?.focus()}>Proposal berhasil diunggah</h2>
        <p className="body-base text-[#475569]">Bukti pengajuan tersimpan di notifikasi portal pada perangkat ini.</p>
        <dl className="grid gap-2 body-base text-[#0B1C30] sm:grid-cols-[9rem_1fr] break-words">
          <dt>Mahasiswa</dt><dd>{currentUser?.name} · {currentUser?.identifier}</dd>
          <dt>Judul</dt><dd className="body-semibold">{receipt.title}</dd>
          <dt>Pembimbing</dt><dd>{[receipt.advisor1Name, receipt.advisor2Name].filter(Boolean).join(' dan ')}</dd>
          <dt>Periode</dt><dd>{receipt.semester}</dd>
          <dt>Waktu unggah</dt><dd>{formatDateTimeId(receipt.uploadedAt)}</dd>
          <dt>Berkas</dt><dd>{receipt.fileName} ({formatFileSize(receipt.fileSize)})</dd>
        </dl>
        <button type="button" className="btn-primary" onClick={() => navigateWithContext('download-proposal')}>Lihat riwayat berkas</button>
      </section> : <ProposalForm key={preselectedTopic?.id ?? 'manual'} onSuccess={setReceipt} />}
    </div>
  );
};
