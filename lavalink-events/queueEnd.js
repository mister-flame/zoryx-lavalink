const { updateVoiceStatus } = require("../functions/updateVoiceStatus");
const { EmbedBuilder } = require("discord.js");

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
            const waitEmbed = new EmbedBuilder()
                .setTitle(`En attente de la prochaine musique...`)
                .setDescription(`**La file d'attente est terminée❗**\n\nAjoutez des musiques à la file d'attente pour continuer à écouter de la musique ! (le bot quittera le canal vocal dans 5 minutes s'il n'y a pas de nouvelle musique)`)
                .setFooter({ text: "Partira le " })
                .setTimestamp(Date.now() + 5 * 60 * 1000);

            player.mainMessage.edit({ embeds: [waitEmbed] });
        }

        updateVoiceStatus(player.voiceChannelId, "Plus de musiques dans la file❗");

        return;
    }
}