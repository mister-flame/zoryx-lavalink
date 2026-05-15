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

        track.info.startedPlaying = Date.now();

        // Log the currently playing track

        logPlayer(client, player);

        // Get the text channel associated with the player

        const channel = await client.channels.cache.get(player.textChannelId);

        // If the track is from YouTube, try to get a better thumbnail

        if (track.info.sourceName === "youtube") {
            const newArtworkUrl = await getBestThumbnail(track.info.identifier);
            track.info.artworkUrl = newArtworkUrl || track.info.artworkUrl;
        }

        switch (player.repeatMode) {
            case "off":
                loopState = "❌";
                break;
            case "track":
                loopState = "🔂";
                break;
            case "queue":
                loopState = "🔁";
                break;
            default:
                loopState = "❌";
                break;
        }

        // Condition to avoid sending the embed if the track is on repeat mode and if the channel is valid

        if ((player.mainMessage && player.mainMessage.embeds.length > 0 && player.repeatMode != "track") && channel && channel instanceof TextChannel && player.mainMessage.editable) {
            const embed = EmbedBuilder.from(player.mainMessage.embeds[0]);

            embed.setTitle(`🎶 Lecture en cours de :`);
            embed.setDescription(`**[${track.info.title}](${track.info.uri})** | \`${track.info.isStream == false ? (await formatDuration(track.info.duration)).join(":") : "Stream 🔴"}\``);
            embed.setFooter({ text: `Demandé par ${track.info.requester.username} • Loop : ${loopState} • ${player.queue.tracks.length + 1} morceaux`, iconURL: track.info.requester.displayAvatarURL() });
            embed.setImage(track.info.artworkUrl);
            embed.setTimestamp(track.info.requestDate);

            player.mainMessage.edit({ embeds: [embed] });
        } else if (!player.mainMessage && channel && channel instanceof TextChannel) {
            const playingEmbed = new EmbedBuilder()
                .setColor(COLOR_EMBED)
                .setTitle("🎶 Lecture en cours de :")
                .setDescription(`**[${track.info.title}](${track.info.uri})** | \`${track.info.isStream == false ? (await formatDuration(track.info.duration)).join(":") : "Stream 🔴"}\``)
                .setImage(track.info.artworkUrl)
                .setFooter({ text: `Demandé par ${track.info.requester.username} • Loop : ${loopState} • ${player.queue.tracks.length + 1} morceaux`, iconURL: track.info.requester.displayAvatarURL() })
                .setTimestamp(track.info.requestDate);

            player.mainMessage = await channel.send({ embeds: [playingEmbed] });
        }

        if (channel && channel instanceof TextChannel && player.repeatMode != "track") {
            updateVoiceStatus(player.voiceChannelId, '🎶 ' + track.info.title);
        }

        return;
    }
}