import { create } from 'zustand';

import { DiscordUser, DiscordGuild, DiscordChannel } from '../hooks/useDiscordConnection';

interface DiscordState {
  isValidating: boolean;
  botUser: DiscordUser | null;
  guilds: DiscordGuild[];
  channels: DiscordChannel[];
  error: string | null;

  setIsValidating: (isValidating: boolean) => void;
  setBotUser: (botUser: DiscordUser | null) => void;
  setGuilds: (guilds: DiscordGuild[]) => void;
  setChannels: (channels: DiscordChannel[]) => void;
  setError: (error: string | null) => void;
}

export const useDiscordStore = create<DiscordState>(set => ({
  isValidating: false,
  botUser: null,
  guilds: [],
  channels: [],
  error: null,

  setIsValidating: isValidating => set({ isValidating }),
  setBotUser: botUser => set({ botUser }),
  setGuilds: guilds => set({ guilds }),
  setChannels: channels => set({ channels }),
  setError: error => set({ error }),
}));
