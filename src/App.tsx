import { useEffect, useState } from 'react';

import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';

import { AudioUploader } from './features/audio-engine/components/AudioUploader';
import { TimelineEditor } from './features/audio-engine/components/TimelineEditor';
import { useAudioEngineStore } from './features/audio-engine/stores/audioEngineStore';
import { BottomPlayer } from './features/mixer/components/BottomPlayer';
import ChannelSidebar from './features/mixer/components/ChannelSidebar';
import { SettingsModal } from './features/settings/components/SettingsModal';
import { SoundSetBrowser } from './features/sound-sets/components/SoundSetBrowser';
import { useElementGroupStore } from './features/sound-sets/stores/elementGroupStore';
import { useSoundSetStore } from './features/sound-sets/stores/soundSetStore';
import { useTimelineStore } from './features/sound-sets/stores/timelineStore';
import { useToast } from './shared/hooks/useToast';

export default function App() {
  const { loadSoundSets, selectedSoundSet, selectedMood, isLoading, soundSets, error } =
    useSoundSetStore();
  const { initAudioContext } = useAudioEngineStore();
  const { success, error: toastError } = useToast();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleDragEnd = (result: DropResult) => {
    const { destination, draggableId } = result;

    if (!destination) {
      toastError(`Drop failed: no destination (dragged ${draggableId})`);
      return;
    }

    const isGroupDrag = draggableId.startsWith('group-');
    const isMemberDrag = draggableId.startsWith('member-');

    let elementId: number | null = null;
    let draggedGroupId: number | null = null;
    let memberId: number | null = null;
    let sourceGroupId: number | null = null;

    if (isGroupDrag) {
      draggedGroupId = parseInt(draggableId.replace('group-', ''), 10);
      if (isNaN(draggedGroupId)) return;
    } else if (isMemberDrag) {
      // member-{memberId}-audio-{elementId}-group-{groupId}
      const parts = draggableId.split('-');
      if (parts.length >= 6) {
        memberId = parseInt(parts[1], 10);
        elementId = parseInt(parts[3], 10);
        sourceGroupId = parseInt(parts[5], 10);
        if (isNaN(memberId) || isNaN(elementId) || isNaN(sourceGroupId)) return;
      } else {
        return;
      }
    } else {
      elementId = parseInt(draggableId, 10);
      if (isNaN(elementId)) return;
    }

    if (destination.droppableId === 'mixing-elements') {
      if (isMemberDrag && memberId !== null && sourceGroupId !== null) {
        useElementGroupStore
          .getState()
          .removeElementFromGroup(memberId, sourceGroupId)
          .then(() => success('Movido para Mixed Elements'))
          .catch(err => toastError('Erro ao remover: ' + String(err)));
      }
      return;
    }

    if (destination.droppableId === 'effects-zone') {
      if (elementId !== null) {
        useSoundSetStore.getState().updateAudioElementChannel(elementId, 'effects');
      } else {
        toastError('Cannot route an entire group to effects zone yet.');
      }
      return;
    }

    const groupMatch = destination.droppableId.match(/^group-(\d+)$/);
    if (groupMatch) {
      if (elementId !== null) {
        const groupId = Number(groupMatch[1]);
        const { addElementToGroup } = useElementGroupStore.getState();

        addElementToGroup(groupId, elementId)
          .then(() => success(`Element added to group ${groupId}`))
          .catch(err => toastError('Failed to add element: ' + String(err)));
      } else {
        toastError('Cannot add a group inside another group.');
      }
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

      const dropX = (window as unknown as { __lastDragX?: number }).__lastDragX;
      let startTimeMs = 0;

      if (typeof dropX === 'number') {
        const rect = targetTrackElement.getBoundingClientRect();
        const relativeX = dropX - rect.left + targetTrackElement.scrollLeft;
        const trackWidth = Math.max(targetTrackElement.scrollWidth, targetTrackElement.clientWidth);
        const percentage = Math.max(0, Math.min(100, (relativeX / trackWidth) * 100));
        startTimeMs = Math.round((percentage / 100) * 60000);
      }

      // Estimate duration from loaded audio buffer (if available)
      // For groups, use the longest duration among all group members
      let durationMs = 10000;
      if (elementId !== null) {
        const audioSource = useAudioEngineStore.getState().sources.get(elementId);
        if (audioSource?.buffer) {
          durationMs = Math.round(audioSource.buffer.duration * 1000);
        }
      } else if (draggedGroupId !== null) {
        // Get group members and find the longest duration
        const groupMembers = useElementGroupStore.getState().groupMembers[draggedGroupId] || [];
        const audioSources = useAudioEngineStore.getState().sources;

        let maxDuration = 0;
        groupMembers.forEach(member => {
          const audioSource = audioSources.get(member.audio_element_id);
          if (audioSource?.buffer) {
            const memberDuration = Math.round(audioSource.buffer.duration * 1000);
            maxDuration = Math.max(maxDuration, memberDuration);
          }
        });

        // Use the longest duration found, or default to 10s if no buffers loaded yet
        durationMs = maxDuration > 0 ? maxDuration : 10000;
      }

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

      addElementToTrack(targetTrackId, elementId, draggedGroupId, startTimeMs, durationMs)
        .then(() => {
          success(
            `Adicionado à trilha ${targetTrackId} (${startTimeMs}ms - duração ${durationMs}ms)`
          );
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : String(err);
          toastError('Falha ao adicionar à timeline: ' + message);
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
      <div className="w-80 flex-shrink-0 border-r border-white/5 bg-[#0f0f15] shadow-2xl z-10 hidden md:flex md:flex-col">
        <SoundSetBrowser />
        <div className="p-4 border-t border-white/5 mt-auto">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground/70 hover:text-foreground hover:bg-white/5 rounded-md transition-colors"
          >
            <Settings size={16} />
            <span>App Settings</span>
          </button>
        </div>
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

      {/* Right Sidebar */}
      <div className="z-10 hidden xl:block shadow-[-10px_0_30px_rgba(0,0,0,0.5)] bg-[#0f0f15]">
        <ChannelSidebar />
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

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
