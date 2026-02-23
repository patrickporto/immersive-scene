import type { ElementType, ReactNode } from 'react';

import { cn } from '../../utils/cn';

interface StackProps {
  children: ReactNode;
  gap?: 0 | 1 | 2 | 3 | 4 | 6 | 8;
  className?: string;
  as?: ElementType;
}

export function Stack({ children, gap = 4, className, as: Component = 'div' }: StackProps) {
  const gapClasses = {
    0: 'gap-0',
    1: 'gap-1',
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8',
  };

  return (
    <Component className={cn('flex flex-col', gapClasses[gap], className)}>{children}</Component>
  );
}
