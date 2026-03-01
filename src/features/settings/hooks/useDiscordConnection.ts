import { useCallback, useRef } from 'react';

import { invoke } from '@tauri-apps/api/core';

import { useDiscordStore } from '../stores/discordStore';

export interface DiscordUser {
  id: string;
  username: string;
  avatar: string | null;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
}

export interface DiscordChannel {
  id: string;
  name: string;
  type: number;
}

export function useDiscordConnection() {
  const {
    isValidating,
    setIsValidating,
    botUser,
    setBotUser,
    guilds,
    setGuilds,
    channels,
    setChannels,
    error,
    setError,
  } = useDiscordStore();

  const lastValidatedTokenRef = useRef<string | null>(null);

  const validateToken = useCallback(
    async (token: string) => {
      if (!token) return false;

      if (token === lastValidatedTokenRef.current && botUser && guilds.length > 0) {
        setError(null);
        return true;
      }

      setIsValidating(true);
      setError(null);
      try {
        const user = await invoke<DiscordUser>('discord_validate_token', { token });
        setBotUser(user);

        const guildList = await invoke<DiscordGuild[]>('discord_list_guilds', { token });
        setGuilds(guildList);
        lastValidatedTokenRef.current = token;
        return true;
      } catch (err) {
        console.error('Discord validation error:', err);
        setError(String(err));
        setBotUser(null);
        setGuilds([]);
        lastValidatedTokenRef.current = null;
        return false;
      } finally {
        setIsValidating(false);
      }
    },
    [botUser, guilds.length, setBotUser, setError, setGuilds, setIsValidating]
  );

  const loadChannels = useCallback(
    async (token: string, guildId: string) => {
      if (!token || !guildId) return;
      try {
        const channelList = await invoke<DiscordChannel[]>('discord_list_voice_channels', {
          token,
          guildId,
        });
        setChannels(channelList);
      } catch (err) {
        console.error('Failed to load channels:', err);
        setError(String(err));
        setChannels([]);
      }
    },
    [setChannels, setError]
  );

  return {
    isValidating,
    botUser,
    guilds,
    channels,
    error,
    validateToken,
    loadChannels,
    clearError: () => setError(null),
    setBotUser,
    setGuilds,
    setChannels,
  };
}
