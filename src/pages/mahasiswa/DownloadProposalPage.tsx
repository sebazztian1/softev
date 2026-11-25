import React, { useState } from 'react';
import { Download, Eye } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { usePortal } from '../../context/PortalContext';
import type { PreviewFilePayload, SubmissionFile, ThesisRecord } from '../../types/portal';
import { downloadPdfPayload, formatDateId, formatFileSize, submissionPdf } from '../../utils/format';
import { generateAcademicPdfBlob } from '../../utils/pdfGenerator';
import { getTemplateDocument } from '../../utils/templateDocuments';

interface DocumentRow {
  title: string;
  description: string;
  detail: string;
  size: number;
  payload: PreviewFilePayload;
}

function submissionDocument(thesis: ThesisRecord, submission: SubmissionFile): DocumentRow {
  const payload = submissionPdf(thesis, submission);
  return {
    title: submission.fileName,
    detail: [submission.versionLabel, formatDateId(submission.uploadedAt)].join(' · '),
    description: submission.summary,
    size: submission.hasRealBlob ? submission.fileSize : generateAcademicPdfBlob(payload).size,
    payload,
  };
}

function DocumentTable({ documents }: { documents: DocumentRow[] }) {
  const { openFilePreview, showToast } = usePortal();
  const download = async (payload: PreviewFilePayload) => {
    try {
      await downloadPdfPayload(payload, true);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Berkas gagal diunduh.', 'error');
    }
  };

  return (
    <table className="block w-full text-left sm:table">
      <thead className="sr-only bg-[#F1F5F9] sm:not-sr-only sm:table-header-group">
        <tr className="label-md text-[#475569]">
          <th scope="col" className="px-5 py-2.5">Berkas</th>
          <th scope="col" className="px-4 py-2.5 text-right">Ukuran</th>
          <th scope="col" className="px-5 py-2.5 text-right">Aksi</th>
        </tr>
      </thead>
      <tbody className="block divide-y divide-[#E2E8F0] sm:table-row-group">
        {documents.map(({ payload, title, detail, description, size }) => (
          <tr key={payload.id} className="block p-4 sm:table-row">
            <td className="block sm:table-cell sm:px-5 sm:py-3.5">
              <p className="body-semibold text-[#0B1C30] [overflow-wrap:anywhere]">{title}</p>
              <p className="code-meta mt-1 text-[#475569]">{detail}</p>
              {description && <p className="body-base mt-1 text-[#475569]">{description}</p>}
            </td>
            <td className="block mt-1 code-meta text-[#475569] sm:table-cell sm:px-4 sm:text-right whitespace-nowrap"
              title={`${size.toLocaleString('id-ID')} byte`}>
              {formatFileSize(size)}
            </td>
            <td className="block mt-3 sm:table-cell sm:px-5 sm:text-right">
              <div className="inline-flex gap-2">
                <button type="button" onClick={() => openFilePreview(payload)} className="btn-secondary">
                  <Eye className="size-4" />Pratinjau
                </button>
                <button type="button" onClick={() => void download(payload)} className="btn-secondary">
                  <Download className="size-4" />Unduh
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export const DownloadProposalPage: React.FC = () => {
  const { currentUser, studentThesis, theses, focusedThesisId, templates, setActiveTab } = usePortal();
  const [selectedId, setSelectedId] = useState(focusedThesisId ?? '');
  const ownTheses = theses.filter((item) => item.studentId === currentUser?.id);
  const selected = ownTheses.find((item) => item.id === selectedId) ?? studentThesis;
  const submissions = selected?.submissions.map((submission) => submissionDocument(selected, submission)) ?? [];
  const documents = templates.map((template) => {
    const document = getTemplateDocument(template);
    return {
      ...document,
      detail: [document.category, document.version, document.payload.assetUrl ? 'Formulir BAA' : 'Ringkasan portal'].join(' · '),
    };
  });

  return (
    <div className="space-y-6">
      <h1 className="headline-lg text-[#0B1C30]">Download Proposal</h1>
      <section className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-level-1">
        <div className="border-b border-[#E2E8F0] px-5 py-4">
          <h2 className="headline-md text-[#0F2A66]">Berkas Tugas Akhir Anda</h2>
          {ownTheses.length > 1 && (
            <div className="mt-3">
              <label htmlFor="download-thesis" className="block label-md mb-1 text-[#475569]">Riwayat pengajuan</label>
              <select id="download-thesis" className="input-field max-w-full" value={selected?.id ?? ''}
                onChange={(event) => setSelectedId(event.target.value)}>
                {ownTheses.map((item) => (
                  <option key={item.id} value={item.id}>{item.semester} · {item.title}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        {submissions.length ? <DocumentTable documents={submissions} /> : (
          <EmptyState
            message="Belum ada berkas proposal atau revisi untuk pengajuan ini."
            action={<button type="button" className="btn-primary" onClick={() => setActiveTab('upload-proposal')}>Unggah Proposal</button>}
          />
        )}
      </section>
      <section className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-level-1">
        <div className="border-b border-[#E2E8F0] px-5 py-4">
          <h2 className="headline-md text-[#0F2A66]">Formulir dan pedoman</h2>
        </div>
        <DocumentTable documents={documents} />
      </section>
    </div>
  );
};
