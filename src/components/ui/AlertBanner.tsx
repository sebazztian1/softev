import React from 'react';
import { Clock, Info } from 'lucide-react';

interface AlertBannerProps {
  variant: 'warning' | 'info';
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  variant,
  title,
  description,
  action,
}) => {
  const isWarning = variant === 'warning';
  const Icon = isWarning ? Clock : Info;

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border px-4 py-3.5 ${
        isWarning
          ? 'border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]'
          : 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1E40AF]'
      }`}
    >
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 shrink-0 mt-0.5 stroke-[1.75]" />
        <div>
          <p className="body-semibold">{title}</p>
          {description && <p className="body-base mt-0.5 opacity-90">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
