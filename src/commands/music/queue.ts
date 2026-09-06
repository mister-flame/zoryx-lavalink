import { SlashCommandBuilder, MessageFlags, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import { getPlayer } from '../../functions/getPlayer';
import { formatDuration } from '../../functions/formatDuration';
import { createUserEmbed } from '../../functions/createUserEmbed';
import { BotClient, BotConfig } from '../../types/index';
import { PlayerType } from '../../types/player';

const config = require("../../util/config") as BotConfig;

if (!config.token || !config.clientId) {
    throw new Error("Missing token or clientId in src/config.json or environment variables.");
}

const { COLOR_EMBED } = config;

module.exports = {
    name: 'queue',
    cooldown: 5,
    data: new SlashCommandBuilder().setName('queue').setDescription('Voir la file d\'attente !'),
    async execute(interaction: ChatInputCommandInteraction) {

        if (!interaction.guild) {
            return;
        }

        const member = await interaction.guild.members.fetch(interaction.user.id);

        if (!member.voice.channel) {
            return interaction.reply({ embeds: [createUserEmbed(interaction, "⚠️ Tu dois être en vocal pour utiliser cette commande")], flags: MessageFlags.Ephemeral });
        }

        const player = await getPlayer(interaction.client as BotClient, interaction.guild.id) as PlayerType;

        if (!player) {
            return interaction.reply({ embeds: [createUserEmbed(interaction, '❌ Aucun player/morceau pour ce serveur.')], flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply();

        let queue = null;

        if (player && player.queue.current) {

            let totalDuration = player.queue.current.info.duration - (Date.now() - player.queue.current.info.startedPlaying);

            queue = `1. [${player.queue.current.info.title}](<${player.queue.current.info.uri}>) \`${player.queue.current.info.isStream == false ? (await formatDuration(player.queue.current.info.duration - (Date.now() - player.queue.current.info.startedPlaying))).join(":") : "Stream 🔴"}\`\n`;

            for (let i = 1; i < player.queue.tracks.length; i++) {

                let track = player.queue.tracks[i];
                totalDuration += track.info.duration

                if (i < 10) {
                    queue = queue + `${i + 2}. [${track.info.title}](<${track.info.uri}>) \`${track.info.isStream == false ? (await formatDuration(track.info.duration)).join(":") : "Stream 🔴"}\`\n`;
                }
            }

            if (player.queue.tracks.length > 10) {
                queue = queue + `...et ${player.queue.tracks.length - 9} autres morceaux !`;
            }

            queue += `\nDurée total de la file d'attente : \`${(await formatDuration(totalDuration)).join(":")}\``

            const queueEmbed = new EmbedBuilder()
                .setColor(COLOR_EMBED)
                .setTitle("📜 Liste des 10 prochaines musiques :")
                .setThumbnail(player.queue.current.info.artworkUrl)
                .setDescription((player.queue.tracks.length === 0) && (!player.queue.current) ? "Aucune musique dans la file d'attente." : queue)
                .setFooter({ text: `Demandé par ${interaction.user.username} • ${player.queue.tracks.length + 1} musique(s) au total`, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp(new Date());

            return interaction.editReply({ embeds: [queueEmbed] }).then(() => {
                setTimeout(() => interaction.deleteReply().catch(() => { }), 15000);
            }).catch(() => { });
        } else {
            const queueEmbed = new EmbedBuilder()
                .setColor(COLOR_EMBED)
                .setTitle("📜 Liste des 10 prochaines musiques :")
                .setDescription("Aucune musique dans la file d'attente.")
                .setFooter({ text: `Demandé par ${interaction.user.username} • ${player.queue.tracks.length} musique(s) au total`, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp(new Date());

            return interaction.editReply({ embeds: [queueEmbed] }).then(() => {
                setTimeout(() => interaction.deleteReply().catch(() => { }), 15000);
            }).catch(() => { });
        }
    },
};