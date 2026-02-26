import { useEffect } from 'react';

import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { motion } from 'framer-motion';

import { AudioUploader } from './features/audio-engine/components/AudioUploader';
import { TimelineEditor } from './features/audio-engine/components/TimelineEditor';
import { useAudioEngineStore } from './features/audio-engine/stores/audioEngineStore';
import { BottomPlayer } from './features/mixer/components/BottomPlayer';
import { SoundSetBrowser } from './features/sound-sets/components/SoundSetBrowser';
import { useSoundSetStore } from './features/sound-sets/stores/soundSetStore';
import { useTimelineStore } from './features/sound-sets/stores/timelineStore';
import { useToast } from './shared/hooks/useToast';

export default function App() {
  const { loadSoundSets, selectedSoundSet, selectedMood, isLoading, soundSets, error } =
    useSoundSetStore();
  const { initAudioContext } = useAudioEngineStore();
  const { success, error: toastError } = useToast();

  const handleDragEnd = (result: DropResult) => {
    const { destination, draggableId } = result;

    if (!destination) {
      toastError(`Drop failed: no destination (dragged ${draggableId})`);
      return;
    }

    const elementId = parseInt(draggableId, 10);
    if (isNaN(elementId)) return;

    if (destination.droppableId === 'effects-zone') {
      useSoundSetStore.getState().updateAudioElementChannel(elementId, 'effects');
      return;
    }

    const timelineTrackMatch = destination.droppableId.match(/^timeline-track-(\d+)$/);
    if (timelineTrackMatch) {
      const {
        selectedTimelineId,
        addElementToTrack,
        elements: timelineElements,
      } = useTimelineStore.getState();
      if (!selectedTimelineId) {
        toastError('Selecione uma timeline primeiro.');
        return;
      }

      const targetTrackId = Number(timelineTrackMatch[1]);
      const targetTrackElement = document.getElementById(
        `timeline-track-container-${targetTrackId}`
      );

      if (!targetTrackElement) {
        toastError('Elemento não solto sobre uma trilha válida.');
        return;
      }

      const dropX = (window as any).__lastDragX;
      let startTimeMs = 0;

      if (typeof dropX === 'number') {
        const rect = targetTrackElement.getBoundingClientRect();
        const relativeX = dropX - rect.left + targetTrackElement.scrollLeft;
        const trackWidth = Math.max(targetTrackElement.scrollWidth, targetTrackElement.clientWidth);
        const percentage = Math.max(0, Math.min(100, (relativeX / trackWidth) * 100));
        startTimeMs = Math.round((percentage / 100) * 60000);
      }

      // Estimate duration from loaded audio buffer
      const audioSource = useAudioEngineStore.getState().sources.get(elementId);
      const durationMs = audioSource?.buffer
        ? Math.round(audioSource.buffer.duration * 1000)
        : 10000;

      // Client-side overlap check
      const isOverlapping = timelineElements.some(other => {
        if (other.track_id !== targetTrackId) return false;
        return (
          Math.max(startTimeMs, other.start_time_ms) <
          Math.min(startTimeMs + durationMs, other.start_time_ms + other.duration_ms)
        );
      });

      if (isOverlapping) {
        toastError('Conflito: Já existe um elemento neste tempo da trilha.');
        return;
      }

      addElementToTrack(targetTrackId, elementId, startTimeMs, durationMs)
        .then(() => {
          success(
            `Elemento ${elementId} na trilha ${targetTrackId} (${startTimeMs}ms - duração ${durationMs}ms)`
          );
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : String(err);
          toastError('Falha ao adicionar elemento à timeline: ' + message);
        });
    } else {
      toastError(`Destino de drop inválido: ${destination.droppableId}`);
    }
  };

  useEffect(() => {
    console.log('App mounted, loading soundsets...');
    loadSoundSets();
    initAudioContext();
  }, [loadSoundSets, initAudioContext]);

  useEffect(() => {
    console.log('SoundSets updated:', soundSets.length);
  }, [soundSets]);

  if (isLoading && soundSets.length === 0) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0a0a0f]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-8 h-8 rounded-full border-t-2 border-r-2 border-cyan-500"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0a0a0f] flex-col gap-4">
        <div className="text-red-500 font-bold">Error: {error}</div>
        <button
          onClick={() => loadSoundSets()}
          className="px-4 py-2 bg-cyan-500 text-black rounded font-bold"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#0a0a0f] text-slate-100 font-sans overflow-hidden selection:bg-cyan-500/30">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 border-r border-white/5 bg-[#0f0f15] shadow-2xl z-10 hidden md:block">
        <SoundSetBrowser />
      </div>

      {/* Primary Area */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <main className="flex-1 flex flex-col relative overflow-hidden">
          <div className="flex-1 overflow-y-auto custom-scrollbar relative">
            {!selectedSoundSet && (
              <div className="flex items-center justify-center h-full text-gray-500 font-medium tracking-wider uppercase text-sm">
                Select or create a SoundSet to begin.
              </div>
            )}

            {selectedSoundSet && !selectedMood && (
              <div className="flex items-center justify-center h-full text-gray-500 font-medium tracking-wider uppercase text-sm">
                Select or create a Mood for &quot;{selectedSoundSet.name}&quot;
              </div>
            )}

            {selectedSoundSet && selectedMood && (
              <AudioUploader soundSetId={selectedSoundSet.id} moodId={selectedMood.id} />
            )}
          </div>

          {/* Player + Timeline */}
          <div className="flex-shrink-0 z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] bg-[#0f0f15] border-t border-white/5 relative flex flex-col">
            <div className="h-24">
              <BottomPlayer />
            </div>
            {selectedSoundSet && selectedMood && <TimelineEditor moodId={selectedMood.id} />}
          </div>
        </main>
      </DragDropContext>

      {/* Embedded Styles for custom-scrollbar */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #334155;
          border-radius: 20px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: #475569;
        }
      `,
        }}
      />
    </div>
  );
}
