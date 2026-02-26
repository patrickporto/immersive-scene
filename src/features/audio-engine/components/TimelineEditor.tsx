import { useEffect, useState } from 'react';

import { Droppable } from '@hello-pangea/dnd';
import { AnimatePresence, motion } from 'framer-motion';

import { IconPlay, IconPlus, IconTrash } from '../../../shared/components/Icons';
import { Tooltip } from '../../../shared/components/Tooltip';
import { cn } from '../../../shared/utils/cn';
import { useSoundSetStore } from '../../sound-sets/stores/soundSetStore';
import { useTimelineStore } from '../../sound-sets/stores/timelineStore';
import { useAudioEngineStore } from '../stores/audioEngineStore';

interface TimelineEditorProps {
  moodId: number;
}

export function TimelineEditor({ moodId }: TimelineEditorProps) {
  const {
    timelines,
    tracks,
    elements: timelineElements,
    selectedTimelineId,
    loadTimelines,
    selectTimeline,
    createTimeline,
    createTimelineTrack,
    deleteTimelineTrack,
    updateElementTimeAndDuration,
    deleteTimelineElement,
  } = useTimelineStore();

  const { audioElements } = useSoundSetStore();
  const {
    stopAll,
    audioContext,
    isTimelinePlaying,
    isTimelinePaused,
    timelineStartTimeContext,
    activePlaybackContext,
  } = useAudioEngineStore();

  const [currentPlaybackMs, setCurrentPlaybackMs] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Dynamic timeline limits
  const maxElementEndMs =
    timelineElements.length > 0
      ? Math.max(...timelineElements.map(e => e.start_time_ms + e.duration_ms))
      : 0;
  // Assure at least 60s, +30s empty space for dragging new elements
  const timelineEditorDurationMs = Math.max(60000, maxElementEndMs + 30000);
  const timelineEditorDurationSec = Math.ceil(timelineEditorDurationMs / 1000);

  // Dynamic minimum width based on exactly 60000ms taking up 100% of viewport at 1x zoom
  const trackContainerMinWidth = `${(timelineEditorDurationMs / 60000) * 100 * zoomLevel}%`;

  // requestAnimationFrame for playback progress
  useEffect(() => {
    let animationFrameId: number;

    const updatePlayhead = () => {
      const isPlayingThisMood = activePlaybackContext
        ? activePlaybackContext.moodId === moodId
        : true;
      if (
        isTimelinePlaying &&
        !isTimelinePaused &&
        audioContext &&
        timelineStartTimeContext !== null &&
        isPlayingThisMood
      ) {
        const elapsed = (audioContext.currentTime - timelineStartTimeContext) * 1000;
        setCurrentPlaybackMs(elapsed);
        animationFrameId = requestAnimationFrame(updatePlayhead);
      }
    };

    if (isTimelinePlaying && !isTimelinePaused) {
      animationFrameId = requestAnimationFrame(updatePlayhead);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [
    isTimelinePlaying,
    isTimelinePaused,
    audioContext,
    timelineStartTimeContext,
    activePlaybackContext,
    moodId,
  ]);

  const isPlayingThisMood = activePlaybackContext ? activePlaybackContext.moodId === moodId : true;
  const showPlayhead = (isTimelinePlaying || isTimelinePaused) && isPlayingThisMood;
  const displayPlaybackMs = showPlayhead ? currentPlaybackMs : 0;

  // Track mouse X position globally during drag since Pangea doesn't provide clientX on drop
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      (window as any).__lastDragX = e.clientX;
      (window as any).__lastDragY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    loadTimelines(moodId);
  }, [moodId, loadTimelines]);

  const { isLoading: isLoadingTimelines, isExpanded } = useTimelineStore();

  useEffect(() => {
    if (isLoadingTimelines) return;

    if (timelines.length > 0) {
      if (selectedTimelineId !== timelines[0].id) {
        selectTimeline(timelines[0].id);
      }
    } else {
      createTimeline(moodId, 'Main');
    }
  }, [timelines, selectedTimelineId, selectTimeline, createTimeline, moodId, isLoadingTimelines]);

  // Native drop is no longer needed on the container wrapper
  // since this will be handled by Pangea in AudioUploader

  return (
    <div className="bg-[#0a0a0f] relative overflow-visible z-0 flex-1 flex flex-col w-full group/timeline">
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-visible w-full"
          >
            <div className="flex flex-col h-[340px] relative z-10 w-full bg-[#0a0a0f] overflow-x-auto custom-scrollbar">
              {/* Main Track Area that extends dynamically */}
              <div
                className="flex-1 bg-gradient-to-b from-[#1a1a25] to-[#0f0f15] border-transparent relative flex flex-col shadow-lg"
                style={{ minWidth: trackContainerMinWidth }}
              >
                {!selectedTimelineId ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <div className="w-16 h-16 rounded-full bg-black/50 border border-white/5 flex items-center justify-center mb-4 relative">
                      <div className="w-10 h-px bg-cyan-500/30 rotate-45 absolute" />
                      <div className="w-10 h-px bg-cyan-500/30 -rotate-45 absolute" />
                    </div>
                    <p className="text-sm font-medium text-gray-300 mb-2">Editor de Sequência</p>
                    <p className="text-xs text-gray-600 max-w-xs">
                      Selecione ou crie uma timeline lateralmente para começar a organizar camadas
                      sonoras temporalmente.
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col">
                    {/* Timeline Header area */}
                    <div className="bg-black/40 flex flex-col border-b border-white/5 shadow-inner pt-2">
                      {/* Timeline Ruler */}
                      <div className="flex w-full h-10 relative">
                        {/* 128px spacer to match Track sidebars */}
                        <div className="w-32 shrink-0 border-r border-white/10 bg-[#14141d]/50" />

                        <div className="flex-1 relative">
                          <div className="absolute inset-x-0 top-0 bottom-2">
                            {Array.from({
                              length: Math.ceil(timelineEditorDurationSec / 5) + 1,
                            }).map((_, i) => {
                              const seconds = i * 5;
                              const leftPercent = (seconds / timelineEditorDurationSec) * 100;
                              if (seconds > timelineEditorDurationSec) return null;
                              return (
                                <div
                                  key={i}
                                  className="absolute top-0 flex flex-col items-center h-full"
                                  style={{ left: `${leftPercent}%`, transform: 'translateX(-50%)' }}
                                >
                                  <span className="text-[9px] text-gray-500 font-mono mt-1 opacity-70">
                                    {seconds}s
                                  </span>
                                  <div className="w-px h-1.5 bg-white/20 mt-auto" />
                                </div>
                              );
                            })}
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

                    {/* Composition Track Background / Grid */}
                    <div className="flex-1 relative transition-colors duration-300 pb-20 overflow-y-auto overflow-x-hidden custom-scrollbar">
                      {/* Global Playhead Line */}
                      {isTimelinePlaying && currentPlaybackMs > 0 && (
                        <div
                          className="absolute top-0 bottom-0 w-px bg-cyan-400 z-50 pointer-events-none shadow-[0_0_10px_#22d3ee]"
                          style={{
                            left: `calc(128px + ${(Math.min(timelineEditorDurationMs, currentPlaybackMs) / timelineEditorDurationMs) * 100}%)`,
                          }}
                        />
                      )}
                      {tracks.map(track => (
                        <div
                          key={track.id}
                          className="flex h-24 relative border-b border-white/5 bg-[#1a1a25]/30 group/track"
                        >
                          {/* Track Header (left info) */}
                          <div className="sticky left-0 top-0 bottom-0 w-32 shrink-0 bg-[#14141d] border-r border-white/10 z-30 flex flex-col justify-center px-4 py-3 shadow-[5px_0_15px_rgba(0,0,0,0.3)]">
                            <div className="text-[10px] font-bold text-gray-400 truncate w-full uppercase tracking-wider">
                              {track.name}
                            </div>
                            <button
                              onClick={() => deleteTimelineTrack(track.id)}
                              className="text-gray-600 opacity-0 group-hover/track:opacity-100 hover:text-red-400 mt-2 text-left w-max transition-all"
                            >
                              <IconTrash className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Track Content */}
                          <Droppable
                            droppableId={`timeline-track-${track.id}`}
                            direction="horizontal"
                          >
                            {(provided, snapshot) => (
                              <div
                                id={`timeline-track-container-${track.id}`}
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={cn(
                                  'flex-1 relative h-full min-w-0 transition-colors duration-300',
                                  snapshot.isDraggingOver
                                    ? 'bg-cyan-500/5 ring-inset ring-1 ring-cyan-500/20'
                                    : ''
                                )}
                              >
                                {/* Time markers vertical lines background */}
                                <div className="absolute inset-0 flex pointer-events-none opacity-20">
                                  {Array.from({ length: timelineEditorDurationSec }).map((_, i) => (
                                    <div
                                      key={i}
                                      className={cn(
                                        'flex-1 border-r h-full min-w-0',
                                        i % 5 === 4
                                          ? 'border-white/20 bg-white/[0.02]'
                                          : 'border-white/5'
                                      )}
                                    />
                                  ))}
                                </div>

                                {/* Placed Elements Space */}
                                <div className="absolute inset-0 pt-2 pb-2 px-0 overflow-visible">
                                  <AnimatePresence>
                                    {timelineElements
                                      .filter(te => Number(te.track_id) === track.id)
                                      .map((te, _index) => {
                                        const el = audioElements.find(
                                          a => a.id === Number(te.audio_element_id)
                                        );
                                        if (!el) return null;
                                        const leftPercent =
                                          (te.start_time_ms / timelineEditorDurationMs) * 100;
                                        const widthPercent =
                                          (te.duration_ms / timelineEditorDurationMs) * 100;

                                        const isActivePlayback =
                                          isTimelinePlaying &&
                                          displayPlaybackMs >= te.start_time_ms &&
                                          displayPlaybackMs < te.start_time_ms + te.duration_ms;

                                        return (
                                          <motion.div
                                            key={te.id}
                                            id={`clip-card-${te.id}`}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{ duration: 0.0 }}
                                            drag="x"
                                            dragMomentum={false}
                                            dragElastic={0}
                                            dragSnapToOrigin={true}
                                            onDragStart={() => stopAll()}
                                            whileDrag={{
                                              scale: 1.02,
                                              opacity: 0.9,
                                              zIndex: 50,
                                              boxShadow: '0 10px 25px -5px rgba(34, 211, 238, 0.3)',
                                            }}
                                            onDragEnd={(_e, info) => {
                                              const container = document.getElementById(
                                                `timeline-track-container-${track.id}`
                                              );
                                              if (!container) return;
                                              const targetElement = document.getElementById(
                                                `clip-card-${te.id}`
                                              );
                                              if (!targetElement) return;

                                              const trackRect = container.getBoundingClientRect();
                                              const trackWidth = trackRect.width;

                                              // Calculate using initial exact position + exact drag delta
                                              const currentLeftPx =
                                                (te.start_time_ms / timelineEditorDurationMs) *
                                                trackWidth;
                                              const dropX = currentLeftPx + info.offset.x;

                                              const percentage = Math.max(
                                                0,
                                                Math.min(100, (dropX / trackWidth) * 100)
                                              );
                                              const newStartTimeMs = Math.round(
                                                (percentage / 100) * timelineEditorDurationMs
                                              );

                                              // Snap to 1000ms (1 second) and enforce bounds >= 0
                                              let snappedStartMs = Math.max(
                                                0,
                                                Math.round(newStartTimeMs / 1000) * 1000
                                              );

                                              // Client-side auto-snap on overlap
                                              const overlappingElement = timelineElements.find(
                                                other => {
                                                  if (
                                                    other.track_id !== track.id ||
                                                    other.id === te.id
                                                  )
                                                    return false;
                                                  return (
                                                    Math.max(snappedStartMs, other.start_time_ms) <
                                                    Math.min(
                                                      snappedStartMs + te.duration_ms,
                                                      other.start_time_ms + other.duration_ms
                                                    )
                                                  );
                                                }
                                              );

                                              if (overlappingElement) {
                                                const otherStart = overlappingElement.start_time_ms;
                                                const otherEnd =
                                                  otherStart + overlappingElement.duration_ms;
                                                const myCenter =
                                                  snappedStartMs + te.duration_ms / 2;
                                                const otherCenter =
                                                  otherStart + overlappingElement.duration_ms / 2;

                                                if (myCenter < otherCenter) {
                                                  // Snap to the left of the overlapping element
                                                  snappedStartMs = Math.max(
                                                    0,
                                                    otherStart - te.duration_ms
                                                  );
                                                } else {
                                                  // Snap to the right of the overlapping element
                                                  snappedStartMs = otherEnd;
                                                }

                                                // Optional: check if the new snapped position overlaps with YET another element
                                                // (e.g. squeezed between two). If it does, we just revert to its original position
                                                // to avoid sliding over everything.
                                                const doubleOverlap = timelineElements.some(
                                                  other => {
                                                    if (
                                                      other.track_id !== track.id ||
                                                      other.id === te.id
                                                    )
                                                      return false;
                                                    return (
                                                      Math.max(
                                                        snappedStartMs,
                                                        other.start_time_ms
                                                      ) <
                                                      Math.min(
                                                        snappedStartMs + te.duration_ms,
                                                        other.start_time_ms + other.duration_ms
                                                      )
                                                    );
                                                  }
                                                );

                                                if (doubleOverlap) {
                                                  // If there's no space on that edge either, cancel the drop
                                                  return;
                                                }
                                              }

                                              updateElementTimeAndDuration(
                                                te.id,
                                                snappedStartMs,
                                                te.duration_ms
                                              );
                                            }}
                                            className={cn(
                                              'clip-card absolute h-16 top-4 border rounded-lg overflow-visible shadow-lg group focus:outline-none flex items-center gap-1.5 cursor-grab active:cursor-grabbing backdrop-blur-md transition-all z-10 hover:z-50',
                                              isActivePlayback
                                                ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                                                : 'bg-gradient-to-r from-[#1a1e2d] to-[#1e293b] border-cyan-500/30 hover:border-cyan-400'
                                            )}
                                            style={{
                                              left: `${leftPercent}%`,
                                              width: `${Math.max(widthPercent, 0.5)}%`,
                                              touchAction: 'none', // Important for framer-motion drag on some devices
                                            }}
                                          >
                                            <Tooltip
                                              content={el.file_name}
                                              delay={0.2}
                                              position="top"
                                              className="flex-1 min-w-0 h-full"
                                            >
                                              <div className="flex items-center w-full h-full cursor-grab active:cursor-grabbing">
                                                <div
                                                  className={cn(
                                                    'w-5 h-5 ml-1 rounded-full flex flex-col items-center justify-center shrink-0 pointer-events-none transition-colors duration-300',
                                                    isActivePlayback
                                                      ? 'bg-cyan-400 text-gray-900 shadow-[0_0_10px_rgba(34,211,238,0.6)]'
                                                      : 'bg-cyan-500/20 text-cyan-400'
                                                  )}
                                                >
                                                  <IconPlay className="w-2.5 h-2.5 ml-0.5" />
                                                </div>
                                                <div className="flex-1 min-w-0 pointer-events-none ml-1.5 flex flex-col justify-center">
                                                  <div className="text-[10px] text-gray-200 font-bold truncate mb-0.5 drop-shadow-md">
                                                    {el.file_name.split('.')[0]}
                                                  </div>
                                                  <div className="text-[8px] text-cyan-500 font-mono tracking-wider truncate">
                                                    {(te.start_time_ms / 1000).toFixed(1)}s
                                                  </div>
                                                </div>
                                              </div>
                                            </Tooltip>
                                            <button
                                              onClick={e => {
                                                e.stopPropagation();
                                                deleteTimelineElement(te.id);
                                              }}
                                              onPointerDown={e => e.stopPropagation()}
                                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded transition-all shrink-0 cursor-pointer mr-1"
                                            >
                                              <IconTrash className="w-3.5 h-3.5" />
                                            </button>
                                          </motion.div>
                                        );
                                      })}
                                  </AnimatePresence>

                                  {provided.placeholder}
                                </div>
                              </div>
                            )}
                          </Droppable>
                        </div>
                      ))}

                      {/* Add Track Button */}
                      <div className="p-4 border-b border-white/5 bg-black/10 flex">
                        <button
                          onClick={() =>
                            createTimelineTrack(selectedTimelineId!, `Track ${tracks.length + 1}`)
                          }
                          className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors border border-dashed border-white/10 hover:border-cyan-500/30 ml-32"
                        >
                          <IconPlus className="w-3 h-3" /> Add Track
                        </button>
                      </div>

                      {tracks.length === 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 pointer-events-none">
                          <span className="text-sm tracking-wide">
                            Adicione uma Track para começar
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Zoom Controls (Bottom Right) */}
      <div className="absolute bottom-4 right-8 z-[60] flex items-center gap-3 bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full shadow-xl opacity-0 hover:opacity-100 group-hover/timeline:opacity-100 transition-opacity">
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Zoom</span>
        <input
          type="range"
          min="0.5"
          max="5"
          step="0.1"
          value={zoomLevel}
          onChange={e => setZoomLevel(parseFloat(e.target.value))}
          className="w-24 accent-cyan-500 bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-[10px] font-mono text-cyan-400 min-w-[24px]">
          {zoomLevel.toFixed(1)}x
        </span>
      </div>
    </div>
  );
}
