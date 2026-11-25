import type { OfficialTemplate, PreviewFilePayload } from '../types/portal';
import { generateAcademicPdfBlob } from './pdfGenerator';

export const proposalForm: OfficialTemplate = {
  id: 'tpl-01',
  title: 'Formulir Pengajuan Proposal Tugas Akhir',
  category: 'Proposal TA',
  version: 'F-048 v6',
  fileName: 'F-048-Proposal-Tugas-Akhir-v6.pdf',
  fileSize: 88728,
  updatedAt: '2019-12-05',
  description: 'Formulir BAA ISTTS untuk pengajuan judul, pembimbing, dan persetujuan. Kolom PDF dapat diisi.',
  pdfLines: [],
};

export function getTemplateDocument(template: OfficialTemplate) {
  // Saved portal data can still contain the old generated proposal template.
  const isProposalForm = template.id === proposalForm.id;
  const document = isProposalForm ? proposalForm : template;
  const payload: PreviewFilePayload = {
    id: document.id,
    title: document.title,
    fileName: document.fileName,
    subtitle: `${document.category} — ${document.version}`,
    lines: document.pdfLines,
    hasRealBlob: false,
    assetUrl: isProposalForm
      ? new URL('../assets/F-048-Proposal-Tugas-Akhir-v6.pdf', import.meta.url).href
      : undefined,
  };
  return {
    ...document,
    payload,
    size: isProposalForm ? proposalForm.fileSize : generateAcademicPdfBlob(payload).size,
  };
}
