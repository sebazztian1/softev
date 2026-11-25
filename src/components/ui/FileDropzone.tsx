import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, Trash2 } from 'lucide-react';
import { formatFileSize } from '../../utils/format';

interface FileDropzoneProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  headline?: string;
  helperText?: string;
  maxSizeMb?: number;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  file,
  onFileSelect,
  headline = 'Tarik & lepaskan file proposal di sini, atau klik untuk memilih file',
  helperText = 'Format yang didukung: .PDF (Maksimal 20 MB)',
  maxSizeMb = 20,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);

  const validateAndSelect = (selected: File | undefined) => {
    if (!selected) return;
    setError(null);

    const isPdf =
      selected.type === 'application/pdf' || selected.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setError('Hanya berkas berformat .PDF yang diperbolehkan.');
      return;
    }

    const maxBytes = maxSizeMb * 1024 * 1024;
    if (selected.size > maxBytes) {
      setError(`Ukuran berkas melebihi batas maksimal ${maxSizeMb} MB.`);
      return;
    }

    setProgress(35);
    window.setTimeout(() => setProgress(75), 120);
    window.setTimeout(() => setProgress(100), 240);
    onFileSelect(selected);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    validateAndSelect(e.dataTransfer.files?.[0]);
  };

  const handleRemove = () => {
    setError(null);
    setProgress(0);
    onFileSelect(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      {!file ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`rounded-xl border-2 border-dashed py-12 px-6 text-center transition-colors cursor-pointer ${
            isDragging
              ? 'border-[#0284C7] bg-[#F0F9FF]'
              : 'border-[#CBD5E1] bg-[#F8FAFC] hover:border-[#0284C7]'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => validateAndSelect(e.target.files?.[0])}
          />
          <div className="flex flex-col items-center">
            <UploadCloud className="w-8 h-8 text-[#0F2A66] stroke-[1.5]" />
            <p className="body-semibold text-[#0B1C30] mt-3">{headline}</p>
            <p className="code-meta text-[#475569] mt-1">{helperText}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#0F2A66] shrink-0">
                <FileText className="w-5 h-5 stroke-[1.5]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-[#EFF6FF] border border-[#BFDBFE] px-2 py-0.5 label-sm text-[#1D4ED8]">
                    PDF
                  </span>
                  <p className="body-semibold text-[#0B1C30] truncate">{file.name}</p>
                </div>
                <p className="code-meta text-[#475569] mt-0.5">
                  {formatFileSize(file.size)} — {progress < 100 ? 'Memverifikasi berkas...' : 'Siap diunggah'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#FCA5A5] bg-white px-3 py-1.5 label-md text-[#B91C1C] hover:bg-[#FEE2E2] shrink-0 cursor-pointer"
            >
              <Trash2 className="w-4 h-4 stroke-[1.5]" />
              Hapus File
            </button>
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-[#E2E8F0] overflow-hidden">
            <div
              className="h-full bg-[#0284C7] transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <p className="body-base text-[#B91C1C] mt-2" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
