import React from 'react';
import { EmptyState } from '../../components/ui/EmptyState';

export const DekanPanel: React.FC<{
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, action, children, className = '' }) => (
  <section className={`overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-level-1 ${className}`}>
    <div className="flex items-center justify-between gap-3 border-b border-[#E2E8F0] px-5 py-4">
      <h2 className="headline-sm text-[#0B1C30]">{title}</h2>
      {action}
    </div>
    {children}
  </section>
);

export const DekanEmpty: React.FC<{ message: string }> = ({ message }) => (
  <EmptyState message={message} />
);

export const DekanError: React.FC<{ message: string; onRetry?: () => void }> = ({
  message,
  onRetry,
}) => (
  <div role="alert" className="m-5 rounded-lg border border-[#FCA5A5] bg-[#FEE2E2] p-4 text-[#B91C1C]">
    <p className="body-medium">{message}</p>
    {onRetry && <button type="button" className="btn-secondary mt-3" onClick={onRetry}>Coba Lagi</button>}
  </div>
);

export const DekanPill: React.FC<{ children: React.ReactNode; tone?: string }> = ({
  children,
  tone,
}) => (
  <span className={`inline-flex items-center rounded-full border px-3 py-1 label-md ${tone ?? 'border-[#E2E8F0] bg-[#F1F5F9] text-[#475569]'}`}>
    {children}
  </span>
);
