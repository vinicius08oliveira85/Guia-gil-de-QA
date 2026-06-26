import React, { useId } from 'react';

export interface JiraBrandIconProps {
  className?: string;
}

/** Ícone oficial estilizado do Jira (dois chevrons azuis). */
export const JiraBrandIcon: React.FC<JiraBrandIconProps> = ({ className = 'h-3.5 w-3.5 shrink-0' }) => {
  const gradientId = useId().replace(/:/g, '');

  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--chart-4)" />
          <stop offset="100%" stopColor="var(--color-primary-deep)" />
        </linearGradient>
      </defs>
      <path
        d="M2 13 L2 20 L9 20 L9 17 L5 17 L5 13 Z"
        fill="var(--chart-4)"
        opacity="0.2"
        transform="translate(1 1)"
      />
      <path d="M2 13 L2 20 L9 20 L9 17 L5 17 L5 13 Z" fill={`url(#${gradientId})`} />
      <path
        d="M6 9 L6 16 L13 16 L13 13 L9 13 L9 9 Z"
        fill="var(--chart-4)"
        opacity="0.2"
        transform="translate(1 1)"
      />
      <path d="M6 9 L6 16 L13 16 L13 13 L9 13 L9 9 Z" fill={`url(#${gradientId})`} />
      <path
        d="M10 5 L10 12 L17 12 L17 9 L13 9 L13 5 Z"
        fill="var(--chart-4)"
        opacity="0.2"
        transform="translate(1 1)"
      />
      <path d="M10 5 L10 12 L17 12 L17 9 L13 9 L13 5 Z" fill={`url(#${gradientId})`} />
    </svg>
  );
};

JiraBrandIcon.displayName = 'JiraBrandIcon';
