import React from 'react';
import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react';
import { usePortal } from '../../context/PortalContext';

export const Toast: React.FC = () => {
  const { toast, dismissToast } = usePortal();
  if (!toast) return null;

  const styles =
    toast.type === 'error'
      ? 'border-[#FCA5A5] bg-[#FEE2E2] text-[#B91C1C]'
      : toast.type === 'info'
        ? 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]'
        : 'border-[#86EFAC] bg-[#DCFCE7] text-[#15803D]';

  const Icon =
    toast.type === 'error'
      ? AlertCircle
      : toast.type === 'info'
        ? Info
        : CheckCircle2;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm">
      <div
        className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-level-3 ${styles}`}
        role="status"
      >
        <Icon className="w-4 h-4 shrink-0 stroke-[1.75]" />
        <p className="body-medium flex-1">{toast.message}</p>
        <button
          type="button"
          onClick={dismissToast}
          className="p-1 rounded hover:bg-black/5 cursor-pointer"
          aria-label="Tutup pemberitahuan"
        >
          <X className="w-4 h-4 stroke-[1.5]" />
        </button>
      </div>
    </div>
  );
};
