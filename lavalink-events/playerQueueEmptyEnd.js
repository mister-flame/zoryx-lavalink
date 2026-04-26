// Dependency imports

const { EmbedBuilder, TextChannel } = require("discord.js");
const { logPlayer } = require("../functions/logPlayer");
const { updateVoiceStatus } = require("../functions/updateVoiceStatus");

/*
    * Lavalink "playerQueueEmptyEnd" event handler
    * @param {Client} client - The Discord client instance
    * @param {Player} player - The Lavalink player instance
*/

module.exports = {
    name: "playerQueueEmptyEnd",
    once: false,
    on: true,
    async execute(client, player) {

        // Log the event of the player being disconnected due to an empty queue for too long

        logPlayer(client, player, "La file d'attente est vide depuis trop longtemps, le player à été déconnecté.");

        const channel = await client.channels.cache.get(player.textChannelId);

        // Create an embed message to inform users that the player has been disconnected due to an empty queue

        const leaveEmbed = new EmbedBuilder()
            .setColor("#ff0000")
            .setDescription(`**La file d'attente est vide depuis trop longtemps, le player à été déconnecté.**`)
            .setTimestamp(Date.now());

        // Send the embed message to the associated text channel if it's valid

        if (channel && channel instanceof TextChannel) channel.send({ embeds: [leaveEmbed] });
        player.destroy();
        updateVoiceStatus(player.voiceChannelId);
        return;
    }
}