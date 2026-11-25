import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { AlertBanner } from '../../components/ui/AlertBanner';
import { FileDropzone } from '../../components/ui/FileDropzone';
import { UploadReceipt, usePortal } from '../../context/PortalContext';
import { AVAILABLE_TAGS } from '../../data/seedData';
import { downloadPdfPayload, formatDateId, formatDateTimeId, formatFileSize } from '../../utils/format';

const BIDANG_MINAT = [
  'Computer Vision & Embedded AI',
  'Natural Language Processing',
  'Rekayasa Perangkat Lunak',
  'Keamanan Jaringan & Cloud',
  'Data Engineering & Distributed Systems',
  'IoT & Jaringan Komputer',
];

export const UploadProposalPage: React.FC = () => {
  const {
    lecturers,
    period,
    templates,
    preselectedTopic,
    setPreselectedTopic,
    uploadProposal,
    showToast,
  } = usePortal();

  const [submissionType, setSubmissionType] = useState<'Judul Baru' | 'Perpanjangan'>('Judul Baru');
  const [title, setTitle] = useState('');
  const [field, setField] = useState(BIDANG_MINAT[0]);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Computer Vision', 'Deep Learning']);
  const [advisor1, setAdvisor1] = useState(lecturers[0]?.id ?? '');
  const [advisor2, setAdvisor2] = useState(lecturers[1]?.id ?? '');
  const [abstract, setAbstract] = useState('');
  const [summary, setSummary] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<UploadReceipt | null>(null);

  useEffect(() => {
    if (preselectedTopic) {
      setTitle(preselectedTopic.title);
      if (BIDANG_MINAT.includes(preselectedTopic.field)) {
        setField(preselectedTopic.field);
      }
      setAdvisor1(preselectedTopic.lecturerId);
      setAbstract(preselectedTopic.description);
    }
  }, [preselectedTopic]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !abstract.trim()) {
      showToast('Judul proposal dan abstrak wajib diisi.', 'error');
      return;
    }
    if (selectedTags.length === 0) {
      showToast('Pilih minimal satu tag topik proposal.', 'error');
      return;
    }
    if (!file) {
      showToast('Unggah berkas proposal dalam format .PDF terlebih dahulu.', 'error');
      return;
    }
    if (!confirmed) {
      showToast('Centang kotak konfirmasi kebenaran berkas sebelum melanjutkan.', 'error');
      return;
    }
    if (advisor1 && advisor2 && advisor1 === advisor2) {
      showToast('Dosen Pembimbing dan Co-Pembimbing harus berbeda.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const result = await uploadProposal(
        {
          submissionType,
          title: title.trim(),
          field,
          tags: selectedTags,
          abstract: abstract.trim(),
          proposedAdvisor1Id: advisor1,
          proposedAdvisor2Id: advisor2,
          summary: summary.trim() || 'Pengajuan berkas proposal Tugas Akhir.',
        },
        file,
      );
      setReceipt(result);
      setFile(null);
      setConfirmed(false);
    } finally {
      setSubmitting(false);
    }
  };

  const mainTemplate = templates[0];

  const handleDownloadForm = () => {
    if (!mainTemplate) return;
    void downloadPdfPayload({
      id: mainTemplate.id,
      fileName: mainTemplate.fileName,
      title: mainTemplate.title,
      subtitle: `${mainTemplate.category} — ${mainTemplate.version}`,
      lines: mainTemplate.pdfLines,
      hasRealBlob: false,
    });
    showToast(`Mengunduh ${mainTemplate.fileName}`);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="headline-lg text-[#0B1C30]">Upload Proposal</h1>
          <p className="body-base text-[#475569] mt-1">
            {period.semesterLabel} — Batas akhir pengajuan: {formatDateId(period.proposalDeadline)}
          </p>
        </div>

        {mainTemplate && (
          <button
            type="button"
            onClick={handleDownloadForm}
            className="btn-secondary shrink-0"
          >
            <Download className="w-4 h-4 stroke-[1.5]" />
            Download Formulir Proposal TA
          </button>
        )}
      </div>

      {receipt && (
        <AlertBanner
          variant="info"
          title="Proposal Berhasil Diunggah dan Notifikasi Email Telah Dikirim"
          description={`Judul: ${receipt.title} | Pembimbing: ${receipt.advisor1Name} & ${receipt.advisor2Name} | Periode: ${receipt.semester} | Waktu: ${formatDateTimeId(receipt.uploadedAt)} | File: ${receipt.fileName} (${formatFileSize(receipt.fileSize)}).`}
        />
      )}

      {preselectedTopic && (
        <AlertBanner
          variant="info"
          title={`Topik rekomendasi terpilih: ${preselectedTopic.title}`}
          description={`Pembimbing utama diisi otomatis ke ${preselectedTopic.lecturerName}.`}
          action={
            <button
              type="button"
              onClick={() => setPreselectedTopic(null)}
              className="btn-secondary"
            >
              Bersihkan Pilihan
            </button>
          }
        />
      )}

      {submissionType === 'Perpanjangan' && (
        <div className="rounded-xl border border-[#FCA5A5] bg-[#FEE2E2] px-4 py-3.5 text-[#991B1B]">
          <p className="body-semibold">Peringatan Pengajuan Perpanjangan</p>
          <p className="body-base mt-0.5">
            Jika memilih opsi Perpanjangan, data judul dan dosen pembimbing tidak dapat diubah
            kembali setelah dikirimkan.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Card (8 cols) */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-8 rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 p-6 sm:p-8 space-y-5"
        >
          <h2 className="headline-md text-[#0F2A66] pb-4 border-b border-[#E2E8F0]">
            Formulir Pengajuan Proposal Tugas Akhir
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="prop-type" className="block label-md text-[#0B1C30] mb-1.5">
                Jenis Pengajuan
              </label>
              <select
                id="prop-type"
                value={submissionType}
                onChange={(e) =>
                  setSubmissionType(e.target.value as 'Judul Baru' | 'Perpanjangan')
                }
                className="input-field"
              >
                <option value="Judul Baru">Judul Baru</option>
                <option value="Perpanjangan">Perpanjangan</option>
              </select>
            </div>

            <div>
              <label htmlFor="prop-field" className="block label-md text-[#0B1C30] mb-1.5">
                Bidang Minat
              </label>
              <select
                id="prop-field"
                value={field}
                onChange={(e) => setField(e.target.value)}
                className="input-field"
              >
                {BIDANG_MINAT.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="prop-title" className="block label-md text-[#0B1C30] mb-1.5">
              Judul Tugas Akhir
            </label>
            <input
              id="prop-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tuliskan judul lengkap proposal Tugas Akhir dalam Bahasa Indonesia"
              className="input-field"
              required
            />
          </div>

          <div>
            <span className="block label-md text-[#0B1C30] mb-2">
              Tag Topik Proposal (Digunakan Sistem Rekomendasi Reviewer)
            </span>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full px-3 py-1.5 label-md border transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#0F2A66] text-white border-[#0F2A66]'
                        : 'bg-white text-[#475569] border-[#CBD5E1] hover:bg-[#F1F5F9]'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="prop-adv1" className="block label-md text-[#0B1C30] mb-1.5">
                Dosen Pembimbing
              </label>
              <select
                id="prop-adv1"
                value={advisor1}
                onChange={(e) => setAdvisor1(e.target.value)}
                className="input-field"
              >
                {lecturers.map((lec) => (
                  <option key={lec.id} value={lec.id}>
                    {lec.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="prop-adv2" className="block label-md text-[#0B1C30] mb-1.5">
                Co-Pembimbing
              </label>
              <select
                id="prop-adv2"
                value={advisor2}
                onChange={(e) => setAdvisor2(e.target.value)}
                className="input-field"
              >
                {lecturers.map((lec) => (
                  <option key={lec.id} value={lec.id}>
                    {lec.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="prop-abstract" className="block label-md text-[#0B1C30] mb-1.5">
              Abstrak Singkat
            </label>
            <textarea
              id="prop-abstract"
              rows={4}
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              placeholder="Uraikan latar belakang permasalahan, metode yang diusulkan, serta target evaluasi."
              className="textarea-field"
              required
            />
          </div>

          <div>
            <label htmlFor="prop-summary" className="block label-md text-[#0B1C30] mb-1.5">
              Keterangan Pengajuan
            </label>
            <input
              id="prop-summary"
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Contoh: Pengajuan proposal perdana Bab 1-3"
              className="input-field"
            />
          </div>

          <div>
            <span className="block label-md text-[#0B1C30] mb-1.5">
              Berkas Formulir &amp; Isi Proposal (.PDF)
            </span>
            <FileDropzone
              file={file}
              onFileSelect={setFile}
              headline="Tarik & lepaskan file proposal di sini, atau klik untuk memilih file"
              helperText="Format yang didukung: .PDF (Maksimal 20 MB)"
            />
          </div>

          <label className="flex items-start gap-2.5 pt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 h-4 w-4 accent-[#0F2A66]"
            />
            <span className="body-base text-[#0B1C30]">
              Saya menyatakan berkas formulir dan naskah proposal yang diunggah sudah benar serta
              telah disetujui dosen pembimbing.
            </span>
          </label>

          <div className="flex justify-end pt-4 border-t border-[#E2E8F0]">
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Mengunggah Berkas...' : 'Submit dan Lanjutkan'}
            </button>
          </div>
        </form>

        {/* Guidelines Side Card (4 cols) */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 p-6">
            <h2 className="headline-sm text-[#0B1C30] pb-4 border-b border-[#E2E8F0]">
              Ketentuan Berkas Proposal
            </h2>
            <ul className="divide-y divide-[#E2E8F0] mt-1">
              <li className="py-3 body-base text-[#0B1C30]">
                Format penamaan file yang disarankan:
                <span className="block code-meta text-[#475569] mt-1">
                  NRP_NamaLengkap_Proposal_TA.pdf
                </span>
              </li>
              <li className="py-3 body-base text-[#0B1C30]">
                Ukuran berkas maksimal 20 MB dan tidak terkunci kata sandi.
              </li>
              <li className="py-3 body-base text-[#0B1C30]">
                Setelah diunggah, sistem otomatis merekomendasikan tim reviewer berdasarkan tag
                proposal kepada Kaprodi.
              </li>
            </ul>

            {mainTemplate && (
              <div className="pt-4 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={handleDownloadForm}
                  className="btn-secondary w-full"
                >
                  <Download className="w-4 h-4 stroke-[1.5]" />
                  Download Formulir Proposal TA
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
