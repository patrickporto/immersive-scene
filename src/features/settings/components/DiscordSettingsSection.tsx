import React, { useEffect, useState } from 'react';

import { useDiscordConnection } from '../hooks/useDiscordConnection';
import { useSettingsStore } from '../stores/settingsStore';

export function DiscordSettingsSection() {
  const { settings, updateSettings } = useSettingsStore();

  const [token, setToken] = useState<string>(settings.discord_bot_token || '');
  const [guildId, setGuildId] = useState<string>(settings.discord_guild_id || '');
  const [channelId, setChannelId] = useState<string>(settings.discord_channel_id || '');

  const {
    isValidating,
    botUser,
    guilds,
    channels,
    error,
    validateToken,
    loadChannels,
    clearError,
  } = useDiscordConnection();

  useEffect(() => {
    setToken(settings.discord_bot_token);
    setGuildId(settings.discord_guild_id);
    setChannelId(settings.discord_channel_id);

    if (settings.discord_bot_token) {
      validateToken(settings.discord_bot_token).then(success => {
        if (success && settings.discord_guild_id) {
          loadChannels(settings.discord_bot_token, settings.discord_guild_id);
        }
      });
    }
  }, [
    settings.discord_bot_token,
    settings.discord_guild_id,
    settings.discord_channel_id,
    validateToken,
    loadChannels,
  ]);

  const handleValidate = async () => {
    const success = await validateToken(token);
    if (!success) {
      setGuildId('');
      setChannelId('');
    }
  };

  const handleSaveConfig = async () => {
    await updateSettings({
      ...settings,
      discord_bot_token: token,
      discord_guild_id: guildId,
      discord_channel_id: channelId,
    });
  };

  const handleClear = async () => {
    setToken('');
    setGuildId('');
    setChannelId('');
    await updateSettings({
      ...settings,
      discord_bot_token: '',
      discord_guild_id: '',
      discord_channel_id: '',
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-foreground/80 flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 127.14 96.36"
          className="w-4 h-4 fill-[#5865F2]"
        >
          <path d="M107.7 8.07A105.15 105.15 0 0081.47 0a72.06 72.06 0 00-3.36 6.83 97.68 97.68 0 00-29.08 0A72.37 72.37 0 0045.67 0a105.46 105.46 0 00-26.23 8.09C-2.04 40.23-2.9 71.32 16.48 96.36a105.74 105.74 0 0032.22 16.3 77.7 77.7 0 006.89-11.23 68.42 68.42 0 01-10.85-5.18c.91-.67 1.8-1.37 2.65-2.08a74.14 74.14 0 0049.26 0c.85.71 1.74 1.41 2.66 2.08a68.61 68.61 0 01-10.87 5.17 77.29 77.29 0 006.89 11.23 105.44 105.44 0 0032.24-16.3c20.44-26.89 17.5-56.12-2.19-88.29zM42.66 65.46c-5.3 0-9.64-4.86-9.64-10.83s4.25-10.83 9.64-10.83 9.68 4.86 9.64 10.83-4.34 10.83-9.64 10.83zm41.82 0c-5.3 0-9.64-4.86-9.64-10.83s4.25-10.83 9.64-10.83 9.68 4.86 9.64 10.83-4.34 10.83-9.64 10.83z" />
        </svg>
        Discord Configuration
      </h3>
      <div className="flex flex-col gap-3 p-3 rounded-lg border border-border bg-card/50">
        {error && (
          <div className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 p-2 rounded flex justify-between items-start">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="opacity-50 hover:opacity-100 flex-shrink-0 ml-2 pt-0.5"
            >
              &times;
            </button>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground font-medium">Bot Token</label>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="Paste token here..."
              value={token}
              onChange={e => setToken(e.target.value)}
              className="flex-1 bg-background border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            />
            <button
              onClick={handleValidate}
              disabled={isValidating || !token}
              className="px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary text-sm rounded-md transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {isValidating ? 'Validating...' : 'Validate'}
            </button>
          </div>
          <span className="text-[10px] text-muted-foreground opacity-70 leading-tight mt-1">
            Token is stored locally in settings.json. Keep it secure.
          </span>
        </div>

        {botUser && (
          <div className="flex items-center gap-2 mt-1 px-3 py-2 bg-background/50 rounded-md border border-white/5">
            {botUser.avatar ? (
              <img
                src={`https://cdn.discordapp.com/avatars/${botUser.id}/${botUser.avatar}.png`}
                alt=""
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                {botUser.username.charAt(0)}
              </div>
            )}
            <span className="text-sm font-medium">{botUser.username}</span>
            <span className="text-xs text-green-400 ml-auto flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse"></span>
              Verified
            </span>
          </div>
        )}

        {guilds.length > 0 && (
          <div className="flex flex-col gap-1 mt-1">
            <label className="text-xs text-muted-foreground font-medium">Server (Guild)</label>
            <select
              value={guildId}
              onChange={e => {
                setGuildId(e.target.value);
                setChannelId('');
                if (e.target.value) {
                  loadChannels(token, e.target.value);
                }
              }}
              className="bg-background border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select a server...</option>
              {guilds.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {channels.length > 0 && guildId && (
          <div className="flex flex-col gap-1 mt-1">
            <label className="text-xs text-muted-foreground font-medium">Voice Channel</label>
            <select
              value={channelId}
              onChange={e => setChannelId(e.target.value)}
              className="bg-background border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select a voice channel...</option>
              {channels.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-white/5">
          <button
            onClick={handleClear}
            disabled={!settings.discord_bot_token}
            className="px-3 py-1.5 text-xs font-medium border border-border hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 rounded-md transition-colors disabled:opacity-50"
          >
            Clear Config
          </button>
          <button
            onClick={handleSaveConfig}
            disabled={!channelId || !guildId || !token}
            className="px-3 py-1.5 text-xs font-medium bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-md transition-colors disabled:opacity-50 disabled:bg-gray-600 shadow"
          >
            Save Discord Settings
          </button>
        </div>
      </div>
    </div>
  );
}
