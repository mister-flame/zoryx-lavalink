# Zoryx Lavalink Bot

A French Discord music bot built with `discord.js`, `lavalink-client`, and SQLite. It plays music via Lavalink and automatically manages temporary voice channels.

## Features

- Lavalink-based music playback for Discord voice channels
- Search and play songs from YouTube links or search queries
- Queue management with skip, stop, shuffle, loop, replay, and seek
- Now playing and bot latency commands
- Automatic creation of temporary voice channels from configured main channels
- Automatic deletion of empty temporary channels using SQLite
- Configurable command prefix, embed color, webhook notifications, and Lavalink node settings

## Requirements

- Node.js 18 or newer
- A Lavalink server reachable by the bot
- A Discord bot token
- SQLite database file for temporary channel management

## Installation

1. Install dependencies:

```bash
npm install
```

2. Create and configure `config.json` in the repository root.

3. Start the bot:

```bash
node index.js
```

## Configuration

The bot loads configuration from `config.json` if present, otherwise it falls back to environment variables.

Example `config.json`:

```json
{
  "token": "YOUR_DISCORD_BOT_TOKEN",
  "prefix": "?",
  "COLOR_EMBED": "#6102cc",
  "START_WEBHOOK": "https://discord.com/api/webhooks/your-webhook-url",
  "dbPath": "./databases/tcDB.db",
  "node": {
    "authorization": "YOUR_LAVALINK_PASSWORD",
    "host": "lavalink.example.com",
    "port": 443,
    "id": "Test Node",
    "secure": true,
    "nodeType": "youtube",
    "retryDelay": 2000,
    "retryTimespan": 10,
    "autoReconnect": true,
    "requestTimoutMS": 15000
  }
}
```

### Config keys

- `token`: Discord bot token.
- `prefix`: Command prefix used by the bot (example: `?`).
- `COLOR_EMBED`: Hex color code used for bot embeds.
- `START_WEBHOOK`: Discord webhook URL used for startup notifications.
- `dbPath`: Path to the SQLite database file used for temp channel tracking.
- `node`: Lavalink node configuration object.
  - `authorization`: Lavalink password.
  - `host`: Lavalink host address.
  - `port`: Lavalink port.
  - `id`: Node identifier.
  - `secure`: Whether to use TLS/HTTPS.
  - `nodeType`: Node platform type (for example `youtube`).
  - `retryDelay`: Delay between reconnection attempts in milliseconds.
  - `retryTimespan`: Number of retry attempts.
  - `autoReconnect`: Whether the Lavalink node should reconnect automatically.
  - `requestTimoutMS`: Request timeout in milliseconds.

## Commands

All commands use the configured prefix.

- `prefix + help` - Show available commands.
- `prefix + ping` - Show bot latency and Lavalink node latency.
- `prefix + play <link or search>` - Play a song or add it to the queue.
- `prefix + skip [number]` - Skip the current track or skip ahead by the given number of tracks.
- `prefix + stop` - Stop playback and clear the queue.
- `prefix + leave` - Disconnect the bot from the voice channel.
- `prefix + loop <track|queue|off>` - Set the repeat mode for the current track or queue.
- `prefix + queue` - Display the current queue and the next tracks.
- `prefix + replay` - Replay the current track.
- `prefix + nowplaying` - Show the currently playing track and progress.
- `prefix + shuffle` - Shuffle the queue.
- `prefix + seek <duration>` - Seek to a specific position in the current track.

### Notes on commands

- `play` supports individual YouTube video links and search queries.
- Playlists or non-YouTube platforms are not fully supported by the current implementation.
- `seek` accepts formats like `1m30s`, `90s`, `1:00`, or `1:00:00`.

## How it works

### `index.js`

- Creates the Discord client with required intents.
- Loads event handlers dynamically from `events/`.
- Logs in using the token from configuration.

### `events/clientReady.js`

- Initializes the `LavalinkManager` with the configured node.
- Registers Lavalink event listeners.
- Sets periodic bot activity updates.
- Sends a startup embed to the configured webhook.
- Cleans up leftover temporary voice channels on startup.

### `events/messageCreate.js`

- Handles command parsing and bot responses.
- Creates or retrieves a Lavalink player per guild.
- Manages playback, queue, loop, shuffle, seek, and metadata embeds.

### `events/voiceStateUpdate.js`

- Creates temporary voice channels when a user joins a configured main voice channel.
- Deletes temporary channels when they become empty.
- Stores channel references in SQLite for cleanup.

## Project structure

- `index.js` - Bot initialization and event loader.
- `events/` - Discord event handlers.
- `functions/` - Helper functions for Lavalink, database access, channel cleanup, and formatting.
- `lavalink-events/` - Lavalink-specific event handlers.
- `util/config.js` - Configuration loader supporting `config.json` and environment variables.
- `databases/` - Local SQLite database files.

## Notes

- Make sure Lavalink is running and accessible before starting the bot.
- `config.json` is optional, but recommended for local development.
- The bot uses SQLite to persist temp channel state so deleted channels are tracked correctly.

## License

Licensed under `ISC`.
