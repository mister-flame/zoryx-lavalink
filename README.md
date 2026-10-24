# Zoryx Lavalink

Zoryx Lavalink is a French Discord bot built with TypeScript, `discord.js`, `lavalink-client`, SQLite, and PostgreSQL. It plays music through a Lavalink server, manages temporary voice channels, stores user music favorites, and can answer questions through the Mistral API.

## Features

- Music search and playback through a Lavalink node.
- Queue controls: skip, stop, shuffle, loop, replay, seek, and queue display.
- Now-playing, Discord latency, and Lavalink latency information.
- User music favorites stored in PostgreSQL.
- Temporary voice-channel creation and cleanup, tracked in SQLite.
- `/ask` responses generated through the Mistral API.
- Global Discord slash-command registration at startup.

## Requirements

- Node.js 20 or newer.
- A Discord application and bot token.
- A running Lavalink server reachable by the bot.
- SQLite database file for temporary-channel tracking.
- PostgreSQL database and tables for the favorites commands.
- A Mistral API key to use `/ask`.
- A Discord bot installation with the `Guilds`, `GuildVoiceStates`, `GuildMessages`, and `MessageContent` intents enabled in the application settings. The bot needs permission to connect to and speak in voice channels; temporary-channel management also requires permission to manage channels and move members.

## Installation

Install the dependencies from the project root:

```bash
npm install
```

Create a `config.json` file in the project root. The configuration loader is `src/util/config.ts`. It also falls back to environment variables if the file is absent; environment variables are not loaded from a `.env` file automatically.

## TypeScript compilation and launch

The TypeScript source is stored in `src/`. The `tsconfig.json` compiler configuration builds it into `dist/`:

```text
src/index.ts                -> dist/index.js
src/commands/**/*.ts        -> dist/commands/**/*.js
src/events/*.ts             -> dist/events/*.js
src/lavalink-events/*.ts    -> dist/lavalink-events/*.js
```

Build the project with:

```bash
npm run build
```

This runs `tsc` and writes compiled JavaScript files to `dist/`. It does not start the bot. The generated `dist/` directory is ignored by Git and should be rebuilt for deployment.

Start the compiled bot after a successful build with:

```bash
npm start
```

The `start` script runs `node .`, which loads `dist/index.js` as configured in `package.json`.

For development, use:

```bash
npm run dev
```

This runs `tsx watch src/index.ts` and restarts the bot when source files change. The entry point loads commands, events, and Lavalink event handlers from `dist/`, so build first when those compiled files are missing or stale.

The production sequence is:

```bash
npm install
npm run build
npm start
```

At startup, the bot registers global application commands with Discord and logs in. When the client is ready, it initializes Lavalink and its event handlers.

## Configuration

`src/util/config.ts` reads values from the root `config.json` when that file exists, otherwise it reads the corresponding environment variables. `config.json` is ignored by Git and must not be committed with real credentials. Use JSON for structured `node` and `pool` settings.

Example configuration with placeholders:

```json
{
  "token": "DISCORD_BOT_TOKEN",
  "clientId": "DISCORD_APPLICATION_ID",
  "COLOR_EMBED": "#FF4E3A",
  "START_WEBHOOK": "DISCORD_STARTUP_WEBHOOK_URL",
  "LOGS_WEBHOOK": "DISCORD_LOG_WEBHOOK_URL",
  "ERROR_WEBHOOK": "DISCORD_ERROR_WEBHOOK_URL",
  "dbPath": "./databases/bot.sqlite",
  "API_KEY": "MISTRAL_API_KEY",
  "node": {
    "authorization": "LAVALINK_PASSWORD",
    "host": "LAVALINK_HOST",
    "port": 2333,
    "id": "main",
    "secure": false,
    "retryDelay": 2000,
    "retryTimespan": 10,
    "requestSignalTimeoutMS": 15000
  },
  "pool": {
    "host": "POSTGRES_HOST",
    "port": 5432,
    "user": "POSTGRES_USER",
    "password": "POSTGRES_PASSWORD",
    "database": "POSTGRES_DATABASE"
  }
}
```

