import { Draggable, Droppable } from '@hello-pangea/dnd';
import { AnimatePresence, motion } from 'framer-motion';

import { AudioElementCard } from './AudioElementCard';
import { IconPlay } from '../../../shared/components/Icons';
import { cn } from '../../../shared/utils/cn';
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
  const { audioElements } = useSoundSetStore();
  const { isUploading, handleUpload } = useAudioUploader({ soundSetId });

  const mixingElements = audioElements.filter(element => element.channel_type !== 'effects');
  const oneShotElements = audioElements.filter(element => element.channel_type === 'effects');

  return (
    <div className="flex flex-col h-full space-y-6 p-8 max-w-[1600px] mx-auto w-full">
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
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
                onClick={() => void handleUpload()}
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
                {mixingElements.map((element, index) => (
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
                        <AudioElementCard element={element} mode="mixing" />
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
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3">
              {oneShotElements.map(element => (
                <AudioElementCard key={element.id} element={element} mode="one-shot" />
              ))}

              {oneShotElements.length === 0 && (
                <div className="text-[10px] text-gray-600 italic py-2 grid-col-span-full text-center border-2 border-dashed border-white/10 rounded-xl">
                  Drop audio elements here to add them as 1-shot soundboard effects
                </div>
              )}
              {provided.placeholder}
            </div>
          </div>
        )}
      </Droppable>
    </div>
  );
}
