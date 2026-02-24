import type { ReactNode } from 'react';

interface StackProps {
  children: ReactNode;
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;
  className?: string;
}

const gapClasses: Record<number, string> = {
  0: '',
  1: 'gap-1',
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
  5: 'gap-5',
  6: 'gap-6',
  8: 'gap-8',
  10: 'gap-10',
  12: 'gap-12',
};

export function Stack({ children, gap = 4, className = '' }: StackProps) {
  const gapClass = gapClasses[gap] || 'gap-4';
  return <div className={`flex flex-col ${gapClass} ${className}`}>{children}</div>;
}
