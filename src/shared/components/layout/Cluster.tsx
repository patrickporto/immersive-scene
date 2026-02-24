import type { ReactNode } from 'react';

type Justify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
type Align = 'start' | 'center' | 'end' | 'stretch' | 'baseline';

interface ClusterProps {
  children: ReactNode;
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8;
  justify?: Justify;
  align?: Align;
  className?: string;
  wrap?: boolean;
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
};

const justifyClasses: Record<Justify, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

const alignClasses: Record<Align, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
};

export function Cluster({
  children,
  gap = 2,
  justify = 'start',
  align = 'center',
  wrap = true,
  className = '',
}: ClusterProps) {
  const gapClass = gapClasses[gap] || 'gap-2';
  const justifyClass = justifyClasses[justify];
  const alignClass = alignClasses[align];
  const wrapClass = wrap ? 'flex-wrap' : '';

  return (
    <div className={`flex ${wrapClass} ${gapClass} ${justifyClass} ${alignClass} ${className}`}>
      {children}
    </div>
  );
}
