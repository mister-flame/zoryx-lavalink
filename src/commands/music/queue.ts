import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, EmbedBuilder, ChatInputCommandInteraction, Message, ButtonInteraction, CollectorFilter } from 'discord.js';
import { getPlayer } from '../../functions/getPlayer';
import { formatDuration } from '../../functions/formatDuration';
import { createUserEmbed } from '../../functions/createUserEmbed';
import { BotClient, BotConfig } from '../../types/index';
import { PlayerType } from '../../types/player';
import { TrackType } from '../../types/track';

const config = require("../../util/config") as BotConfig;

if (!config.token || !config.clientId) {
    throw new Error("Missing token or clientId in src/config.json or environment variables.");
}

const { COLOR_EMBED } = config;

/**
 * Gets the number of pages for a certain amount of videos
 * @param player The player to get the videos length
 * @returns {number}
 */

function getPageLength(player: PlayerType) {
    return Math.ceil((player.queue.tracks.length + 1) / 10);
}

async function getPageTracks(player: PlayerType, page: number) {
    const tracks = player.queue.tracks.slice() as TrackType[];
    const lengthPages = getPageLength(player);

    if (!page) throw new Error("Le numéro page spécifié est invalide");
    if ((page <= 0) || (page > lengthPages)) throw new Error("Le numéro de page spécifié est incorrect/non valide");

    tracks.unshift(player.queue.current);
    const pageTracks = tracks.slice((page - 1) * 10, page * 10);
    let returnText = "";
    let pageDuration = 0;
    let currentNumber = (page - 1) * 10;
    let displayNumber = page > 1 ? Number(`${page - 1}1`) : 1;

    for (const track of pageTracks) {
        if (!track) continue;

        pageDuration += track.info.duration;
        returnText += `${displayNumber}. [${track.info.title}](<${track.info.uri}>) \`${track.info.isStream == false ? (await formatDuration(track.info.duration)).join(":") : "Stream 🔴"}\`\n`;
        currentNumber++;
        displayNumber++;
    }

    return {
        pageDuration,
        returnText,
    };
}

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

        let pageButtons = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("previous")
                    .setEmoji("◀️")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(false),
                new ButtonBuilder()
                    .setCustomId("next")
                    .setEmoji("▶️")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(false)
            );

        let currentPage = 1;

        if (player && player.queue.current) {

            let totalDuration = player.queue.tracks.reduce((sum, track) => sum + (track.info.duration ?? 0), 0);

            totalDuration += player.queue.current.info.duration - (Date.now() - player.queue.current.info.startedPlaying);

            let pageInfo = await getPageTracks(player, currentPage);

            let queue = `Durée de la page : \`${(await formatDuration(pageInfo.pageDuration)).join(":")}\`\n\n` + pageInfo.returnText;

            queue += `\nDurée total de la file d'attente : \`${(await formatDuration(totalDuration)).join(":")}\``

            let queueEmbed = new EmbedBuilder()
                .setColor(COLOR_EMBED)
                .setTitle("📜 Liste des 10 prochaines musiques :")
                .setThumbnail(player.queue.current.info.artworkUrl)
                .setDescription((player.queue.tracks.length === 0) && (!player.queue.current) ? "Aucune musique dans la file d'attente." : queue)
                .setFooter({ text: `Demandé par ${interaction.user.username} • ${player.queue.tracks.length + 1} morceaux`, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp(new Date());

            let message = await interaction.editReply({ embeds: [queueEmbed], components: [pageButtons] }).catch(() => { }) as Message;

            const collector = message.createMessageComponentCollector({ time: 60_000 });

            collector.on("collect", async (btn: ButtonInteraction) => {
                if (btn.user.id != interaction.user.id) {
                    return;
                }

                if (btn.customId == "previous") {

                    if (currentPage - 1 <= 0) {
                        return;
                    }

                    currentPage--;

                    let totalDuration = player.queue.tracks.reduce((sum, track) => sum + (track.info.duration ?? 0), 0);
                    totalDuration += player.queue.current.info.duration - (Date.now() - player.queue.current.info.startedPlaying);
                    let pageInfo = await getPageTracks(player, currentPage);
                    let queue = `Durée de la page : \`${(await formatDuration(pageInfo.pageDuration)).join(":")}\`\n\n` + pageInfo.returnText;
                    queue += `\nDurée total de la file d'attente : \`${(await formatDuration(totalDuration)).join(":")}\``

                    queueEmbed.setDescription((player.queue.tracks.length === 0) && (!player.queue.current) ? "Aucune musique dans la file d'attente." : queue);

                    message.edit({ embeds: [queueEmbed], components: [pageButtons] })
                } else if (btn.customId == "next") {

                    if (currentPage + 1 > getPageLength(player)) {
                        return;
                    }

                    currentPage++;

                    let totalDuration = player.queue.tracks.reduce((sum, track) => sum + (track.info.duration ?? 0), 0);
                    totalDuration += player.queue.current.info.duration - (Date.now() - player.queue.current.info.startedPlaying);
                    let pageInfo = await getPageTracks(player, currentPage);
                    let queue = `Durée de la page : \`${(await formatDuration(pageInfo.pageDuration)).join(":")}\`\n\n` + pageInfo.returnText;
                    queue += `\nDurée total de la file d'attente : \`${(await formatDuration(totalDuration)).join(":")}\``

                    queueEmbed.setDescription((player.queue.tracks.length === 0) && (!player.queue.current) ? "Aucune musique dans la file d'attente." : queue);

                    message.edit({ embeds: [queueEmbed], components: [pageButtons] })
                }

                return btn.deferUpdate();
            })

            collector.on("end", () => {
                pageButtons.components.forEach((component) => {
                    component.setDisabled(true);
                })
                message.edit({ components: [pageButtons] });
                setTimeout(() => interaction.deleteReply().catch(() => { }), 30 * 1000);
            })

            return;

        } else {
            const queueEmbed = new EmbedBuilder()
                .setColor(COLOR_EMBED)
                .setTitle("📜 Liste des 10 prochaines musiques :")
                .setDescription("Aucune musique dans la file d'attente.")
                .setFooter({ text: `Demandé par ${interaction.user.username} • ${player.queue.tracks.length} morceaux`, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp(new Date());

            pageButtons.components.forEach((component) => {
                component.setDisabled(true);
            })

            interaction.editReply({ embeds: [queueEmbed], components: [pageButtons] }).then(() => {
                setTimeout(() => interaction.deleteReply().catch(() => { }), 60 * 1000);
            }).catch(() => { });
        }
    },
};