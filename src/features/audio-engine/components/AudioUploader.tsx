import { useState, useEffect } from 'react';

import { Draggable, Droppable } from '@hello-pangea/dnd';
import { AnimatePresence, motion } from 'framer-motion';

import { AudioElementCard } from './AudioElementCard';
import { ElementGroupCard } from './ElementGroupCard';
import { Modal } from '../../../shared/components';
import { IconPlay, IconMusic, IconPlus, IconCheck } from '../../../shared/components/Icons';
import { cn } from '../../../shared/utils/cn';
import { GlobalOneShotsSection } from '../../sound-sets/components/GlobalOneShotsSection';
import { useElementGroupStore } from '../../sound-sets/stores/elementGroupStore';
import { useSoundSetStore } from '../../sound-sets/stores/soundSetStore';
import { useAudioUploader } from '../hooks/useAudioUploader';

interface AudioUploaderProps {
  soundSetId: number;
  moodId: number;
}

/**
 * @description Uploads audio files and organizes elements between timeline and one-shot zones.
 * @param props - Component properties.
 * @param props.soundSetId - Active sound set identifier.
 * @returns Audio uploader workspace.
 */
export function AudioUploader({ soundSetId: _soundSetId, moodId: _moodId }: AudioUploaderProps) {
  const { soundSets, audioElements, channels, selectedSoundSetIds } = useSoundSetStore();
  const { isUploading, selectFiles, processUpload } = useAudioUploader();
  const { groups, groupMembers, loadGroups, loadGroupMembers } = useElementGroupStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<string[]>([]);
  const [step, setStep] = useState<'soundset' | 'channel'>('soundset');
  const [targetSoundSetId, setTargetSoundSetId] = useState<number | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);

  const handleUploadClick = async () => {
    const files = await selectFiles();
    if (files.length > 0) {
      setPendingFiles(files);
      setStep('soundset');
      setIsModalOpen(true);
    }
  };

  const handleSoundSetSelect = (id: number) => {
    setTargetSoundSetId(id);
    // Auto-advance with a slight delay for feedback
    setTimeout(() => setStep('channel'), 300);
  };

  const handleConfirmUpload = async () => {
    if (!targetSoundSetId) return;
    setIsModalOpen(false);
    await processUpload(pendingFiles, targetSoundSetId, selectedChannelId);
    setPendingFiles([]);
    setTargetSoundSetId(null);
    setSelectedChannelId(null);
  };

  const handleCancelUpload = () => {
    setIsModalOpen(false);
    setPendingFiles([]);
    setTargetSoundSetId(null);
    setSelectedChannelId(null);
  };

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    groups.forEach(g => {
      if (!groupMembers[g.id]) {
        void loadGroupMembers(g.id);
      }
    });
  }, [groups, groupMembers, loadGroupMembers]);

  const isElementInAnyGroup = (elementId: number) => {
    return Object.values(groupMembers).some(members =>
      members.some(m => m.audio_element_id === elementId)
    );
  };

  const mixingElements = audioElements.filter(
    element =>
      element.channel_type !== 'effects' &&
      !isElementInAnyGroup(element.id) &&
      (element.sound_set_id === null || selectedSoundSetIds.includes(element.sound_set_id))
  );

  const visualGroups = groups.filter(
    g => g.sound_set_id !== null && selectedSoundSetIds.includes(g.sound_set_id)
  );
  const groupOffset = visualGroups.length;

  return (
    <div className="flex flex-col h-full space-y-6 p-8 max-w-[1600px] mx-auto w-full">
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <div className="flex items-center justify-between mb-6 px-4">
          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
            Mixing Elements ({audioElements.length})
          </h4>
        </div>

        <Droppable
          droppableId="mixing-elements"
          direction="horizontal"
          isDropDisabled={false}
          isCombineEnabled={true}
        >
          {(provided, snapshot) => (
            <div
              className={cn(
                'grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3 p-2 rounded-xl transition-all border-2 border-transparent',
                snapshot.isDraggingOver &&
                  'border-cyan-500/50 bg-cyan-500/5 shadow-[inset_0_0_20px_rgba(0,212,255,0.1)]'
              )}
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              <motion.div
                layout
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => void handleUploadClick()}
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
                {visualGroups.map((group, index) => (
                  <Draggable
                    key={`group-${group.id}`}
                    draggableId={`group-${group.id}`}
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
                        <ElementGroupCard
                          group={group}
                          members={groupMembers[group.id] || []}
                          audioElements={audioElements}
                          mode="mixing"
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
              </AnimatePresence>

              <AnimatePresence mode="popLayout">
                {mixingElements.map((element, index) => (
                  <Draggable
                    key={element.id.toString()}
                    draggableId={element.id.toString()}
                    index={index + groupOffset}
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
                        <AudioElementCard
                          element={element}
                          mode="mixing"
                          isCombineTarget={!!dragSnapshot.combineTargetFor}
                        />
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

      <GlobalOneShotsSection />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCancelUpload}
        title={step === 'soundset' ? 'Select Destination' : 'Select Channel'}
        footer={
          <div className="flex justify-between items-center w-full">
            <div className="flex gap-1">
              <div
                className={cn(
                  'w-1.5 h-1.5 rounded-full transition-all',
                  step === 'soundset' ? 'bg-cyan-500 w-4' : 'bg-white/20'
                )}
              />
              <div
                className={cn(
                  'w-1.5 h-1.5 rounded-full transition-all',
                  step === 'channel' ? 'bg-cyan-500 w-4' : 'bg-white/20'
                )}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCancelUpload}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              {step === 'channel' && (
                <button
                  onClick={() => setStep('soundset')}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-white/5 hover:bg-white/10 text-white transition-all"
                >
                  Back
                </button>
              )}
              {step === 'channel' && (
                <button
                  onClick={() => void handleConfirmUpload()}
                  disabled={!targetSoundSetId}
                  className="px-6 py-2 rounded-lg bg-cyan-500 text-black font-bold text-sm hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(0,212,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Upload
                </button>
              )}
            </div>
          </div>
        }
      >
        <div className="relative min-h-[360px] overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            {step === 'soundset' ? (
              <motion.div
                key="step-soundset"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="space-y-4"
              >
                <div className="px-1">
                  <h3 className="text-lg font-bold text-white mb-1">Target SoundSet</h3>
                  <p className="text-xs text-gray-500 mb-6">
                    Where should these {pendingFiles.length} elements be stored?
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 max-h-[280px] overflow-y-auto custom-scrollbar pr-2 pb-2">
                  {soundSets.map(ss => (
                    <motion.button
                      key={ss.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSoundSetSelect(ss.id)}
                      className={cn(
                        'flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all group relative overflow-hidden',
                        targetSoundSetId === ss.id
                          ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_20px_rgba(0,212,255,0.1)]'
                          : 'border-white/5 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
                      )}
                    >
                      <div className="mb-3 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                        <IconMusic className="w-4 h-4 text-gray-400 group-hover:text-cyan-400" />
                      </div>
                      <span className="font-bold text-sm text-white truncate w-full">
                        {ss.name}
                      </span>
                      <span className="text-[10px] text-gray-500 mt-1 uppercase tracking-tight">
                        Library
                      </span>
                      {targetSoundSetId === ss.id && (
                        <motion.div
                          layoutId="active-ss-glow"
                          className="absolute inset-0 bg-cyan-500/5 pointer-events-none"
                        />
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step-channel"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="space-y-4"
              >
                <div className="px-1">
                  <h3 className="text-lg font-bold text-white mb-1">Audio Channel</h3>
                  <p className="text-xs text-gray-500 mb-6">
                    Select a Mixer channel for routing (optional).
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-[280px] overflow-y-auto custom-scrollbar pr-2 pb-2">
                  <button
                    onClick={() => setSelectedChannelId(null)}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-xl border-2 transition-all group',
                      selectedChannelId === null
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-white/5 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
                    )}
                  >
                    <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-gray-500 group-hover:border-cyan-500/50 transition-all">
                      <IconPlus className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-bold text-sm text-white">No Channel</div>
                      <div className="text-[10px] text-gray-500">
                        Elements will use default routing
                      </div>
                    </div>
                  </button>

                  {channels.map(ch => (
                    <button
                      key={ch.id}
                      onClick={() => setSelectedChannelId(ch.id)}
                      className={cn(
                        'flex items-center gap-4 p-4 rounded-xl border-2 transition-all group',
                        selectedChannelId === ch.id
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-white/5 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
                      )}
                    >
                      <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center overflow-hidden">
                        <div className="w-full h-full flex items-center justify-center gap-[1px]">
                          {[0.4, 0.7, 0.5, 0.8, 0.3].map((h, i) => (
                            <motion.div
                              key={i}
                              animate={{
                                height: selectedChannelId === ch.id ? `${h * 60}%` : '20%',
                              }}
                              className="w-1 bg-cyan-500/50 rounded-full"
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-bold text-sm text-white">{ch.name}</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-tighter">
                          Mixer Node
                        </div>
                      </div>
                      {selectedChannelId === ch.id && (
                        <IconCheck className="w-5 h-5 text-cyan-400" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Modal>
    </div>
  );
}
