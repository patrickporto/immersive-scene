import { useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { TimelineRuler } from './TimelineRuler';
import { TimelineTrackLane } from './TimelineTrackLane';
import { TimelineZoomControls } from './TimelineZoomControls';
import { IconPlus } from '../../../shared/components/Icons';
import { useSoundSetStore } from '../../sound-sets/stores/soundSetStore';
import { useTimelineStore } from '../../sound-sets/stores/timelineStore';
import { useAudioEngineStore } from '../stores/audioEngineStore';

interface TimelineEditorProps {
  moodId: number;
}

/**
 * @description Displays the timeline editor for arranging track clips.
 * @param props - Component properties.
 * @param props.moodId - Active mood identifier.
 * @returns Timeline editor component.
 */
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

  const maxElementEndMs =
    timelineElements.length > 0
      ? Math.max(...timelineElements.map(element => element.start_time_ms + element.duration_ms))
      : 0;
  const timelineEditorDurationMs = Math.max(60000, maxElementEndMs + 30000);
  const timelineEditorDurationSec = Math.ceil(timelineEditorDurationMs / 1000);
  const trackContainerMinWidth = `${(timelineEditorDurationMs / 60000) * 100 * zoomLevel}%`;

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
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [
    isTimelinePlaying,
    isTimelinePaused,
    audioContext,
    timelineStartTimeContext,
    activePlaybackContext,
    moodId,
  ]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      (window as Window & { __lastDragX?: number; __lastDragY?: number }).__lastDragX =
        event.clientX;
      (window as Window & { __lastDragX?: number; __lastDragY?: number }).__lastDragY =
        event.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    void loadTimelines(moodId);
  }, [moodId, loadTimelines]);

  const { isLoading: isLoadingTimelines, isExpanded } = useTimelineStore();

  useEffect(() => {
    if (isLoadingTimelines) {
      return;
    }

    if (timelines.length > 0) {
      if (selectedTimelineId !== timelines[0].id) {
        void selectTimeline(timelines[0].id);
      }
      return;
    }

    void createTimeline(moodId, 'Main');
  }, [timelines, selectedTimelineId, selectTimeline, createTimeline, moodId, isLoadingTimelines]);

  const isPlayingThisMood = activePlaybackContext ? activePlaybackContext.moodId === moodId : true;
  const showPlayhead = (isTimelinePlaying || isTimelinePaused) && isPlayingThisMood;
  const displayPlaybackMs = showPlayhead ? currentPlaybackMs : 0;

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
                    <TimelineRuler
                      timelineEditorDurationSec={timelineEditorDurationSec}
                      timelineEditorDurationMs={timelineEditorDurationMs}
                      displayPlaybackMs={displayPlaybackMs}
                    />

                    <div className="flex-1 relative transition-colors duration-300 pb-20 overflow-y-auto overflow-x-hidden custom-scrollbar">
                      {isTimelinePlaying && currentPlaybackMs > 0 && (
                        <div
                          className="absolute top-0 bottom-0 w-px bg-cyan-400 z-50 pointer-events-none shadow-[0_0_10px_#22d3ee]"
                          style={{
                            left: `calc(128px + ${(Math.min(timelineEditorDurationMs, currentPlaybackMs) / timelineEditorDurationMs) * 100}%)`,
                          }}
                        />
                      )}

                      {tracks.map(track => (
                        <TimelineTrackLane
                          key={track.id}
                          track={track}
                          timelineElements={timelineElements}
                          audioElements={audioElements}
                          isTimelinePlaying={isTimelinePlaying}
                          displayPlaybackMs={displayPlaybackMs}
                          timelineEditorDurationMs={timelineEditorDurationMs}
                          timelineEditorDurationSec={timelineEditorDurationSec}
                          onStopAll={stopAll}
                          onDeleteTrack={trackId => void deleteTimelineTrack(trackId)}
                          onDeleteElement={elementId => void deleteTimelineElement(elementId)}
                          onUpdateElement={(id, startTimeMs, durationMs) =>
                            void updateElementTimeAndDuration(id, startTimeMs, durationMs)
                          }
                        />
                      ))}

                      <div className="p-4 border-b border-white/5 bg-black/10 flex">
                        <button
                          onClick={() =>
                            selectedTimelineId &&
                            void createTimelineTrack(
                              selectedTimelineId,
                              `Track ${tracks.length + 1}`
                            )
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

      <TimelineZoomControls zoomLevel={zoomLevel} onZoomChange={setZoomLevel} />
    </div>
  );
}
