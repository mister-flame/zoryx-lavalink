import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, Message, ButtonInteraction } from 'discord.js';
import { createUserEmbed } from '../../functions/createUserEmbed';
import { BotConfig } from '../../types';
import DatabaseDAO from '../../classes/DatabaseDAO';
import { getBestThumbnail } from '../../functions/getBestThumbnail';
import Track from '../../classes/Track';

const config = require("../../util/config") as BotConfig;

if (!config.token || !config.clientId) {
    throw new Error("Missing token or clientId in src/config.json or environment variables.");
}

const { COLOR_EMBED } = config;

module.exports = {
    name: 'get_favorites',
    cooldown: 10,
    data: new SlashCommandBuilder().setName('get_favorites').setDescription('Obtenir ses vidéos favorites'),
    async execute(interaction: ChatInputCommandInteraction) {

        const databaseDAO = new DatabaseDAO();

        const user = await databaseDAO.getUser(interaction.user.id);

        if (!user) {
            await databaseDAO.createUser(interaction.user.id);
            return interaction.editReply({ embeds: [createUserEmbed(interaction, "⚠️ Vous n'avez pas encore de favoris. Utilisez la commande `/add_favorite` pour en ajouter.")] });
        }

        const favoriteTracks = await databaseDAO.getFavoriteTracks(interaction.user.id);

        if (!favoriteTracks || favoriteTracks.length === 0) {
            return interaction.editReply({ embeds: [createUserEmbed(interaction, "⚠️ Vous n'avez pas encore de favoris. Utilisez la commande `/add_favorite` pour en ajouter.")] });
        }

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

        let favoriteEmbed = new EmbedBuilder()
            .setColor(COLOR_EMBED)
            .setTitle("❤️ Liste de vos musiques favorites :")
            .setThumbnail(await favoriteTracks[0].getThumbnailUrl())
            .setDescription(favoriteTracks.slice((currentPage - 1) * 10, currentPage * 10).map((track, index) => `\`${(currentPage - 1) * 10 + index + 1}.\` [${track.getTitle()}](${track.getUrl()}), ajouté le \`${Track.convertToDate(track.getAddedAt())}\``).join("\n"))
            .setFooter({ text: `Demandé par ${interaction.user.username} • ${favoriteTracks.length} favoris • Page ${currentPage}/${Math.ceil(favoriteTracks.length / 10)}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp(new Date());

        let message = await interaction.editReply({ embeds: [favoriteEmbed], components: [pageButtons] }).catch(() => { }) as Message;

        const collector = message.createMessageComponentCollector({ time: 60_000 });

        collector.on("collect", async (btn: ButtonInteraction) => {
            if (btn.user.id != interaction.user.id) {
                return btn.reply({ content: "⚠️ Vous ne pouvez pas interagir avec ces boutons.", ephemeral: true });
            }

            if (btn.customId == "previous") {

                if (currentPage - 1 <= 0) {
                    return btn.deferUpdate();
                }

                currentPage--;

                favoriteEmbed.setDescription(favoriteTracks.slice((currentPage - 1) * 10, currentPage * 10).map((track, index) => `\`${(currentPage - 1) * 10 + index + 1}.\` [${track.getTitle()}](${track.getUrl()}), ajouté le \`${Track.convertToDate(track.getAddedAt())}\``).join("\n"));

                message.edit({ embeds: [favoriteEmbed], components: [pageButtons] })
            } else if (btn.customId == "next") {

                if (currentPage + 1 > Math.ceil(favoriteTracks.length / 10)) {
                    return btn.deferUpdate();
                }

                currentPage++;

                favoriteEmbed.setDescription(favoriteTracks.slice((currentPage - 1) * 10, currentPage * 10).map((track, index) => `\`${(currentPage - 1) * 10 + index + 1}.\` [${track.getTitle()}](${track.getUrl()}), ajouté le \`${Track.convertToDate(track.getAddedAt())}\``).join("\n"));

                message.edit({ embeds: [favoriteEmbed], components: [pageButtons] })
            }

            favoriteEmbed.setFooter({ text: `Demandé par ${interaction.user.username} • ${favoriteTracks.length} favoris • Page ${currentPage}/${Math.ceil(favoriteTracks.length / 10)}`, iconURL: interaction.user.displayAvatarURL() });

            return btn.deferUpdate();
        })

        collector.on("end", () => {
            pageButtons.components.forEach((component) => {
                component.setDisabled(true);
            })
            message.edit({ components: [pageButtons] });
        })

        return;
    }
};