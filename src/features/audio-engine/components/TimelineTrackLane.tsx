import { Droppable } from '@hello-pangea/dnd';
import { AnimatePresence, motion, PanInfo } from 'framer-motion';
import { Repeat } from 'lucide-react';

import { IconPlay, IconTrash } from '../../../shared/components/Icons';
import { Tooltip } from '../../../shared/components/Tooltip';
import { cn } from '../../../shared/utils/cn';
import { useElementGroupStore } from '../../sound-sets/stores/elementGroupStore';
import { AudioElement } from '../../sound-sets/stores/soundSetStore';
import { TimelineElement, TimelineTrack } from '../../sound-sets/stores/timelineStore';

interface TimelineTrackLaneProps {
  track: TimelineTrack;
  timelineElements: TimelineElement[];
  audioElements: AudioElement[];
  isTimelinePlaying: boolean;
  displayPlaybackMs: number;
  timelineEditorDurationMs: number;
  timelineEditorDurationSec: number;
  onStopAll: () => void;
  onDeleteTrack: (trackId: number) => void;
  onDeleteElement: (elementId: number) => void;
  onUpdateElement: (id: number, startTimeMs: number, durationMs: number) => void;
  onToggleTrackLooping: (trackId: number, isLooping: boolean) => void;
}

function resolveSnappedStart(
  element: TimelineElement,
  droppedStartMs: number,
  timelineElements: TimelineElement[]
) {
  let snappedStartMs = Math.max(0, Math.round(droppedStartMs / 1000) * 1000);

  const overlappingElement = timelineElements.find(other => {
    if (other.track_id !== element.track_id || other.id === element.id) {
      return false;
    }

    return (
      Math.max(snappedStartMs, other.start_time_ms) <
      Math.min(snappedStartMs + element.duration_ms, other.start_time_ms + other.duration_ms)
    );
  });

  if (!overlappingElement) {
    return snappedStartMs;
  }

  const otherStart = overlappingElement.start_time_ms;
  const otherEnd = otherStart + overlappingElement.duration_ms;
  const myCenter = snappedStartMs + element.duration_ms / 2;
  const otherCenter = otherStart + overlappingElement.duration_ms / 2;

  snappedStartMs =
    myCenter < otherCenter ? Math.max(0, otherStart - element.duration_ms) : otherEnd;

  const hasDoubleOverlap = timelineElements.some(other => {
    if (other.track_id !== element.track_id || other.id === element.id) {
      return false;
    }

    return (
      Math.max(snappedStartMs, other.start_time_ms) <
      Math.min(snappedStartMs + element.duration_ms, other.start_time_ms + other.duration_ms)
    );
  });

  if (hasDoubleOverlap) {
    return null;
  }

  return snappedStartMs;
}

function getDropStartMs(
  element: TimelineElement,
  trackId: number,
  info: PanInfo,
  timelineEditorDurationMs: number
) {
  const container = document.getElementById(`timeline-track-container-${trackId}`);
  if (!container) {
    return null;
  }

  const trackRect = container.getBoundingClientRect();
  const trackWidth = trackRect.width;
  const currentLeftPx = (element.start_time_ms / timelineEditorDurationMs) * trackWidth;
  const dropX = currentLeftPx + info.offset.x;
  const percentage = Math.max(0, Math.min(100, (dropX / trackWidth) * 100));

  return Math.round((percentage / 100) * timelineEditorDurationMs);
}

/**
 * @description Renders one timeline track lane and its draggable clips.
 * @param props - Component properties.
 * @returns Timeline track lane.
 */
