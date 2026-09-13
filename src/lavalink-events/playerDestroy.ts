// Dependency imports

import { Message, EmbedBuilder, TextChannel } from "discord.js";
import { BotClient } from "../types";
import { PlayerType } from "../types/player";
import { logPlayer } from "../functions/logPlayer";
import { updateVoiceStatus } from "../functions/updateVoiceStatus";

/*
    * Lavalink "playerQueueEmptyEnd" event handler
    * @param {BotClient} client - The Discord client instance
    * @param {PlayerType} player - The Lavalink player instance
*/

module.exports = {
    name: "playerDestroy",
    once: false,
    on: true,
    async execute(client: BotClient, player: PlayerType) {

        // Log the event of the player being destroyed

        logPlayer(client, player, `Le player a été détruit !`);

        if (player.mainMessage && player.mainMessage.deletable) player.mainMessage.delete().catch(() => { });

        return;
    }
}