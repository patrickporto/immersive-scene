interface TimelineZoomControlsProps {
  zoomLevel: number;
  onZoomChange: (value: number) => void;
}

/**
 * @description Displays timeline zoom controls.
 * @param props - Component properties.
 * @returns Zoom controls.
 */
export function TimelineZoomControls({ zoomLevel, onZoomChange }: TimelineZoomControlsProps) {
  return (
    <div className="absolute bottom-4 right-8 z-[60] flex items-center gap-3 bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full shadow-xl opacity-0 hover:opacity-100 group-hover/timeline:opacity-100 transition-opacity">
      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Zoom</span>
      <input
        type="range"
        min="0.5"
        max="5"
        step="0.1"
        value={zoomLevel}
        onChange={event => onZoomChange(parseFloat(event.target.value))}
        className="w-24 accent-cyan-500 bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
      />
      <span className="text-[10px] font-mono text-cyan-400 min-w-[24px]">
        {zoomLevel.toFixed(1)}x
      </span>
    </div>
  );
}
