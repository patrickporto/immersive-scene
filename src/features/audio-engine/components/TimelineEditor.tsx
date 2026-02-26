import { useEffect, useState } from 'react';

import { Droppable } from '@hello-pangea/dnd';
import { AnimatePresence, motion } from 'framer-motion';

import {
  IconPlay,
  IconPlus,
  IconStop,
  IconTrash,
  IconRepeat,
} from '../../../shared/components/Icons';
import { useToast } from '../../../shared/hooks/useToast';
import { cn } from '../../../shared/utils/cn';
import { useSoundSetStore } from '../../sound-sets/stores/soundSetStore';
import { useTimelineStore } from '../../sound-sets/stores/timelineStore';
import { useAudioEngineStore } from '../stores/audioEngineStore';

// We will use inline SVGs for Chevrons if they don't exist in shared icons
const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

const ChevronUpIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="18 15 12 9 6 15"></polyline>
  </svg>
);

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
    deleteTimeline,
    toggleTimelineLoop,
    createTimelineTrack,
    deleteTimelineTrack,
    updateElementTimeAndDuration,
    deleteTimelineElement,
  } = useTimelineStore();

  const { audioElements } = useSoundSetStore();
  const { stopAll, crossfadeToTimeline } = useAudioEngineStore();
  const { toast } = useToast();

  const [isExpanded, setIsExpanded] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTimelineName, setNewTimelineName] = useState('');

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

  const handleCreateTimeline = async () => {
    if (!newTimelineName.trim()) return;
    try {
      await createTimeline(moodId, newTimelineName.trim());
      setIsCreating(false);
      setNewTimelineName('');
    } catch {
      toast('Erro ao criar timeline');
    }
  };

  // Native drop is no longer needed on the container wrapper
  // since this will be handled by Pangea in AudioUploader

  return (
    <div className="pt-8 border-t border-white/5 bg-black/40 rounded-t-3xl p-6 lg:p-8 mt-4 relative overflow-visible">
      {/* Glow effects for aesthetic */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="group flex flex-col items-start text-left focus:outline-none"
          >
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-[10px] font-bold text-gray-400 group-hover:text-cyan-400 uppercase tracking-[0.2em] transition-colors">
                Timeline Sequencer
              </h4>
              <div className="text-gray-500 group-hover:text-cyan-400 transition-colors">
                {isExpanded ? (
                  <ChevronUpIcon className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDownIcon className="w-3.5 h-3.5" />
                )}
              </div>
            </div>
            <p className="text-xs text-gray-600 group-hover:text-gray-400 transition-colors">
              Crie sequências complexas de áudio ao longo do tempo
            </p>
          </button>
        </div>

        <div className="flex items-center gap-4"></div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-visible"
          >
            <div className="flex flex-col md:flex-row gap-6 h-[340px] relative z-10 mt-6 md:mt-0 pt-2">
              {/* Sidebar: Timeline List */}
              <div className="w-full md:w-56 bg-black/20 border border-white/5 rounded-xl flex flex-col p-3 gap-2">
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider px-1 shrink-0">
                  Minhas Timelines
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                  {timelines.map(timeline => (
                    <div
                      key={timeline.id}
                      onClick={() => selectTimeline(timeline.id)}
                      className={cn(
                        'group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all',
                        selectedTimelineId === timeline.id
                          ? 'bg-gradient-to-r from-cyan-500/20 to-transparent border border-cyan-500/30 text-cyan-400'
                          : 'bg-[#1a1a25] border border-white/5 text-gray-400 hover:border-white/10 hover:text-gray-300'
                      )}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div
                          className={cn(
                            'w-1.5 h-1.5 rounded-full shrink-0',
                            selectedTimelineId === timeline.id
                              ? 'bg-cyan-400 shadow-[0_0_5px_#22d3ee]'
                              : 'bg-gray-700'
                          )}
                        />
                        <span className="text-xs font-medium truncate flex-1">{timeline.name}</span>
                      </div>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          deleteTimeline(timeline.id);
                          if (selectedTimelineId === timeline.id) {
                            stopAll();
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded transition-all"
                      >
                        <IconTrash className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {isCreating ? (
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#1a1a25] border border-cyan-500/50">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_5px_#22d3ee] shrink-0" />
                      <input
                        type="text"
                        autoFocus
                        className="bg-transparent border-none outline-none text-xs text-cyan-400 w-full"
                        placeholder="Nome da timeline..."
                        value={newTimelineName}
                        onChange={e => setNewTimelineName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            handleCreateTimeline();
                          } else if (e.key === 'Escape') {
                            setIsCreating(false);
                            setNewTimelineName('');
                          }
                        }}
                        onBlur={() => {
                          if (newTimelineName.trim()) {
                            handleCreateTimeline();
                          } else {
                            setIsCreating(false);
                            setNewTimelineName('');
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsCreating(true)}
                      className="w-full group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all border border-dashed border-white/10 text-gray-400 hover:border-cyan-500/30 hover:text-cyan-400 hover:bg-cyan-500/5 mt-1"
                    >
                      <IconPlus className="w-3.5 h-3.5 opacity-70 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-medium opacity-80 group-hover:opacity-100">
                        Adicionar timeline...
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Main Track Area */}
              <div className="flex-1 bg-gradient-to-b from-[#1a1a25] to-black/30 border border-white/5 rounded-xl relative flex flex-col overflow-visible">
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
                    <div className="bg-black/40 px-6 py-4 flex items-center gap-6 border-b border-white/5 shadow-inner">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => crossfadeToTimeline(timelineElements)}
                          className="w-10 h-10 rounded-full bg-cyan-500 text-black flex items-center justify-center hover:scale-105 transition-all shadow-[0_0_15px_rgba(0,212,255,0.3)] hover:shadow-[0_0_20px_rgba(0,212,255,0.5)]"
                          title="Play Timeline"
                        >
                          <IconPlay className="w-5 h-5 ml-0.5" />
                        </button>
                        <button
                          onClick={() => stopAll()}
                          className="w-10 h-10 rounded-full bg-[#1e1e28] text-gray-400 flex items-center justify-center hover:bg-white/10 hover:text-white transition-colors border border-white/5"
                          title="Stop Timeline"
                        >
                          <IconStop className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            const activeTimeline = timelines.find(t => t.id === selectedTimelineId);
                            if (activeTimeline) {
                              toggleTimelineLoop(selectedTimelineId, !activeTimeline.is_looping);
                            }
                          }}
                          className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center transition-all border',
                            timelines.find(t => t.id === selectedTimelineId)?.is_looping
                              ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 shadow-[0_0_15px_rgba(0,212,255,0.2)]'
                              : 'bg-[#1e1e28] text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'
                          )}
                          title="Toggle Loop"
                        >
                          <IconRepeat className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Timeline Progress Representation */}
                      <div className="flex-1 flex flex-col gap-1.5">
                        <div className="flex justify-between text-[9px] text-cyan-400 font-mono font-bold tracking-widest px-1">
                          <span>0:00</span>
                          <span>1:00</span>
                        </div>
                        <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden border border-white/5 relative">
                          <div className="absolute top-0 left-0 bottom-0 w-0 bg-cyan-500/50 shadow-[0_0_10px_#22d3ee] rounded-full" />
                        </div>
                      </div>
                    </div>

                    {/* Composition Track Background / Grid */}
                    <div className="flex-1 relative transition-colors duration-300 pb-20 overflow-y-auto overflow-x-hidden custom-scrollbar">
                      {tracks.map(track => (
                        <div
                          key={track.id}
                          className="relative border-b border-white/5 bg-[#1a1a25]/30"
                        >
                          {/* Track Header (left info) */}
                          <div className="sticky left-0 top-0 bottom-0 w-32 bg-[#14141d] border-r border-white/10 z-30 flex flex-col justify-center px-4 py-3 shadow-[5px_0_15px_rgba(0,0,0,0.3)]">
                            <div className="text-[10px] font-bold text-gray-400 truncate w-full uppercase tracking-wider">
                              {track.name}
                            </div>
                            <button
                              onClick={() => deleteTimelineTrack(track.id)}
                              className="text-gray-600 hover:text-red-400 mt-2 text-left w-max transition-colors"
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
                                  'absolute left-32 top-0 bottom-0 right-0 h-24 relative transition-colors duration-300 w-full',
                                  snapshot.isDraggingOver
                                    ? 'bg-cyan-500/5 ring-inset ring-1 ring-cyan-500/20'
                                    : ''
                                )}
                              >
                                {/* Time markers background */}
                                <div className="absolute inset-0 flex pointer-events-none opacity-20">
                                  {Array.from({ length: 60 }).map((_, i) => (
                                    <div
                                      key={i}
                                      className={cn(
                                        'flex-1 border-r border-white/10 h-full',
                                        i % 5 === 4 ? 'border-white/30 bg-white/5' : ''
                                      )}
                                    />
                                  ))}
                                </div>

                                {/* Placed Elements Space */}
                                <div className="absolute inset-0 pt-2 pb-2 px-0 overflow-y-hidden">
                                  <AnimatePresence>
                                    {timelineElements
                                      .filter(te => Number(te.track_id) === track.id)
                                      .map((te, _index) => {
                                        const el = audioElements.find(
                                          a => a.id === Number(te.audio_element_id)
                                        );
                                        if (!el) return null;
                                        const leftPercent = (te.start_time_ms / 60000) * 100;
                                        const widthPercent = (te.duration_ms / 60000) * 100;

                                        return (
                                          <motion.div
                                            key={te.id}
                                            id={`clip-card-${te.id}`}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            drag="x"
                                            dragMomentum={false}
                                            dragElastic={0}
                                            onDragEnd={(_e, _info) => {
                                              const container = document.getElementById(
                                                `timeline-track-container-${track.id}`
                                              );
                                              if (!container) return;
                                              const trackWidth = container.scrollWidth;

                                              const targetElement = document.getElementById(
                                                `clip-card-${te.id}`
                                              );
                                              if (!targetElement) return;

                                              const elRect = targetElement.getBoundingClientRect();
                                              const trackRect = container.getBoundingClientRect();

                                              let dropX =
                                                elRect.left - trackRect.left + container.scrollLeft;
                                              dropX = Math.max(0, dropX);

                                              const percentage = Math.max(
                                                0,
                                                Math.min(100, (dropX / trackWidth) * 100)
                                              );
                                              const newStartTimeMs = Math.round(
                                                (percentage / 100) * 60000
                                              );

                                              const snappedStartMs =
                                                Math.round(newStartTimeMs / 100) * 100;

                                              updateElementTimeAndDuration(
                                                te.id,
                                                snappedStartMs,
                                                te.duration_ms
                                              );
                                            }}
                                            className="clip-card absolute h-16 top-4 bg-gradient-to-r from-[#1a1e2d] to-[#1e293b] border border-cyan-500/30 rounded-lg px-3 py-2 shadow-lg group focus:outline-none flex items-center gap-3 cursor-grab active:cursor-grabbing backdrop-blur-md hover:border-cyan-400 transition-colors z-10"
                                            style={{
                                              left: `${leftPercent}%`,
                                              width: `${Math.max(widthPercent, 5)}%`,
                                              minWidth: '60px',
                                              touchAction: 'none', // Important for framer-motion drag on some devices
                                            }}
                                          >
                                            <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 pointer-events-none">
                                              <IconPlay className="w-3 h-3 ml-0.5" />
                                            </div>
                                            <div className="flex-1 min-w-0 pointer-events-none">
                                              <div className="text-[11px] text-gray-200 font-bold truncate mb-0.5 drop-shadow-md">
                                                {el.file_name.split('.')[0]}
                                              </div>
                                              <div className="text-[9px] text-cyan-500 font-mono tracking-wider">
                                                {(te.start_time_ms / 1000).toFixed(1)}s
                                              </div>
                                            </div>
                                            <button
                                              onClick={e => {
                                                e.stopPropagation();
                                                deleteTimelineElement(te.id);
                                              }}
                                              onPointerDown={e => e.stopPropagation()}
                                              className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded transition-all shrink-0 cursor-pointer"
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
    </div>
  );
}
