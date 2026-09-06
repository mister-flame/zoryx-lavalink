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
    name: "playerQueueEmptyEnd",
    once: false,
    on: true,
    async execute(client: BotClient, player: PlayerType) {

        // Log the event of the player being disconnected due to an empty queue for too long

        logPlayer(client, player, "La file d'attente est vide depuis trop longtemps, le player à été déconnecté.");

        const channel = await client.channels.cache.get(player.textChannelId) as TextChannel;

        // Create an embed message to inform users that the player has been disconnected due to an empty queue

        const leaveEmbed = new EmbedBuilder()
            .setColor("#ff0000")
            .setDescription(`**La file d'attente est vide depuis trop longtemps, le player à été déconnecté.**`)
            .setTimestamp(Date.now());

        // Send the embed message to the associated text channel if it's valid

        if (channel && channel instanceof TextChannel) channel.send({ embeds: [leaveEmbed] }).then((message: Message) => {
            setTimeout(() => {
                message.delete().catch((error: Error) => {
                    console.error(error);
                });
            }, 30 * 1000)
        })

        if (player.mainMessage && player.mainMessage.deletable) player.mainMessage.delete().catch(() => { });

        player.destroy();
        updateVoiceStatus(player.voiceChannelId);
        return;
    }
}