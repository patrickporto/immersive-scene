import { IconMusic, IconLayers, IconCloud, IconZap } from '../../../shared/components/Icons';
import { useAudioEngineStore } from '../../audio-engine/stores/audioEngineStore';
import { useSoundSetStore } from '../../sound-sets/stores/soundSetStore';

export function getChannelIcon(iconId: string) {
  switch (iconId) {
    case 'music':
      return <IconMusic className="w-5 h-5" />;
    case 'ambient':
      return <IconCloud className="w-5 h-5" />;
    case 'sfx':
      return <IconZap className="w-5 h-5" />;
    default:
      return <IconLayers className="w-5 h-5" />;
  }
}

export default function ChannelSidebar() {
  const { channels, selectedSoundSet } = useSoundSetStore();
  const { setChannelVolume } = useAudioEngineStore();

  if (!selectedSoundSet) return null;

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] border-l border-white/5 py-6">
      <div className="px-6 mb-6">
        <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Channels</h2>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 space-y-3">
        {channels.map(channel => (
          <div
            key={channel.id}
            className="bg-[#1a1a25]/50 hover:bg-[#1a1a25] border border-white/5 border-dashed p-4 rounded-xl flex flex-col gap-4 transition-colors group"
          >
            <div className="flex items-center gap-3 text-cyan-400">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors flex items-center justify-center shrink-0">
                {getChannelIcon(channel.icon)}
              </div>
              <div className="font-bold flex-1 truncate text-white text-sm">{channel.name}</div>
            </div>

            <div className="px-1">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                defaultValue={channel.volume}
                onChange={e => {
                  setChannelVolume(channel.id, parseFloat(e.target.value));
                }}
                onMouseUp={e => {
                  useSoundSetStore
                    .getState()
                    .updateChannel(
                      channel.id,
                      channel.name,
                      channel.icon,
                      parseFloat((e.target as HTMLInputElement).value)
                    );
                }}
                className="w-full h-1 bg-white/10 rounded-full appearance-none outline-none cursor-pointer slider-thumb-cyan"
              />
              <style>{`
                 .slider-thumb-cyan::-webkit-slider-thumb {
                   appearance: none;
                   width: 12px;
                   height: 12px;
                   border-radius: 50%;
                   background: #06b6d4;
                   cursor: pointer;
                   box-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
                 }
               `}</style>
            </div>
          </div>
        ))}
        {channels.length === 0 && (
          <div className="text-gray-500 text-sm text-center mt-10 italic">No channels exist.</div>
        )}
      </div>
    </div>
  );
}