Configuration values:

- `token` and `clientId`: Discord bot token and application ID. Both are required to start.
- `COLOR_EMBED`: Default embed color.
- `START_WEBHOOK`, `LOGS_WEBHOOK`, and `ERROR_WEBHOOK`: Discord webhooks used by the startup, interaction, and error handlers.
- `node`: Lavalink node connection options, including host, port, authorization, TLS mode, and retry settings.
- `dbPath`: Path to the SQLite database file used for temporary-channel tracking. The file must already exist; the bot does not create its schema.
- `pool`: PostgreSQL connection options used by the favorites commands.
- `API_KEY`: Mistral API key used by `/ask`.

The SQLite database must contain the `mainChannel` table with `id` and `channelId` columns, and the `tempChannel` table with `channelId` and `mainChannel` columns. The `mainChannel` table identifies the voice channels that trigger temporary-channel creation.

For favorites, provision the PostgreSQL `users` table with a `userId` column and the `favorite_tracks` table with `userId`, `trackId`, `title`, `url`, `addedAt`, `platform`, and `thumbnailUrl` columns. The application does not create or migrate these tables.

Never commit real tokens, passwords, webhook URLs, API keys, or private hostnames.

## Slash commands

Commands are registered globally at startup and are used with `/` in Discord.

| Command | Description | Options |
| --- | --- | --- |
| `/help` | Show the available commands. | None |
| `/ping` | Show Discord and Lavalink latency. | None |
| `/play` | Search for and play a track, or play your saved favorites. | `query` optional; search text or URL, with autocomplete |
| `/skip` | Skip the current track or a selected number of tracks. | `nombre` optional, 1-10 |
| `/stop` | Stop playback and clear the queue. | None |
| `/leave` | Leave the voice channel and clear the player. | None |
| `/loop` | Set the repeat mode. | `mode` required: `track`, `queue`, or `off` |
| `/queue` | Display the current queue. | None |
| `/replay` | Replay the current track. | None |
| `/nowplaying` | Show the current track and progress. | None |
| `/shuffle` | Shuffle the queue. | None |
| `/seek` | Seek within the current track. | `time` required |
| `/add_favorite` | Add a track to your favorites. | `query` required; autocomplete |
| `/delete_favorite` | Remove a track from your favorites. | `query` required; autocomplete |
| `/get_favorites` | List your saved favorite tracks. | None |
| `/ask` | Ask a question with a specified AI behavior. | `question` and `comportement` required |

The `/seek` command accepts durations such as `1m30s`, `90s`, `1:00`, or `1:00:00`; live streams cannot be repositioned. Favorite commands require a working PostgreSQL configuration and the tables described above. `/ask` requires `API_KEY`.

## Temporary voice channels

The `voiceStateUpdate` handler checks configured channels in the SQLite `mainChannel` table. When a member joins one, the bot creates a temporary voice channel in the same category, grants the member channel-management permission, and moves them into it. When a tracked temporary channel becomes empty, it is deleted and its database record is removed. On startup, the bot also checks for leftover empty temporary channels.

The SQLite file and expected tables must be created and configured before enabling this feature. The bot does not provide database migrations or a command to populate `mainChannel`.

## Project structure

```text
src/index.ts                  Discord client, command registration, and login
src/commands/fun/             AI question command
src/commands/music/           Music and favorite commands
src/commands/utility/         Help and latency commands
src/events/                   Discord event handlers
src/functions/                Lavalink, database, channel, and formatting helpers
src/classes/                  Database access and domain classes
src/lavalink-events/           Lavalink player event handlers
src/types/                    Shared TypeScript types
src/util/config.ts            Configuration loader
tsconfig.json                 TypeScript compiler configuration
dist/                         Generated JavaScript output; do not edit manually
```

## Development notes

- Keep Lavalink running and reachable before starting the bot.
- Global slash-command updates can take time to appear in every Discord server.
- Slash-command interactions are handled by `src/events/interactionCreate.ts`.
- Build before starting if `dist/` is missing or does not match the current source.
- The package does not define an automated test script.

## License

Licensed under the ISC license.
