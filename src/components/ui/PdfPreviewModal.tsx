import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import { getFileBlob } from '../../utils/fileStorage';
import { generateAcademicPdfBlob } from '../../utils/pdfGenerator';
import { Modal } from './Modal';

export const PdfPreviewModal: React.FC = () => {
  const { previewFile, closeFilePreview } = usePortal();
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;

    async function resolveBlob() {
      if (!previewFile) {
        setObjectUrl(null);
        return;
      }
      setLoading(true);
      let blob: Blob | null = null;
      if (previewFile.hasRealBlob) {
        try {
          blob = await getFileBlob(previewFile.id);
        } catch {
          blob = null;
        }
      }
      if (!blob) {
        blob = generateAcademicPdfBlob({
          title: previewFile.title,
          subtitle: previewFile.subtitle,
          lines: previewFile.lines,
        });
      }
      if (!active) return;
      createdUrl = URL.createObjectURL(blob);
      setObjectUrl(createdUrl);
      setLoading(false);
    }

    void resolveBlob();

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [previewFile]);

  const handleDownload = () => {
    if (!objectUrl || !previewFile) return;
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = previewFile.fileName;
    anchor.click();
  };

  return (
    <Modal
      open={Boolean(previewFile)}
      onClose={closeFilePreview}
      title={previewFile ? `Pratinjau Dokumen: ${previewFile.fileName}` : 'Pratinjau Dokumen'}
      maxWidthClass="max-w-4xl"
    >
      {previewFile && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
            <div>
              <p className="body-semibold text-[#0B1C30]">{previewFile.title}</p>
              <p className="code-meta text-[#475569]">{previewFile.subtitle}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDownload}
                disabled={!objectUrl}
                className="btn-secondary"
              >
                <Download className="w-4 h-4 stroke-[1.5]" />
                Unduh Berkas
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] overflow-hidden h-[520px]">
            {loading || !objectUrl ? (
              <div className="flex items-center justify-center h-full body-base text-[#475569]">
                Memuat dokumen PDF...
              </div>
            ) : (
              <iframe
                src={objectUrl}
                title={previewFile.fileName}
                className="w-full h-full border-0"
              />
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};
