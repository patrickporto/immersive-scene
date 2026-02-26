interface TimelineRulerProps {
  timelineEditorDurationSec: number;
  timelineEditorDurationMs: number;
  displayPlaybackMs: number;
}

/**
 * @description Renders timeline time markers and playback progress bar.
 * @param props - Component properties.
 * @returns Timeline ruler.
 */
export function TimelineRuler({
  timelineEditorDurationSec,
  timelineEditorDurationMs,
  displayPlaybackMs,
}: TimelineRulerProps) {
  return (
    <div className="bg-black/40 flex flex-col border-b border-white/5 shadow-inner pt-2">
      <div className="flex w-full h-10 relative">
        <div className="w-32 shrink-0 border-r border-white/10 bg-[#14141d]/50" />

        <div className="flex-1 relative">
          <div className="absolute inset-x-0 top-0 bottom-2">
            {Array.from({ length: Math.ceil(timelineEditorDurationSec / 5) + 1 }).map(
              (_, index) => {
                const seconds = index * 5;
                const leftPercent = (seconds / timelineEditorDurationSec) * 100;
                if (seconds > timelineEditorDurationSec) {
                  return null;
                }

                return (
                  <div
                    key={seconds}
                    className="absolute top-0 flex flex-col items-center h-full"
                    style={{ left: `${leftPercent}%`, transform: 'translateX(-50%)' }}
                  >
                    <span className="text-[9px] text-gray-500 font-mono mt-1 opacity-70">
                      {seconds}s
                    </span>
                    <div className="w-px h-1.5 bg-white/20 mt-auto" />
                  </div>
                );
              }
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60 border-t border-white/5">
            <div
              className="absolute top-0 left-0 bottom-0 bg-cyan-500/50 shadow-[0_0_10px_#22d3ee] transition-none"
              style={{
                width: `${Math.min(100, (displayPlaybackMs / timelineEditorDurationMs) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
