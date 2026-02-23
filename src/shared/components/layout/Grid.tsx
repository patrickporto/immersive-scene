import { cn } from '../../utils/cn';

interface GridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 2 | 3 | 4 | 6 | 8;
  className?: string;
  minItemWidth?: string;
}

export function Grid({ children, columns = 1, gap = 4, className, minItemWidth }: GridProps) {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };

  const gapClasses = {
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8',
  };

  return (
    <div
      className={cn('grid', columnClasses[columns], gapClasses[gap], className)}
      style={
        minItemWidth
          ? { gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}, 1fr))` }
          : undefined
      }
    >
      {children}
    </div>
  );
}
