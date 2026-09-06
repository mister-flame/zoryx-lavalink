import { ChatInputCommandInteraction, SlashCommandBuilder, MessageFlags, EmbedBuilder } from "discord.js";
import { getPlayer } from '../../functions/getPlayer';
import { formatDuration } from '../../functions/formatDuration';
import { createUserEmbed } from '../../functions/createUserEmbed';
import { BotClient, BotConfig } from "../../types";
import { TrackType } from "../../types/track";

const config = require("../../util/config") as BotConfig;

if (!config.token || !config.clientId) {
    throw new Error("Missing token or clientId in src/config.json or environment variables.");
}

const { COLOR_EMBED } = config;

module.exports = {
    name: 'nowplaying',
    cooldown: 5,
    data: new SlashCommandBuilder().setName('nowplaying').setDescription('Voir le morceau en cours !'),
    async execute(interaction: ChatInputCommandInteraction) {

        if (!interaction.guild) {
            return;
        }

        const member = await interaction.guild.members.fetch(interaction.user.id);

        if (!member.voice.channel) {
            return interaction.reply({ embeds: [createUserEmbed(interaction, "⚠️ Tu dois être en vocal pour utiliser cette commande")], flags: MessageFlags.Ephemeral });
        }

        const player = await getPlayer(interaction.client as BotClient, interaction.guild.id);

        if (!player) {
            return interaction.reply({ embeds: [createUserEmbed(interaction, '❌ Aucun player/morceau pour ce serveur.')], flags: MessageFlags.Ephemeral });
        }

        let track = player.queue.current as TrackType;

        if (!track) {
            return interaction.reply({ embeds: [createUserEmbed(interaction, '❌ Aucun morceau en cours.')], flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply();

        const currentTime = Date.now() - track.info.startedPlaying;
        const totalTime = track.info.duration;
        const progress = Math.floor((currentTime / totalTime) * 20);

        let progressBar = "";

        if (track.info.isStream == false) {
            progressBar = "\n**【**" + '▬'.repeat(progress) + '⚪' + '▬'.repeat(20 - progress) + "**】**";
        }

        const nowPlayingEmbed = new EmbedBuilder()
            .setColor(COLOR_EMBED)
            .setTitle("🎶 Musique en cours de lecture :")
            .setDescription(`**[${track.info.title}](${track.info.uri})**\n${progressBar}\n\`${(await formatDuration(currentTime)).join(":")} / ${track.info.isStream == false ? (await formatDuration(totalTime)).join(":") : "Stream 🔴"}\``)
            .setThumbnail(track.info.artworkUrl)
            .setFooter({ text: `Demandé par ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp(track.info.requestTimestamp);
        interaction.editReply({ embeds: [nowPlayingEmbed] }).then(msg => {
            setTimeout(() => msg.delete().catch(() => { }), 15000);
        }).catch(() => { });
        return;

    },
};