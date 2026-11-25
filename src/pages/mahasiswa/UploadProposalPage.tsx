import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { AlertBanner } from '../../components/ui/AlertBanner';
import { FileDropzone } from '../../components/ui/FileDropzone';
import { usePortal } from '../../context/PortalContext';
import { formatDateId } from '../../utils/format';

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
    openFilePreview,
    showToast,
  } = usePortal();

  const [title, setTitle] = useState('');
  const [field, setField] = useState(BIDANG_MINAT[0]);
  const [advisor1, setAdvisor1] = useState(lecturers[0]?.id ?? '');
  const [advisor2, setAdvisor2] = useState(lecturers[1]?.id ?? '');
  const [abstract, setAbstract] = useState('');
  const [summary, setSummary] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !abstract.trim()) {
      showToast('Judul proposal dan abstrak wajib diisi.', 'error');
      return;
    }
    if (!file) {
      showToast('Unggah berkas proposal dalam format .PDF terlebih dahulu.', 'error');
      return;
    }
    if (advisor1 && advisor2 && advisor1 === advisor2) {
      showToast('Dosen Pembimbing 1 dan Pembimbing 2 harus berbeda.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await uploadProposal(
        {
          title: title.trim(),
          field,
          abstract: abstract.trim(),
          proposedAdvisor1Id: advisor1,
          proposedAdvisor2Id: advisor2,
          summary: summary.trim() || 'Pengajuan berkas proposal Tugas Akhir.',
        },
        file,
      );
      setFile(null);
    } finally {
      setSubmitting(false);
    }
  };

  const mainTemplate = templates[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="headline-lg text-[#0B1C30]">Upload Proposal</h1>
        <p className="body-base text-[#475569] mt-1">
          {period.semesterLabel} — Batas akhir pengajuan: {formatDateId(period.proposalDeadline)}
        </p>
      </div>

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

      <AlertBanner
        variant="info"
        title="Ketentuan Format Berkas Proposal"
        description="Unggah satu berkas PDF utuh mencakup halaman pengesahan, abstrak, Bab 1 sampai Bab 3, dan daftar pustaka dengan ukuran maksimal 20 MB."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Card (8 cols) */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-8 rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 p-6 sm:p-8 space-y-5"
        >
          <h2 className="headline-md text-[#0F2A66] pb-4 border-b border-[#E2E8F0]">
            Formulir Pengajuan Proposal Tugas Akhir
          </h2>

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="prop-adv1" className="block label-md text-[#0B1C30] mb-1.5">
                Usulan Dosen Pembimbing 1
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
                Usulan Dosen Pembimbing 2
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
            <span className="block label-md text-[#0B1C30] mb-1.5">Berkas Proposal (.PDF)</span>
            <FileDropzone
              file={file}
              onFileSelect={setFile}
              headline="Tarik & lepaskan file proposal di sini, atau klik untuk memilih file"
              helperText="Format yang didukung: .PDF (Maksimal 20 MB)"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-[#E2E8F0]">
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Mengunggah Berkas...' : 'Unggah Proposal'}
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
                  NIM_NamaLengkap_Proposal_TA.pdf
                </span>
              </li>
              <li className="py-3 body-base text-[#0B1C30]">
                Ukuran berkas maksimal 20 MB dan tidak terkunci kata sandi.
              </li>
              <li className="py-3 body-base text-[#0B1C30]">
                Penetapan akhir Dosen Pembimbing disahkan oleh Ketua Program Studi.
              </li>
            </ul>

            {mainTemplate && (
              <div className="pt-4 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() =>
                    openFilePreview({
                      id: mainTemplate.id,
                      fileName: mainTemplate.fileName,
                      title: mainTemplate.title,
                      subtitle: `${mainTemplate.category} — ${mainTemplate.version}`,
                      lines: mainTemplate.pdfLines,
                      hasRealBlob: false,
                    })
                  }
                  className="btn-secondary w-full"
                >
                  <Download className="w-4 h-4 stroke-[1.5]" />
                  Unduh Template Proposal
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
