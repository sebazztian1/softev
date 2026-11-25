import React, { useState } from 'react';
import { QrCode } from 'lucide-react';
import { AlertBanner } from '../../components/ui/AlertBanner';
import { EmptyState } from '../../components/ui/EmptyState';
import { FileDropzone } from '../../components/ui/FileDropzone';
import { QrCodeSvg } from '../../components/ui/QrCodeSvg';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { usePortal } from '../../context/PortalContext';
import { formatCountdown, formatDateTimeId } from '../../utils/format';

export const UploadRevisiPage: React.FC = () => {
  const { studentThesis, period, uploadRevision, setActiveTab, showToast } = usePortal();
  const [summary, setSummary] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!studentThesis) {
    return (
      <div className="space-y-6">
        <h1 className="headline-lg text-[#0B1C30]">Upload Revisi</h1>
        <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1">
          <EmptyState
            message="Belum ada berkas proposal yang diajukan untuk direvisi."
            action={
              <button
                type="button"
                onClick={() => setActiveTab('upload-proposal')}
                className="btn-primary"
              >
                Unggah Proposal
              </button>
            }
          />
        </div>
      </div>
    );
  }

  const deadlineIso = studentThesis.revisionDeadline ?? period.revisionDeadline;
  const countdown = formatCountdown(deadlineIso);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) {
      showToast('Isi ringkasan perubahan revisi terlebih dahulu.', 'error');
      return;
    }
    if (!file) {
      showToast('Pilih berkas revisi dalam format .PDF terlebih dahulu.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await uploadRevision(studentThesis.id, summary.trim(), file);
      setSummary('');
      setFile(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="headline-lg text-[#0B1C30]">Upload Revisi</h1>
          <p className="body-base text-[#475569] mt-1">
            {studentThesis.studentName} ({studentThesis.studentNim}) — Tahap: {studentThesis.stage}
          </p>
        </div>
        <StatusBadge status={studentThesis.status} />
      </div>

      {studentThesis.status === 'Perlu Revisi' && (
        <AlertBanner
          variant="warning"
          title={`Batas Akhir Unggah Revisi Sidang Proposal: ${countdown.label}`}
          description={`Tenggat waktu: ${formatDateTimeId(deadlineIso)}.`}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {/* Catatan Revisi dari Dosen */}
          <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 p-6 sm:p-8">
            <h2 className="headline-md text-[#0F2A66] pb-4 border-b border-[#E2E8F0]">
              Catatan Revisi Penilai
            </h2>
            {studentThesis.evaluations.length === 0 ? (
              <p className="body-base text-[#475569] pt-4">
                Belum terdapat catatan revisi dari dosen pembimbing atau penguji.
              </p>
            ) : (
              <div className="divide-y divide-[#E2E8F0] mt-2">
                {studentThesis.evaluations.map((ev) => (
                  <div key={ev.id} className="py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="body-semibold text-[#0B1C30]">
                          {ev.evaluatorRole} — {ev.evaluatorName}
                        </p>
                        <p className="code-meta text-[#475569]">
                          {ev.stage} — {formatDateTimeId(ev.evaluatedAt)}
                        </p>
                      </div>
                      <StatusBadge status={ev.status} />
                    </div>
                    <p className="body-base text-[#0B1C30] mt-2">{ev.notes}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Form Unggah Revisi */}
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 p-6 sm:p-8 space-y-5"
          >
            <h2 className="headline-md text-[#0F2A66] pb-4 border-b border-[#E2E8F0]">
              Unggah Berkas Perbaikan (.PDF)
            </h2>

            <div>
              <label htmlFor="rev-summary" className="block label-md text-[#0B1C30] mb-1.5">
                Ringkasan Perubahan Revisi
              </label>
              <textarea
                id="rev-summary"
                rows={4}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Cantumkan poin perbaikan dan halaman yang telah diperbarui sesuai catatan penguji."
                className="textarea-field"
                required
              />
            </div>

            <div>
              <span className="block label-md text-[#0B1C30] mb-1.5">Berkas Revisi (.PDF)</span>
              <FileDropzone
                file={file}
                onFileSelect={setFile}
                headline="Tarik & lepaskan file revisi di sini, atau klik untuk memilih file"
                helperText="Format yang didukung: .PDF (Maksimal 20 MB)"
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-[#E2E8F0]">
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Mengunggah Revisi...' : 'Unggah Revisi'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Utility Column */}
        <aside className="lg:col-span-4 space-y-6">
          {studentThesis.revisionQrToken && (
            <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 p-6">
              <div className="flex items-center gap-2 pb-4 border-b border-[#E2E8F0]">
                <QrCode className="w-5 h-5 text-[#0F2A66] stroke-[1.5]" />
                <h2 className="headline-sm text-[#0B1C30]">Kode QR Verifikasi Revisi</h2>
              </div>
              <div className="mt-4 flex flex-col items-center text-center">
                <QrCodeSvg value={studentThesis.revisionQrToken} size={148} />
                <p className="code-meta text-[#0F2A66] font-semibold mt-3">
                  {studentThesis.revisionQrToken}
                </p>
                <p className="code-meta text-[#475569] mt-1">
                  Tunjukkan kode QR ini kepada Dosen Pembimbing atau Penguji untuk persetujuan
                  revisi secara langsung.
                </p>
              </div>
            </section>
          )}

          <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 p-6">
            <h2 className="headline-sm text-[#0B1C30] pb-4 border-b border-[#E2E8F0]">
              Status Verifikasi Revisi
            </h2>
            {studentThesis.evaluations.length === 0 ? (
              <p className="body-base text-[#475569] py-4">Belum ada data verifikasi.</p>
            ) : (
              <div className="divide-y divide-[#E2E8F0]">
                {studentThesis.evaluations.map((ev) => (
                  <div key={ev.id} className="py-3.5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="body-semibold text-[#0B1C30]">{ev.evaluatorRole}</p>
                      <p className="code-meta text-[#475569] truncate">{ev.evaluatorName}</p>
                    </div>
                    <StatusBadge status={ev.status} />
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
};
