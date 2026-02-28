import { useState, useEffect } from 'react';

import { Draggable, Droppable } from '@hello-pangea/dnd';
import { AnimatePresence, motion } from 'framer-motion';

import { AudioElementCard } from './AudioElementCard';
import { ElementGroupCard } from './ElementGroupCard';
import { Modal } from '../../../shared/components';
import { IconPlay } from '../../../shared/components/Icons';
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
export function AudioUploader({ soundSetId, moodId: _moodId }: AudioUploaderProps) {
  const { audioElements, channels, selectedSoundSetIds } = useSoundSetStore();
  const { isUploading, selectFiles, processUpload } = useAudioUploader({ soundSetId });
  const { groups, groupMembers, loadGroups, loadGroupMembers } = useElementGroupStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<string[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);

  const handleUploadClick = async () => {
    const files = await selectFiles();
    if (files.length > 0) {
      setPendingFiles(files);
      if (channels.length > 0) {
        setSelectedChannelId(channels[0].id);
      }
      setIsModalOpen(true);
    }
  };

  const handleConfirmUpload = async () => {
    setIsModalOpen(false);
    await processUpload(pendingFiles, selectedChannelId);
    setPendingFiles([]);
    setSelectedChannelId(null);
  };

  const handleCancelUpload = () => {
    setIsModalOpen(false);
    setPendingFiles([]);
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
        title="Upload Elements"
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={handleCancelUpload}
              className="px-4 py-2 rounded bg-zinc-800 text-white hover:bg-zinc-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleConfirmUpload()}
              className="px-4 py-2 rounded bg-cyan-500 text-black font-bold hover:bg-cyan-400 transition cursor-pointer"
            >
              Upload
            </button>
          </div>
        }
      >
        <div className="text-zinc-300">
          <p className="mb-4">
            You are about to upload {pendingFiles.length} file{pendingFiles.length > 1 ? 's' : ''}.
          </p>
          <p className="mb-2 text-sm text-gray-400">Select target channel:</p>
          <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
            {channels.map(ch => (
              <label
                key={ch.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                  selectedChannelId === ch.id
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-white/10 hover:border-white/30 bg-[#1a1a25]/50'
                )}
              >
                <input
                  type="radio"
                  name="channel"
                  value={ch.id}
                  checked={selectedChannelId === ch.id}
                  onChange={() => setSelectedChannelId(ch.id)}
                  className="hidden"
                />
                <div className="w-4 h-4 rounded-full border border-cyan-500 flex items-center justify-center shrink-0">
                  {selectedChannelId === ch.id && (
                    <div className="w-2 h-2 rounded-full bg-cyan-500" />
                  )}
                </div>
                <span className="font-bold flex-1 text-white">{ch.name}</span>
              </label>
            ))}
            {channels.length === 0 && (
              <p className="text-gray-500 italic text-sm py-2">
                No channels available. They will be added dynamically or placed loosely.
              </p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
