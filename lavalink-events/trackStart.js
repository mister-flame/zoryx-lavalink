const { logPlayer } = require("../functions/logPlayer");
const { getBestThumbnail } = require("../functions/getBestThumbnail");
const { formatDuration } = require("../functions/formatDuration");
const { EmbedBuilder, TextChannel } = require("discord.js");
const { updateVoiceStatus } = require("../functions/updateVoiceStatus");
const { COLOR_EMBED } = require("../util/config");

/*
    * Lavalink "trackStart" event handler
    * @param {Client} client - The Discord client instance
    * @param {Player} player - The Lavalink player instance
    * @param {Object} track - The track that started playing
*/

module.exports = {
    name: "trackStart",
    once: false,
    on: true,
    async execute(client, player, track) {

        // Set the start time of the current track

        player.queue.current.info.startedPlaying = Date.now();

        // Log the currently playing track

        logPlayer(client, player);

        // Get the text channel associated with the player

        const channel = await client.channels.cache.get(player.textChannelId);

        // If the track is from YouTube, try to get a better thumbnail

        if (track.info.sourceName === "youtube") {
            const newArtworkUrl = await getBestThumbnail(track.info.identifier);
            track.info.artworkUrl = newArtworkUrl || track.info.artworkUrl;
        }

        // Create an embed message to show the currently playing track

        const playingEmbed = new EmbedBuilder()
            .setColor(COLOR_EMBED)
            .setTitle("🎶 Lecture en cours de :")
            .setDescription(`**[${track.info.title}](${track.info.uri})** | \`${track.info.isStream == false ? (await formatDuration(track.info.duration)).join(":") : "Stream 🔴"}\``)
            .setImage(track.info.artworkUrl)
            .setFooter({ text: `Demandé par ${track.info.requester.username}`, iconURL: track.info.requester.displayAvatarURL() })
            .setTimestamp(track.info.requestDate);

        // Condition to avoid sending the embed if the track is on repeat mode and if the channel is valid

        if (channel && channel instanceof TextChannel && player.repeatMode != "track") channel.send({ embeds: [playingEmbed] });

        updateVoiceStatus(player.voiceChannelId, '🎶 ' + track.info.title);

        return;
    }
}