export function TimelineTrackLane({
  track,
  timelineElements,
  audioElements,
  isTimelinePlaying,
  displayPlaybackMs,
  timelineEditorDurationMs,
  timelineEditorDurationSec,
  onStopAll,
  onDeleteTrack,
  onDeleteElement,
  onUpdateElement,
  onToggleTrackLooping,
}: TimelineTrackLaneProps) {
  const { groups } = useElementGroupStore();

  return (
    <div className="flex h-24 relative border-b border-white/5 bg-[#1a1a25]/30 group/track">
      <div className="sticky left-0 top-0 bottom-0 w-32 shrink-0 bg-[#14141d] border-r border-white/10 z-30 flex flex-col justify-center px-4 py-3 shadow-[5px_0_15px_rgba(0,0,0,0.3)]">
        <div className="text-[10px] font-bold text-gray-400 truncate w-full uppercase tracking-wider flex items-center justify-between">
          <span>{track.name}</span>
          {track.is_looping && <Repeat className="w-3 h-3 text-cyan-400" />}
        </div>
        <div className="flex items-center gap-2 mt-2 opacity-0 group-hover/track:opacity-100 transition-all">
          <button
            onClick={() => onToggleTrackLooping(track.id, !track.is_looping)}
            className={cn(
              'p-1 rounded transition-colors group/loop',
              track.is_looping
                ? 'text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20'
                : 'text-gray-600 hover:text-white hover:bg-white/5'
            )}
            title={track.is_looping ? 'Disable Track Loop' : 'Enable Track Loop'}
          >
            <Repeat className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDeleteTrack(track.id)}
            className="p-1 text-gray-600 hover:text-red-400 rounded transition-colors"
            title="Delete Track"
          >
            <IconTrash className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <Droppable droppableId={`timeline-track-${track.id}`} direction="horizontal">
        {(provided, snapshot) => (
          <div
            id={`timeline-track-container-${track.id}`}
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'flex-1 relative h-full min-w-0 transition-colors duration-300',
              snapshot.isDraggingOver ? 'bg-cyan-500/5 ring-inset ring-1 ring-cyan-500/20' : ''
            )}
          >
            <div className="absolute inset-0 flex pointer-events-none opacity-20">
              {Array.from({ length: timelineEditorDurationSec }).map((_, index) => (
                <div
                  key={`${track.id}-${index}`}
                  className={cn(
                    'flex-1 border-r h-full min-w-0',
                    index % 5 === 4 ? 'border-white/20 bg-white/[0.02]' : 'border-white/5'
                  )}
                />
              ))}
            </div>

            <div className="absolute inset-0 pt-2 pb-2 px-0 overflow-visible">
              <AnimatePresence>
                {timelineElements
                  .filter(element => Number(element.track_id) === track.id)
                  .map(element => {
                    let displayName: string;
                    let isGroup: boolean;

                    if (element.audio_element_id !== null) {
                      const audioElement = audioElements.find(
                        candidate => candidate.id === Number(element.audio_element_id)
                      );
                      if (!audioElement) return null;
                      displayName = audioElement.file_name.split('.')[0];
                      isGroup = false;
                    } else if (element.element_group_id !== null) {
                      const group = groups.find(
                        candidate => candidate.id === Number(element.element_group_id)
                      );
                      if (!group) return null;
                      displayName = group.name;
                      isGroup = true;
                    } else {
                      return null;
                    }

                    const leftPercent = (element.start_time_ms / timelineEditorDurationMs) * 100;
                    const widthPercent = (element.duration_ms / timelineEditorDurationMs) * 100;
                    const isActivePlayback =
                      isTimelinePlaying &&
                      displayPlaybackMs >= element.start_time_ms &&
                      displayPlaybackMs < element.start_time_ms + element.duration_ms;

                    return (
                      <motion.div
                        key={element.id}
                        id={`clip-card-${element.id}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0 }}
                        drag="x"
                        dragMomentum={false}
                        dragElastic={0}
                        dragSnapToOrigin={true}
                        onDragStart={onStopAll}
                        whileDrag={{
                          scale: 1.02,
                          opacity: 0.9,
                          zIndex: 50,
                          boxShadow: '0 10px 25px -5px rgba(34, 211, 238, 0.3)',
                        }}
                        onDragEnd={(_event, info) => {
                          const droppedStartMs = getDropStartMs(
                            element,
                            track.id,
                            info,
                            timelineEditorDurationMs
                          );

                          if (droppedStartMs === null) {
                            return;
                          }

                          const snappedStartMs = resolveSnappedStart(
                            element,
                            droppedStartMs,
                            timelineElements
                          );

                          if (snappedStartMs === null) {
                            return;
                          }

                          onUpdateElement(element.id, snappedStartMs, element.duration_ms);
                        }}
                        className={cn(
                          'clip-card absolute h-16 top-4 border rounded-lg overflow-visible shadow-lg group focus:outline-none flex items-center gap-1.5 cursor-grab active:cursor-grabbing backdrop-blur-md transition-all z-10 hover:z-50',
                          isActivePlayback
                            ? isGroup
                              ? 'bg-purple-500/20 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                              : 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                            : isGroup
                              ? 'bg-gradient-to-r from-[#1a1e2d] to-[#2d1b36] border-purple-500/30 hover:border-purple-400'
                              : 'bg-gradient-to-r from-[#1a1e2d] to-[#1e293b] border-cyan-500/30 hover:border-cyan-400'
                        )}
                        style={{
                          left: `${leftPercent}%`,
                          width: `${Math.max(widthPercent, 0.5)}%`,
                          touchAction: 'none',
                        }}
                      >
                        <Tooltip
                          content={displayName}
                          delay={0.2}
                          position="top"
                          className="flex-1 min-w-0 h-full"
                        >
                          <div className="flex items-center w-full h-full cursor-grab active:cursor-grabbing">
                            <div
                              className={cn(
                                'w-5 h-5 ml-1 rounded-full flex flex-col items-center justify-center shrink-0 pointer-events-none transition-colors duration-300',
                                isActivePlayback
                                  ? isGroup
                                    ? 'bg-purple-400 text-gray-900 shadow-[0_0_10px_rgba(168,85,247,0.6)]'
                                    : 'bg-cyan-400 text-gray-900 shadow-[0_0_10px_rgba(34,211,238,0.6)]'
                                  : isGroup
                                    ? 'bg-purple-500/20 text-purple-400'
                                    : 'bg-cyan-500/20 text-cyan-400'
                              )}
                            >
                              <IconPlay className="w-2.5 h-2.5 ml-0.5" />
                            </div>
                            <div className="flex-1 min-w-0 pointer-events-none ml-1.5 flex flex-col justify-center">
                              <div className="text-[10px] text-gray-200 font-bold truncate mb-0.5 drop-shadow-md">
                                {displayName}
                              </div>
                              <div className="text-[8px] text-cyan-500 font-mono tracking-wider truncate">
                                {(element.start_time_ms / 1000).toFixed(1)}s
                              </div>
                            </div>
                          </div>
                        </Tooltip>
                        <button
                          onClick={event => {
                            event.stopPropagation();
                            onDeleteElement(element.id);
                          }}
                          onPointerDown={event => event.stopPropagation()}
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
  );
}
