import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { AcademicStatus } from '../../types/portal';

type BadgeVariant = AcademicStatus | 'Tersedia' | 'Penuh' | 'Terjadwal';

interface StatusBadgeProps {
  status: BadgeVariant;
}

const STYLE_MAP: Record<
  BadgeVariant,
  { container: string; icon: React.ComponentType<{ className?: string }> }
> = {
  Diterima: {
    container: 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]',
    icon: CheckCircle2,
  },
  Tersedia: {
    container: 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]',
    icon: CheckCircle2,
  },
  'Perlu Revisi': {
    container: 'bg-[#FFEDD5] text-[#C2410C] border-[#FDBA74]',
    icon: AlertTriangle,
  },
  Ditolak: {
    container: 'bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5]',
    icon: XCircle,
  },
  Penuh: {
    container: 'bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5]',
    icon: XCircle,
  },
  'Menunggu Verifikasi': {
    container: 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]',
    icon: Clock,
  },
  Terjadwal: {
    container: 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]',
    icon: Clock,
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = STYLE_MAP[status];
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 label-md whitespace-nowrap ${config.container}`}
    >
      <Icon className="w-3.5 h-3.5 stroke-[1.75]" />
      {status}
    </span>
  );
};
