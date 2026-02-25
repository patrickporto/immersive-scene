import { useEffect, useState } from 'react';

import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd';
import { open } from '@tauri-apps/plugin-dialog';
import { readFile } from '@tauri-apps/plugin-fs';
import { AnimatePresence, motion } from 'framer-motion';

import { TimelineEditor } from './TimelineEditor';
import { IconPause, IconPlay, IconRepeat, IconTrash } from '../../../shared/components/Icons';
import { Waveform } from '../../../shared/components/Waveform';
import { useToast } from '../../../shared/hooks/useToast';
import { cn } from '../../../shared/utils/cn';
import { useMixerStore } from '../../mixer/stores/mixerStore';
import { AudioElement, useSoundSetStore } from '../../sound-sets/stores/soundSetStore';
import { useTimelineStore } from '../../sound-sets/stores/timelineStore';
import { useAudioEngineStore } from '../stores/audioEngineStore';

interface AudioUploaderProps {
  soundSetId: number;
  moodId: number;
}

const VALID_EXTENSIONS = ['.ogg', '.mp3', '.wav', '.flac'];

export function AudioUploader({ soundSetId, moodId: _moodId }: AudioUploaderProps) {
  const { createAudioElement, loadAudioElements, audioElements } = useSoundSetStore();
  const { initAudioContext, loadAudioFile } = useAudioEngineStore();
  const { success, error } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const loadMissingAudio = async () => {
      if (!audioElements.length) return;

      await initAudioContext();

      for (const element of audioElements) {
        // Use getState to avoid infinite loops from sources dependency
        const currentSources = useAudioEngineStore.getState().sources;
        if (!currentSources.has(element.id)) {
          try {
            const fileData = await readFile(element.file_path);
            await loadAudioFile(element, fileData.buffer.slice(0));
          } catch (err) {
            console.error(`Failed to preload ${element.file_name}:`, err);
          }
        }
      }
    };

    loadMissingAudio();
  }, [audioElements, initAudioContext, loadAudioFile]);

  const handleUpload = async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [
          {
            name: 'Audio Files',
            extensions: ['ogg', 'mp3', 'wav', 'flac'],
          },
        ],
      });

      if (!selected) return;

      setIsUploading(true);
      await initAudioContext();

      const files = Array.isArray(selected) ? selected : [selected];
      let uploadCount = 0;

      for (const filePath of files) {
        const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || 'unknown';
        const extension = '.' + fileName.split('.').pop()?.toLowerCase();

        if (!VALID_EXTENSIONS.includes(extension)) {
          console.warn(`Formato inválido: ${extension}`);
          continue;
        }

        try {
          const fileData = await readFile(filePath);
          await createAudioElement(soundSetId, filePath, fileName, 'ambient');

          await loadAudioElements(soundSetId);
          const elements = useSoundSetStore.getState().audioElements;
          const newElement = elements.find(e => e.file_path === filePath);

          if (newElement) {
            await loadAudioFile(newElement, fileData.buffer.slice(0));
            uploadCount++;
          }
        } catch (err) {
          console.error('Erro ao processar arquivo:', err);
        }
      }

      await loadAudioElements(soundSetId);
      if (uploadCount > 0) {
        success(`Successfully uploaded ${uploadCount} file(s)`);
      }
    } catch (err) {
      console.error('Erro no upload:', err);
      error(`Failed to upload audio files: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, draggableId } = result;

    if (!destination) return;

    const elementId = parseInt(draggableId, 10);
    if (isNaN(elementId)) return;

    if (destination.droppableId === 'effects-zone') {
      useSoundSetStore.getState().updateAudioElementChannel(elementId, 'effects');
      return;
    }

    if (destination.droppableId === 'timeline-track') {
      const { selectedTimelineId, addElementToTimeline } = useTimelineStore.getState();
      if (!selectedTimelineId) {
        error('Selecione uma timeline primeiro.');
        return;
      }

      // Calculate the start time based on the dropped X coordinate
      // We assume timeline width represents 60 seconds (60000ms), but the track is scrollable
      // The simplest calculation is using a static width for now, or finding the track element
      const trackElement = document.getElementById('timeline-track-container');
      let startTimeMs = 0;

      if (trackElement && window.__lastDragX !== undefined) {
        const rect = trackElement.getBoundingClientRect();
        // The track has a padding or offset? Let's use exact clientX
        const dropX = window.__lastDragX - rect.left + trackElement.scrollLeft;

        // Let's assume the track uses tailwind `w-full` but represents something.
        // Looking at TimelineEditor, 1 minute is the baseline width, or is it wider?
        // Actually, the track background uses `percent` in mapping: (start_time_ms / 60000) * 100
        // So 60,000ms = 100% of the track element's scrollWidth
        const trackWidth = trackElement.scrollWidth;
        const percentage = Math.max(0, Math.min(100, (dropX / trackWidth) * 100));

        startTimeMs = Math.round((percentage / 100) * 60000);
      }

      addElementToTimeline(selectedTimelineId, elementId, startTimeMs).catch(err => {
        error('Falha ao adicionar elemento à timeline: ' + err.message);
      });
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full space-y-6 p-8 max-w-[1600px] mx-auto w-full overflow-hidden">
        {/* Elements Grid - Main Mixing Board */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-6 px-4">
            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
              Mixing Elements ({audioElements.length})
            </h4>
          </div>

          <Droppable droppableId="mixing-elements" direction="horizontal" isDropDisabled={true}>
            {provided => (
              <div
                className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                <motion.div
                  layout
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUpload}
                  className={cn(
                    'bg-[#1a1a25]/50 border border-dashed border-white/10 rounded-xl px-4 py-3 flex items-center justify-start h-[80px] transition-all cursor-pointer group hover:border-cyan-500/50 hover:bg-cyan-500/5 gap-4',
                    isUploading && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {isUploading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      className="w-5 h-5 rounded-full border-t-2 border-r-2 border-cyan-500 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 group-hover:bg-cyan-500/10 transition-colors shrink-0">
                      <IconPlay className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 transition-colors ml-0.5" />
                    </div>
                  )}
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-cyan-400 transition-colors truncate">
                      {isUploading ? 'Uploading...' : 'Add Element'}
                    </div>
                    <div className="text-[9px] text-gray-600 truncate mt-0.5">
                      {isUploading ? 'Please wait' : 'Click to upload files'}
                    </div>
                  </div>
                </motion.div>
                <AnimatePresence mode="popLayout">
                  {audioElements
                    .filter(e => e.channel_type !== 'effects')
                    .map((element, index) => (
                      <Draggable
                        key={element.id.toString()}
                        draggableId={element.id.toString()}
                        index={index}
                      >
                        {(dragProvided, dragSnapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            style={{
                              ...dragProvided.draggableProps.style,
                              opacity: dragSnapshot.isDragging ? 0.8 : 1,
                              zIndex: dragSnapshot.isDragging ? 50 : 1,
                            }}
                            className="h-full"
                          >
                            <AudioElementItem element={element} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                </AnimatePresence>
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>

        {/* One-shots Section - At the bottom of main area */}
        <Droppable droppableId="effects-zone" direction="horizontal">
          {(provided, snapshot) => (
            <div
              className={cn(
                'pt-6 border-t border-white/5 bg-black/20 rounded-t-3xl p-6 lg:p-8 transition-colors',
                snapshot.isDraggingOver ? 'bg-cyan-500/10 border-cyan-500/30' : 'hover:bg-black/30'
              )}
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">
                One-Shots (Instant Triggers)
              </h4>
              <div className="flex flex-wrap gap-4">
                {audioElements
                  .filter(e => e.channel_type === 'effects')
                  .map(element => (
                    <OneShotButton key={element.id} element={element} />
                  ))}

                {/* Empty state for one-shots if none exist */}
                {audioElements.filter(e => e.channel_type === 'effects').length === 0 && (
                  <div className="text-[10px] text-gray-600 italic py-2 w-full text-center border-2 border-dashed border-white/10 rounded-xl">
                    Drop audio elements here to add them as 1-shot soundboard effects
                  </div>
                )}
                {provided.placeholder}
              </div>
            </div>
          )}
        </Droppable>

        {/* Timeline Section - At the very bottom */}
        <TimelineEditor moodId={_moodId} />
      </div>
    </DragDropContext>
  );
}

function OneShotButton({ element }: { element: AudioElement }) {
  const { play, sources, selectedElementId, setSelectedElementId, toggleLoop } =
    useAudioEngineStore();
  const source = sources.get(element.id);
  const isPlaying = source?.isPlaying || false;
  const isLooping = source?.isLooping || false;

  return (
    <div className="relative group/oneshot">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          play(element.id);
          setSelectedElementId(element.id);
        }}
        className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center transition-all relative group',
          'bg-[#1a1a25] border-2 shadow-[0_4px_0_rgba(0,0,0,0.4)]',
          isPlaying
            ? 'border-cyan-400 text-cyan-400 glow-cyan'
            : 'border-white/10 text-gray-500 hover:border-white/20',
          selectedElementId === element.id &&
            'ring-2 ring-cyan-500 ring-offset-2 ring-offset-[#0a0a0f]'
        )}
        title={element.file_name}
      >
        <IconPlay className="w-5 h-5 ml-0.5" />
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-[9px] font-bold text-gray-400 uppercase pointer-events-none">
          {element.file_name.substring(0, 8)}
        </div>
      </motion.button>

      <button
        onClick={e => {
          e.stopPropagation();
          toggleLoop(element.id);
        }}
        className={cn(
          'absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center transition-all shadow-md z-10',
          isLooping
            ? 'bg-cyan-500 text-black opacity-100 shadow-[0_0_10px_rgba(0,212,255,0.4)]'
            : 'bg-[#1a1a25] text-gray-500 border border-white/10 opacity-0 group-hover/oneshot:opacity-100 hover:text-white hover:border-white/30 hover:bg-[#2a2a35]'
        )}
        title={isLooping ? 'Disable Loop' : 'Enable Loop'}
      >
        <IconRepeat className="w-3 h-3" />
      </button>
    </div>
  );
}

function AudioElementItem({ element }: { element: AudioElement }) {
  const { play, pause, stop, sources, toggleLoop, selectedElementId, setSelectedElementId } =
    useAudioEngineStore();
  const { deleteAudioElement, loadAudioElements, selectedMood } = useSoundSetStore();
  const { channels, setChannelVolume } = useMixerStore();
  const { success, error } = useToast();

  const source = sources.get(element.id);
  const isPlaying = source?.isPlaying || false;
  const isLooping = source?.isLooping || false;
  // Fallback to prevent crashes if channel type is not present in mixer store
  const channelInfo = channels[element.channel_type] || {
    volume: 80,
    isMuted: false,
    isSoloed: false,
  };

  const handleDelete = async () => {
    try {
      stop(element.id);
      await deleteAudioElement(element.id);
      if (selectedMood) {
        await loadAudioElements(selectedMood.id);
      }
      success(`Element "${element.file_name}" removed`);
    } catch {
      error('Failed to remove element');
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={() => {
        setSelectedElementId(element.id);
        if (isPlaying) {
          pause(element.id);
        } else {
          play(element.id);
        }
      }}
      className={cn(
        'border rounded-xl p-3 flex items-center justify-between h-[80px] transition-all relative overflow-hidden cursor-pointer group/card gap-3',
        isPlaying
          ? 'border-cyan-400 shadow-[0_0_30px_rgba(0,212,255,0.3)] bg-gradient-to-br from-[#1a1a25] to-cyan-900/30'
          : 'border-white/[0.05] bg-[#1a1a25]',
        selectedElementId === element.id && 'border-cyan-500 ring-1 ring-cyan-500/30'
      )}
    >
      {/* Background visualization */}
      {isPlaying && (
        <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center overflow-hidden">
          <Waveform isPlaying={isPlaying} height={80} barCount={40} color="bg-cyan-400" />
        </div>
      )}

      {/* Play/Pause */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={e => {
          e.stopPropagation();
          if (isPlaying) {
            pause(element.id);
          } else {
            play(element.id);
          }
        }}
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg shrink-0 z-10',
          isPlaying
            ? 'bg-cyan-400 text-black shadow-[0_0_15px_rgba(0,212,255,0.6)]'
            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
        )}
      >
        {isPlaying ? <IconPause className="w-5 h-5" /> : <IconPlay className="w-5 h-5 ml-0.5" />}
      </motion.button>

      {/* Info & Loops */}
      <div className="flex-1 flex flex-col justify-center min-w-0 z-10">
        <p
          className="text-[12px] font-bold text-gray-300 truncate w-full"
          title={element.file_name}
        >
          {element.file_name.split('.')[0]}
        </p>

        <div className="flex items-center gap-2 mt-1 relative">
          <motion.button
            onClick={e => {
              e.stopPropagation();
              toggleLoop(element.id);
            }}
            className={cn(
              'flex items-center gap-1 px-1.5 py-0.5 rounded transition-all border',
              isLooping
                ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_10px_rgba(0,212,255,0.1)]'
                : 'text-gray-500 bg-transparent border-transparent hover:text-gray-300 hover:bg-white/5 hover:border-white/10'
            )}
            title={isLooping ? 'Disable Loop' : 'Enable Loop'}
          >
            <IconRepeat className="w-3 h-3" />
            <span className="text-[8px] font-bold uppercase tracking-wider">
              {isLooping ? 'Loop' : '1-Shot'}
            </span>
          </motion.button>

          <button
            onClick={e => {
              e.stopPropagation();
              handleDelete();
            }}
            className="p-1 text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover/card:opacity-100"
            title="Remove Element"
          >
            <IconTrash className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Horizontal Volume Slider */}
      <div className="w-20 lg:w-24 flex items-center gap-2 group/slider shrink-0 z-10 pr-1">
        <div className="flex-1 relative h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
          <motion.div
            className={cn(
              'absolute top-0 left-0 bottom-0 transition-all duration-75',
              isPlaying ? 'bg-cyan-400 shadow-[0_0_10px_rgba(0,212,255,0.5)]' : 'bg-gray-700'
            )}
            style={{ width: `${channelInfo.volume}%` }}
          />
          <input
            type="range"
            min="0"
            max="100"
            value={channelInfo.volume}
            onChange={e => setChannelVolume(element.channel_type, Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <span className="text-[9px] font-bold text-gray-500 w-5 text-right">
          {channelInfo.volume}
        </span>
      </div>
    </motion.div>
  );
}
