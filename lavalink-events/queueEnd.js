const { updateVoiceStatus } = require("../functions/updateVoiceStatus");
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");

/*
    * Lavalink "queueEnd" event handler
    * @param {Client} client - The Discord client instance
    * @param {Player} player - The Lavalink player instance
*/

module.exports = {
    name: "queueEnd",
    once: false,
    on: true,
    async execute(client, player) {

        if ((player.mainMessage && player.mainMessage.embeds.length > 0 && player.repeatMode != "track") && player.mainMessage.editable) {

            const playerButtons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("loopTrack")
                        .setEmoji("🔂")
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId("loopQueue")
                        .setEmoji("🔁")
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId("shuffle")
                        .setEmoji("🔀")
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId("skip")
                        .setEmoji("⏭️")
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId("leave")
                        .setEmoji("🔌")
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(true),
                );

            const waitEmbed = new EmbedBuilder()
                .setTitle(`En attente de la prochaine musique...`)
                .setDescription(`**La file d'attente est terminée❗**\n\nAjoutez des musiques à la file d'attente pour continuer à écouter de la musique ! (le bot quittera le canal vocal dans 5 minutes s'il n'y a pas de nouvelle musique)`)
                .setFooter({ text: "Partira" })
                .setTimestamp(Date.now() + 5 * 60 * 1000);

            player.mainMessage.edit({ embeds: [waitEmbed], components: [playerButtons] }).catch(() => { });
        }

        updateVoiceStatus(player.voiceChannelId, "Plus de musiques dans la file❗");

        return;
    }
}