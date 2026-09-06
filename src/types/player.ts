import type { Player } from "lavalink-client";
import { TrackType } from "./track";
import { Message } from "discord.js";

export type PlayerType = Player & {
    textChannelId: string;
    voiceChannelId: string;
    mainMessage?: Message;
    repeatMode: string;
    queue: {
        current: TrackType;
        tracks: TrackType[];
    }
    position: number;
    createdTimeStamp: Date;
    playing: boolean;
    volume: number;
    guildId: string;
    destroy: () => void;
    state: string;
};