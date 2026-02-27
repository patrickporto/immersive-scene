import { useEffect, useState } from 'react';

import { open } from '@tauri-apps/plugin-dialog';
import { readFile } from '@tauri-apps/plugin-fs';
import { motion } from 'framer-motion';

import { GlobalOneShotCard } from './GlobalOneShotCard';
import { IconPlay, IconFolder } from '../../../shared/components/Icons';
import { useToast } from '../../../shared/hooks/useToast';
import { cn } from '../../../shared/utils/cn';
import { ElementGroupCard } from '../../audio-engine/components/ElementGroupCard';
import { useAudioEngineStore } from '../../audio-engine/stores/audioEngineStore';
import { useElementGroupStore } from '../stores/elementGroupStore';
import { useGlobalOneShotStore } from '../stores/globalOneShotStore';

const VALID_EXTENSIONS = ['.ogg', '.mp3', '.wav', '.flac'];

export function GlobalOneShotsSection() {
  const { globalOneShots, loadGlobalOneShots, createGlobalOneShot } = useGlobalOneShotStore();
  const { groups, groupMembers, loadGroups, createGroup } = useElementGroupStore();
  const { initAudioContext, loadAudioFile } = useAudioEngineStore();
  const { success, error } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  useEffect(() => {
    void loadGlobalOneShots();
    void loadGroups(null);
  }, [loadGlobalOneShots, loadGroups]);

  const handleCreateOneShot = async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [{ name: 'Audio Files', extensions: ['ogg', 'mp3', 'wav', 'flac'] }],
      });
      if (!selected) return;

      const files = Array.isArray(selected) ? selected : [selected];
      const validFiles = files.filter(filePath => {
        const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || 'unknown';
        const extension = `.${fileName.split('.').pop()?.toLowerCase()}`;
        return VALID_EXTENSIONS.includes(extension);
      });

      if (validFiles.length === 0) return;

      setIsUploading(true);
      await initAudioContext();

      let uploadCount = 0;

      for (const filePath of validFiles) {
        const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || 'unknown';

        try {
          const fileData = await readFile(filePath);
          const newElement = await createGlobalOneShot(filePath, fileName, 'ambient');

          await loadAudioFile(newElement, fileData.buffer.slice(0));
          uploadCount += 1;
        } catch (processError) {
          console.error('Failed to process file:', processError);
        }
      }

      await loadGlobalOneShots();

      if (uploadCount > 0) {
        success(`Successfully uploaded ${uploadCount} global one-shot(s)`);
      } else {
        error('Could not upload the selected files');
      }
    } catch (err) {
      console.error('File selection failed:', err);
      error('Failed to select file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const group = await createGroup(newGroupName.trim(), null);
    if (group) {
      success('Global group created');
      setIsCreatingGroup(false);
      setNewGroupName('');
      void loadGroups(null);
    } else {
      error('Failed to create global group');
    }
  };

  return (
    <div className="pt-6 border-t border-white/5 bg-black/20 p-6 lg:p-8 transition-colors">
      <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500" />
        Global One-Shots (Available Everywhere)
      </h4>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3">
        <motion.div
          layout
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => void handleCreateOneShot()}
          className={cn(
            'bg-[#1a1a25]/50 border border-dashed border-white/10 rounded-xl px-4 py-3 flex items-center justify-start h-[80px] transition-all cursor-pointer group hover:border-fuchsia-500/50 hover:bg-fuchsia-500/5 gap-4',
            isUploading && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isUploading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-5 h-5 rounded-full border-t-2 border-r-2 border-fuchsia-500 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 group-hover:bg-fuchsia-500/10 transition-colors shrink-0">
              <IconPlay className="w-5 h-5 text-gray-500 group-hover:text-fuchsia-400 transition-colors ml-0.5" />
            </div>
          )}
          <div className="flex-1 text-left min-w-0">
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-fuchsia-400 transition-colors truncate">
              {isUploading ? 'Uploading...' : 'Add Global One-Shot'}
            </div>
            <div className="text-[9px] text-gray-600 truncate mt-0.5">
              {isUploading ? 'Please wait' : 'Click to upload files'}
            </div>
          </div>
        </motion.div>

        {!isCreatingGroup ? (
          <motion.div
            layout
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsCreatingGroup(true)}
            className="bg-[#1a1a25]/50 border border-dashed border-white/10 rounded-xl px-4 py-3 flex items-center justify-start h-[80px] transition-all cursor-pointer group hover:border-purple-500/50 hover:bg-purple-500/5 gap-4"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 group-hover:bg-purple-500/10 transition-colors shrink-0">
              <IconFolder className="w-5 h-5 text-gray-500 group-hover:text-purple-400 transition-colors" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-purple-400 transition-colors truncate">
                Create Global Group
              </div>
              <div className="text-[9px] text-gray-600 truncate mt-0.5">
                Group one-shots for random playback
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.form
            layout
            onSubmit={handleCreateGroup}
            className="bg-[#1a1a25] border border-purple-500/30 rounded-xl p-3 flex flex-col justify-center h-[80px] gap-2 shadow-[0_0_15px_rgba(168,85,247,0.1)]"
          >
            <input
              autoFocus
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              placeholder="Group Name..."
              className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!newGroupName.trim()}
                className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-[10px] font-bold py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingGroup(false);
                  setNewGroupName('');
                }}
                className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 text-[10px] font-bold py-1 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.form>
        )}

        {groups
          .filter(g => g.sound_set_id === null)
          .map(group => (
            <div key={`global-group-${group.id}`} className="h-full">
              <ElementGroupCard
                group={group}
                members={groupMembers[group.id] || []}
                audioElements={globalOneShots}
                mode="one-shot"
              />
            </div>
          ))}

        {globalOneShots.map(element => (
          <GlobalOneShotCard key={element.id} element={element} />
        ))}
      </div>
    </div>
  );
}
