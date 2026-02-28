import { useMemo, useState } from 'react';

import { Droppable, Draggable } from '@hello-pangea/dnd';
import { AnimatePresence, motion } from 'framer-motion';
import { Layers, ChevronDown } from 'lucide-react';
import { createPortal } from 'react-dom';

import { IconPause, IconPlay, IconTrash } from '../../../shared/components/Icons';
import { Tooltip } from '../../../shared/components/Tooltip';
import { useToast } from '../../../shared/hooks/useToast';
import { cn } from '../../../shared/utils/cn';
import { useMixerStore, ChannelType } from '../../mixer/stores/mixerStore';
import {
  ElementGroup,
  ElementGroupMember,
  useElementGroupStore,
} from '../../sound-sets/stores/elementGroupStore';
import { AudioElement } from '../../sound-sets/stores/soundSetStore';
import { useAudioEngineStore } from '../stores/audioEngineStore';

interface ElementGroupCardProps {
  group: ElementGroup;
  members: ElementGroupMember[];
  audioElements: AudioElement[];
  mode: 'mixing' | 'one-shot';
}

export function ElementGroupCard({ group, members, audioElements, mode }: ElementGroupCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { deleteGroup, removeElementFromGroup } = useElementGroupStore();
  const { play, pause, stop, sources } = useAudioEngineStore();
  const { channels, setChannelVolume } = useMixerStore();
  const { success, error } = useToast();

  // Find all actual audio elements for the members
  const memberElements = useMemo(() => {
    return members
      .map(m => audioElements.find(a => a.id === m.audio_element_id))
      .filter((a): a is AudioElement => a !== undefined);
  }, [members, audioElements]);

  // Determine if any member is currently playing
  const playingMemberSet = useMemo(() => {
    const playingIds = new Set<number>();
    for (const el of memberElements) {
      if (sources.get(el.id)?.isPlaying) {
        playingIds.add(el.id);
      }
    }
    return playingIds;
  }, [memberElements, sources]);

  const isPlaying = playingMemberSet.size > 0;

  // We need to use the first element's channel type for volume control as a simplification
  const primaryChannelType = memberElements[0]?.channel_type || 'sfx';
  const channelInfo = channels[primaryChannelType as ChannelType] || {
    volume: 80,
    isMuted: false,
    isSoloed: false,
  };

  const handleDelete = async () => {
    try {
      if (mode === 'mixing') {
        playingMemberSet.forEach(id => stop(id));
      }
      await deleteGroup(group.id);
      success(`Grupo "${group.name}" removido`);
    } catch {
      error('Falha ao remover grupo');
    }
  };

  const handleRemoveMember = async (e: React.MouseEvent, memberId: number) => {
    e.stopPropagation();
    try {
      await removeElementFromGroup(memberId, group.id);
    } catch {
      error('Falha ao remover áudio do grupo');
    }
  };

  const handlePrimaryAction = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (memberElements.length === 0) {
      error('O grupo está vazio');
      return;
    }

    if (isPlaying && mode !== 'one-shot') {
      playingMemberSet.forEach(id => pause(id));
      return;
    }

    // Play a random element (using store logic if possible, or just random here)
    // To respect 'no-immediate-repeat', we should pick randomly
    const pickRandom = () => {
      if (memberElements.length === 1) return memberElements[0].id;
      // Simplest random choice for UI manual triggers
      const idx = Math.floor(Math.random() * memberElements.length);
      return memberElements[idx].id;
    };

    play(pickRandom());
  };

  return (
    <Droppable droppableId={`group-${group.id}`} direction="horizontal" isDropDisabled={false}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={cn(
            'relative group/groupCard transition-all h-full',
            snapshot.isDraggingOver &&
              'ring-2 ring-purple-500 ring-offset-2 ring-offset-[#0a0a0f] rounded-xl scale-[1.02]'
          )}
        >
          {/* Background stacked layers to indicate group */}
          <div className="absolute top-2 left-2 right-[-8px] bottom-[-8px] bg-[#1a1a25]/60 border border-white/[0.05] rounded-xl -z-20 rotate-1 scale-[0.98]" />
          <div className="absolute top-1 left-1 right-[-4px] bottom-[-4px] bg-[#1a1a25]/80 border border-white/[0.05] rounded-xl -z-10 -rotate-1 scale-[0.99]" />

          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className={cn(
              'border rounded-xl transition-all relative overflow-hidden cursor-pointer flex flex-col',
              isPlaying
                ? 'border-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.3)] bg-gradient-to-br from-[#1a1a25] to-purple-900/30'
                : 'border-white/[0.1] bg-[#1a1a25]'
            )}
          >
            <div className="p-3 flex items-center justify-between min-h-[80px] gap-3">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handlePrimaryAction}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg shrink-0 z-10',
                  isPlaying
                    ? 'bg-purple-400 text-black shadow-[0_0_15px_rgba(168,85,247,0.6)]'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-purple-500/50'
                )}
              >
                {mode === 'mixing' && isPlaying ? (
                  <IconPause className="w-5 h-5" />
                ) : (
                  <IconPlay className="w-5 h-5 ml-0.5" />
                )}
              </motion.button>

              <div className="flex-1 flex flex-col justify-center min-w-0 z-10">
                <Tooltip
                  content={
                    <div className="space-y-1">
                      <p className="font-bold text-gray-200">{group.name}</p>
                      <div className="text-xs text-gray-400">
                        {members.length} {members.length === 1 ? 'elemento' : 'elementos'}
                      </div>
                      <div className="mt-2 text-[10px] text-gray-500 max-w-[200px] truncate flex flex-col gap-1">
                        {memberElements.slice(0, 3).map(el => (
                          <span key={el.id}>• {el.file_name.split('.')[0]}</span>
                        ))}
                        {memberElements.length > 3 && (
                          <span>• e mais {memberElements.length - 3}...</span>
                        )}
                      </div>
                    </div>
                  }
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <p
                      className="text-[12px] font-bold text-gray-300 truncate w-full"
                      title={group.name}
                    >
                      {group.name}
                    </p>
                  </div>
                </Tooltip>

                <div className="flex items-center gap-2 mt-1 relative">
                  <span className="text-[10px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                    {members.length} itens (RND)
                  </span>

                  <button
                    onClick={event => {
                      event.stopPropagation();
                      setIsExpanded(!isExpanded);
                    }}
                    className="p-1 text-gray-400 hover:text-white transition-colors"
                    title={isExpanded ? 'Ocultar áudios' : 'Ver áudios'}
                  >
                    <ChevronDown
                      className={cn('w-3.5 h-3.5 transition-transform', isExpanded && 'rotate-180')}
                    />
                  </button>

                  <button
                    onClick={event => {
                      event.stopPropagation();
                      void handleDelete();
                    }}
                    className="p-1 text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover/groupCard:opacity-100"
                    title="Remove Group"
                  >
                    <IconTrash className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="w-20 lg:w-24 flex items-center gap-2 group/slider shrink-0 z-10 pr-1">
                <div className="flex-1 relative h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                  <motion.div
                    className={cn(
                      'absolute top-0 left-0 bottom-0 transition-all duration-75',
                      isPlaying
                        ? 'bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                        : 'bg-gray-700'
                    )}
                    style={{ width: `${channelInfo.volume}%` }}
                  />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={channelInfo.volume}
                    onChange={event =>
                      setChannelVolume(
                        primaryChannelType as ChannelType,
                        Number(event.target.value)
                      )
                    }
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <span className="text-[9px] font-bold text-gray-500 w-5 text-right">
                  {channelInfo.volume}
                </span>
              </div>
            </div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-white/5 bg-black/20"
                >
                  <div className="p-2 flex flex-col gap-1 max-h-[150px] overflow-y-auto custom-scrollbar">
                    {members.length === 0 && (
                      <div className="text-xs text-center text-gray-500 p-2">Grupo vazio</div>
                    )}
                    {members.map((member, index) => {
                      const el = audioElements.find(a => a.id === member.audio_element_id);
                      if (!el) return null;
                      return (
                        <Draggable
                          key={`member-${member.id}`}
                          draggableId={`member-${member.id}-audio-${el.id}-group-${group.id}`}
                          index={index}
                        >
                          {(dragProvided, dragSnapshot) => {
                            const child = (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                style={{
                                  ...dragProvided.draggableProps.style,
                                  opacity: dragSnapshot.isDragging ? 0.8 : 1,
                                  zIndex: dragSnapshot.isDragging ? 50 : 1,
                                }}
                                className={cn(
                                  'flex flex-row justify-between items-center p-1.5 rounded group/member w-[240px]',
                                  dragSnapshot.isDragging
                                    ? 'bg-[#35254a] shadow-xl'
                                    : 'hover:bg-white/5'
                                )}
                              >
                                <span className="text-[11px] text-gray-300 truncate pr-2">
                                  {el.file_name}
                                </span>
                                <button
                                  onClick={e => void handleRemoveMember(e, member.id)}
                                  className="p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover/member:opacity-100 transition-all shrink-0 cursor-pointer"
                                  title="Remover áudio"
                                >
                                  <IconTrash className="w-3 h-3" />
                                </button>
                              </div>
                            );

                            if (dragSnapshot.isDragging) {
                              return createPortal(child, document.body);
                            }

                            return child;
                          }}
                        </Draggable>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          <div className="hidden">{provided.placeholder}</div>
        </div>
      )}
    </Droppable>
  );
}
