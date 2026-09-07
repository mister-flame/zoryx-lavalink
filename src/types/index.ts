import type { Client, Collection, ColorResolvable } from "discord.js";
import { LavalinkManager, LavalinkNodeOptions } from "lavalink-client";

export type BotConfig = {
  token: string;
  clientId: string;
  COLOR_EMBED: ColorResolvable;
  dbPath: string;
  API_KEY: string;
  LOGS_WEBHOOK: string;
  START_WEBHOOK: string;
  node: LavalinkNodeOptions;
};

export type BotCommand = {
  data: {
    name: string;
    toJSON(): unknown;
  };
  cooldown?: number;
  execute: (...args: any[]) => unknown;
  autocomplete?: (...args: any[]) => unknown;
};

export type BotEvent = {
  name: string;
  once?: boolean;
  execute: (client: BotClient, ...args: any[]) => unknown;
};

export type BotClient = Client & {
  commands: Collection<string, BotCommand>;
  cooldowns: Collection<string, Collection<string, number>>;
  lavalink: LavalinkManager;
};