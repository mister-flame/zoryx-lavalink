# Zoryx Lavalink

Zoryx Lavalink is a French Discord music bot built with TypeScript, `discord.js`, `lavalink-client`, and SQLite. It plays music through Lavalink and can create temporary voice channels for members who join configured main channels.

## Features

- Music playback through a Lavalink node.
- Search or play tracks from a query or URL.
- Queue controls: skip, stop, shuffle, loop, replay, seek, and queue display.
- Now-playing and latency information.
- Temporary voice-channel creation and cleanup.
- SQLite persistence for temporary-channel tracking.
- Global Discord slash-command registration at startup.

## Requirements

- Node.js 18 or newer.
- A Discord application and bot token.
- A running Lavalink server reachable by the bot.
- A Discord bot installation with the required permissions and intents.

## Installation

Install the dependencies from the project root:

```bash
npm install
```

Create a `config.json` file in the project root, or provide the supported values through environment variables. The configuration loader is `src/util/config.ts`.

## TypeScript compilation and launch

The source code is stored in `src/`. The `tsconfig.json` compiler configuration builds it into `dist/`:

```text
src/index.ts       -> dist/index.js
src/events/*.ts    -> dist/events/*.js
src/functions/*.ts -> dist/functions/*.js
```

Build the project with:

```bash
npm run build
```

This runs `tsc`, checks the TypeScript project, and writes compiled JavaScript files to `dist/`. It does not start the bot. The generated `dist/` directory is ignored by Git and should normally be rebuilt during deployment.

Start the compiled bot after a successful build with:

```bash
npm start
```

The `start` script runs `node .`. The `main` field in `package.json` points to `dist/index.js`, so this launches the compiled entrypoint.

For development, use:

```bash
npm run dev
```

This runs `tsx watch src/index.ts`, which executes the TypeScript source directly and restarts it when source files change. It does not create the production `dist/` output.

The production sequence is:

```bash
npm install
npm run build
npm start
```

On startup, the bot loads commands, registers them as global application commands, connects to Discord, and initializes the Lavalink manager when the client is ready.

Do not run `npm start` before `npm run build` unless a current `dist/` directory already exists.

## Configuration

`src/util/config.ts` reads values from the root `config.json` when that file exists. When it does not exist, it falls back to environment variables. The root configuration file is ignored by Git and should not be committed.

Example configuration with placeholders only:

```json
{
  "token": "DISCORD_BOT_TOKEN",
  "clientId": "DISCORD_APPLICATION_ID",
  "COLOR_EMBED": "#0099ff",
  "START_WEBHOOK": "DISCORD_STARTUP_WEBHOOK_URL",
  "LOGS_WEBHOOK": "DISCORD_LOG_WEBHOOK_URL",
  "dbPath": "./databases/tcDB.db",
  "node": {
    "authorization": "LAVALINK_PASSWORD",
    "host": "LAVALINK_HOST",
    "port": 2333,
    "id": "main",
    "secure": false,
    "nodeType": "youtube",
    "retryDelay": 2000,
    "retryTimespan": 10,
    "autoReconnect": true,
    "requestTimoutMS": 15000
  }
}
```

Configuration values:

- `token`: Discord bot token.
- `clientId`: Discord application ID used for slash-command registration.
- `COLOR_EMBED`: Default embed color.
- `START_WEBHOOK`: Webhook used for startup notifications.
- `LOGS_WEBHOOK`: Webhook used for interaction logs.
- `dbPath`: SQLite database path for temporary-channel records.
- `node`: Lavalink connection options, including host, port, authorization, TLS mode, and retry settings.

Do not commit real tokens, passwords, webhook URLs, or private hostnames. Keep local configuration outside version control where possible.

## Slash commands

Commands are registered globally and are used with `/` in Discord.

| Command | Description | Options |
| --- | --- | --- |
| `/help` | Show available commands. | None |
| `/ping` | Show Discord and Lavalink latency. | None |
| `/play` | Play or queue a track. | `query` required |
| `/skip` | Skip the current track or several tracks. | `nombre` optional, 1-10 |
| `/stop` | Stop playback and clear the queue. | None |
| `/leave` | Disconnect from the voice channel. | None |
| `/loop` | Set the loop mode. | `mode` required: `track`, `queue`, or `off` |
| `/queue` | Display the current queue. | None |
| `/replay` | Replay the current track. | None |
| `/nowplaying` | Show the current track and progress. | None |
| `/shuffle` | Shuffle the queue. | None |
| `/seek` | Seek within the current track. | `time` required |

The `/seek` command accepts values such as `1m30s`, `90s`, `1:00`, or `1:00:00`. The `/play` command enables autocomplete for search queries.

## Temporary voice channels

The `voiceStateUpdate` handler watches the configured main channels stored in the `mainChannel` SQLite table. When a member joins one, the bot creates a private temporary voice channel and moves the member into it. Empty temporary channels are removed and tracked records are cleaned up.

The database must exist at the configured `dbPath` and contain the tables expected by the channel-management functions.

## Project structure

```text
src/index.ts              Discord client, command loading, registration, and login
src/commands/              Slash commands grouped by category
src/events/                Discord event handlers
src/functions/             Lavalink, database, channel, and formatting helpers
src/lavalink-events/       Lavalink player event handlers
src/types/                 Shared TypeScript types
src/util/config.ts         Configuration loader
tsconfig.json              TypeScript compiler configuration
dist/                      Generated JavaScript output; do not edit manually
```

## Development notes

- Keep Lavalink running and reachable before starting the bot.
- Global slash-command updates can take time to appear in every Discord server.
- Slash commands are handled by `src/events/interactionCreate.ts`.
- The package currently does not define an automated test script.

## License

Licensed under the ISC license.
