import { cn } from '../../../shared/utils/cn';

interface VUMeterProps {
  isActive: boolean;
}

/**
 * @description Displays simulated channel level bars.
 * @param props - Component properties.
 * @param props.isActive - Whether bars should show active levels.
 * @returns Vertical VU meter.
 */
export function VUMeter({ isActive }: VUMeterProps) {
  const bars = 14;

  return (
    <div className="flex flex-col-reverse gap-[2px] h-full w-full">
      {Array.from({ length: bars }).map((_, index) => {
        const isPeak = index >= bars - 2;
        const isWarning = index >= bars - 5 && index < bars - 2;

        return (
          <div
            key={index}
            className={cn(
              'w-full flex-1 rounded-[1px] transition-all duration-300',
              isActive
                ? isPeak
                  ? 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]'
                  : isWarning
                    ? 'bg-yellow-400'
                    : 'bg-cyan-500'
                : 'bg-white/5'
            )}
          />
        );
      })}
    </div>
  );
}
