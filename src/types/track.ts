
import type {Track} from "lavalink-client" with {"resolution-mode": "import"};
import { User } from "discord.js";

export type TrackType = Track & {
    info: {
        startedPlaying: number; 
        requester?: User;
        sourceName: string;
        identifier: string;
        artworkUrl: string;
        title: string;
        uri: string;
        requestTimestamp: number;
        isStream: boolean;
        duration: number;
    };
    sourceName: string;
};