import React from 'react';
import { FileText } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  message: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FileText,
  message,
  action,
}) => (
  <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
    <Icon className="w-7 h-7 text-[#94A3B8] stroke-[1.5]" />
    <p className="body-base text-[#475569] mt-3 max-w-md">{message}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);
