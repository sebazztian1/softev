import React from 'react';

export const IsttsLogo: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <rect x="2" y="2" width="36" height="36" rx="8" fill="#0F2A66" />
    <path
      d="M20 8L30 13.5V22.2C30 27.9 25.7 32.1 20 33.5C14.3 32.1 10 27.9 10 22.2V13.5L20 8Z"
      stroke="#FFFFFF"
      strokeWidth="1.75"
      strokeLinejoin="round"
    />
    <path
      d="M20 12.5V28.5M14.5 17.5H25.5"
      stroke="#5BB8FE"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
  </svg>
);
