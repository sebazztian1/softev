import React from 'react';
import { Download, Eye, FileText } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { usePortal } from '../../context/PortalContext';
import { getFileBlob } from '../../utils/fileStorage';
import { formatDateId, formatFileSize } from '../../utils/format';
import { generateAcademicPdfBlob } from '../../utils/pdfGenerator';

export const DownloadProposalPage: React.FC = () => {
  const { studentThesis, templates, openFilePreview, setActiveTab } = usePortal();

  const handleDirectDownload = async (params: {
    id: string;
    fileName: string;
    title: string;
    subtitle: string;
    lines: string[];
    hasRealBlob: boolean;
  }) => {
    let blob: Blob | null = null;
    if (params.hasRealBlob) {
      try {
        blob = await getFileBlob(params.id);
      } catch {
        blob = null;
      }
    }
    if (!blob) {
      blob = generateAcademicPdfBlob({
        title: params.title,
        subtitle: params.subtitle,
        lines: params.lines,
      });
    }
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = params.fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="headline-lg text-[#0B1C30]">Download Proposal</h1>
        <p className="body-base text-[#475569] mt-1">
          Arsip berkas pengajuan pribadi serta pedoman resmi Program Studi
        </p>
      </div>

      {/* Section 1: Berkas Tugas Akhir Mahasiswa */}
      <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 overflow-hidden">
        <div className="px-6 py-5 border-b border-[#E2E8F0]">
          <h2 className="headline-md text-[#0F2A66]">Berkas Tugas Akhir Anda</h2>
        </div>

        {!studentThesis || studentThesis.submissions.length === 0 ? (
          <EmptyState
            message="Belum ada berkas proposal atau revisi yang tersedia untuk diunduh."
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
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0]">
                  <th className="py-3 px-6 label-md uppercase text-[#475569]">Versi</th>
                  <th className="py-3 px-4 label-md uppercase text-[#475569]">Nama Berkas</th>
                  <th className="py-3 px-4 label-md uppercase text-[#475569]">Keterangan</th>
                  <th className="py-3 px-4 label-md uppercase text-[#475569] text-right">Ukuran</th>
                  <th className="py-3 px-4 label-md uppercase text-[#475569] text-right">Tanggal</th>
                  <th className="py-3 px-6 label-md uppercase text-[#475569] text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {studentThesis.submissions.map((sub, idx) => {
                  const payload = {
                    id: sub.id,
                    fileName: sub.fileName,
                    title: sub.pdfTitle ?? sub.versionLabel,
                    subtitle: `${studentThesis.studentName} (${studentThesis.studentNim})`,
                    lines: sub.pdfLines ?? [
                      `Berkas: ${sub.fileName}`,
                      `Diunggah oleh: ${sub.uploadedBy}`,
                      `Ringkasan: ${sub.summary}`,
                    ],
                    hasRealBlob: sub.hasRealBlob,
                  };
                  return (
                    <tr key={sub.id} className={idx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'}>
                      <td className="py-3.5 px-6 body-semibold text-[#0B1C30] whitespace-nowrap">
                        {sub.versionLabel}
                      </td>
                      <td className="py-3.5 px-4 body-base text-[#0B1C30]">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#475569] shrink-0 stroke-[1.5]" />
                          <span className="truncate max-w-[220px]">{sub.fileName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 body-base text-[#475569] max-w-xs">
                        {sub.summary}
                      </td>
                      <td className="py-3.5 px-4 code-meta text-[#475569] text-right whitespace-nowrap">
                        {formatFileSize(sub.fileSize)}
                      </td>
                      <td className="py-3.5 px-4 code-meta text-[#475569] text-right whitespace-nowrap">
                        {formatDateId(sub.uploadedAt)}
                      </td>
                      <td className="py-3.5 px-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openFilePreview(payload)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 label-md text-[#1E293B] hover:bg-[#F1F5F9] cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 stroke-[1.5]" />
                            Pratinjau
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDirectDownload(payload)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 label-md text-[#1E293B] hover:bg-[#F1F5F9] cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 stroke-[1.5]" />
                            Unduh
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Section 2: Pedoman & Template Resmi ISTTS */}
      <section className="rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 overflow-hidden">
        <div className="px-6 py-5 border-b border-[#E2E8F0]">
          <h2 className="headline-md text-[#0F2A66]">Pedoman &amp; Template Resmi ISTTS</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0]">
                <th className="py-3 px-6 label-md uppercase text-[#475569]">Dokumen</th>
                <th className="py-3 px-4 label-md uppercase text-[#475569]">Kategori</th>
                <th className="py-3 px-4 label-md uppercase text-[#475569]">Versi</th>
                <th className="py-3 px-4 label-md uppercase text-[#475569] text-right">Ukuran</th>
                <th className="py-3 px-6 label-md uppercase text-[#475569] text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {templates.map((tpl, idx) => {
                const payload = {
                  id: tpl.id,
                  fileName: tpl.fileName,
                  title: tpl.title,
                  subtitle: `${tpl.category} — ${tpl.version}`,
                  lines: tpl.pdfLines,
                  hasRealBlob: false,
                };
                return (
                  <tr key={tpl.id} className={idx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'}>
                    <td className="py-4 px-6">
                      <p className="body-semibold text-[#0B1C30]">{tpl.title}</p>
                      <p className="body-base text-[#475569] mt-0.5">{tpl.description}</p>
                    </td>
                    <td className="py-4 px-4 body-base text-[#0B1C30] whitespace-nowrap">
                      {tpl.category}
                    </td>
                    <td className="py-4 px-4 code-meta text-[#475569] whitespace-nowrap">
                      {tpl.version}
                    </td>
                    <td className="py-4 px-4 code-meta text-[#475569] text-right whitespace-nowrap">
                      {formatFileSize(tpl.fileSize)}
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openFilePreview(payload)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 label-md text-[#1E293B] hover:bg-[#F1F5F9] cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 stroke-[1.5]" />
                          Pratinjau
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDirectDownload(payload)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 label-md text-[#1E293B] hover:bg-[#F1F5F9] cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 stroke-[1.5]" />
                          Unduh
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
