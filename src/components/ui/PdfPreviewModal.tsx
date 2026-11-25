import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import type { PreviewFilePayload } from '../../types/portal';
import { resolvePdfPayload } from '../../utils/format';
import { Modal } from './Modal';

export const PdfPreviewModal: React.FC = () => {
  const { previewFile, closeFilePreview, currentUser } = usePortal();
  const [resolved, setResolved] = useState<{
    file: PreviewFilePayload;
    url?: string;
    error?: string;
  } | null>(null);
  const result = resolved?.file === previewFile ? resolved : null;
  const objectUrl = result?.url;
  const requireOriginal = currentUser?.role === 'mahasiswa';

  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;

    setResolved(null);
    if (!previewFile) return;
    resolvePdfPayload(previewFile, requireOriginal).then((blob) => {
      if (!active) return;
      createdUrl = URL.createObjectURL(blob);
      setResolved({ file: previewFile, url: createdUrl });
    }).catch((error: unknown) => {
      if (active) {
        setResolved({ file: previewFile, error: error instanceof Error ? error.message : 'Dokumen gagal dimuat.' });
      }
    });

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [previewFile, requireOriginal]);

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

          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] overflow-hidden h-[min(58vh,520px)]">
            {!objectUrl ? (
              <div className="flex items-center justify-center h-full body-base text-[#475569] p-4" role="status">
                {result?.error ?? 'Memuat dokumen PDF…'}
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
