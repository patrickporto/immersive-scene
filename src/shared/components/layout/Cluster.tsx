import { cn } from '../../utils/cn';

interface ClusterProps {
  children: React.ReactNode;
  gap?: 1 | 2 | 3 | 4;
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  align?: 'start' | 'center' | 'end' | 'stretch';
  className?: string;
  wrap?: boolean;
}

export function Cluster({
  children,
  gap = 2,
  justify = 'start',
  align = 'center',
  wrap = true,
  className,
}: ClusterProps) {
  const gapClasses = {
    1: 'gap-1',
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  return (
    <div
      className={cn(
        'flex',
        wrap && 'flex-wrap',
        gapClasses[gap],
        justifyClasses[justify],
        alignClasses[align],
        className
      )}
    >
      {children}
    </div>
  );
}
