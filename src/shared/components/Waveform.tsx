import { useMemo } from 'react';

import { motion } from 'framer-motion';

interface WaveformProps {
  isPlaying: boolean;
  color?: string;
  height?: number;
  barCount?: number;
}

export function Waveform({
  isPlaying,
  color = 'bg-indigo-500',
  height = 40,
  barCount = 40,
}: WaveformProps) {
  // Generate bar heights once using useMemo to avoid impure function during render
  const barHeights = useMemo(() => {
    return Array.from({ length: barCount }, (_, i) => {
      const baseHeight = Math.sin((i / barCount) * Math.PI) * 0.8 + 0.2;
      // Use deterministic pseudo-random based on index
      const pseudoRandom =
        Math.sin(i * 12.9898) * 43758.5453 - Math.floor(Math.sin(i * 12.9898) * 43758.5453);
      const variation = pseudoRandom * 0.3;
      return Math.min(1, baseHeight + variation);
    });
  }, [barCount]);

  return (
    <div className="flex items-end justify-center gap-[2px]" style={{ height }}>
      {barHeights.map((barHeight, i) => (
        <motion.div
          key={i}
          className={`w-1 rounded-sm ${color}`}
          initial={{ height: 4 }}
          animate={{
            height: isPlaying ? [4, barHeight * height, 4] : 4,
            opacity: isPlaying ? 1 : 0.3,
          }}
          transition={{
            height: {
              duration: 0.5,
              repeat: isPlaying ? Infinity : 0,
              repeatType: 'reverse',
              delay: i * 0.02,
              ease: 'easeInOut',
            },
            opacity: {
              duration: 0.3,
            },
          }}
        />
      ))}
    </div>
  );
}
