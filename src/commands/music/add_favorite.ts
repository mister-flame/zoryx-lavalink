import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import { getPlayer } from '../../functions/getPlayer';
import { createUserEmbed } from '../../functions/createUserEmbed';
import { BotClient, BotConfig } from '../../types';
import { PlayerType } from '../../types/player';
import { TrackType } from '../../types/track';
import DatabaseDAO from '../../classes/DatabaseDAO';
import Track from '../../classes/Track';
import { getVideoId } from '../../functions/getVideoId';

module.exports = {
    name: 'add_favorite',
    cooldown: 10,
    data: new SlashCommandBuilder().setName('add_favorite').setDescription('Ajouter une vidéo aux favoris')
        .addStringOption((option) => option.setName('query').setDescription('La vidéo à ajouter aux favoris').setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {

        let query;

        if (interaction.options && interaction.options.getString('query')) {
            query = interaction.options.getString('query');
        }

        if (!interaction.guild) {
            return;
        }

        const client = interaction.client as BotClient;

        let player = await getPlayer(client, interaction.guild.id) as PlayerType;

        if (!query) {
            if (player && player.queue && player.queue.current && player.queue.current.info && player.queue.current.info.uri) {
                if (interaction.deferred || !interaction.replied) {
                    await interaction.deferReply();
                }
                query = player.queue.current?.info.uri as string;
            } else {
                return;
            }
        }

        if (query === "invalid_voice_channel_-1") {
            return interaction.editReply({ embeds: [createUserEmbed(interaction, "⚠️ Tu dois être en vocal pour utiliser cette commande")] });
        }

        if (query === "no_results_found_-1") {
            return interaction.editReply({ embeds: [createUserEmbed(interaction, "⚠️ Aucune vidéo trouvée pour cette recherche")] });
        }

        if (query === "error_occurred_-1") {
            return interaction.editReply({ embeds: [createUserEmbed(interaction, "⚠️ Une erreur est survenue lors de la recherche de la vidéo")] });
        }

        if (!interaction.channel?.id) {
            return interaction.editReply({ embeds: [createUserEmbed(interaction, "❌ Pas de channel valide")] });
        }

        let found = true;

        if (!player) {
            found = false;
            player = await client.lavalink.createPlayer({
                guildId: interaction.guild.id,
                voiceChannelId: "",
                textChannelId: interaction.channel.id,
                // optional configurations:
                selfDeaf: true,
                selfMute: false,
                volume: 100
            }) as PlayerType;
        }

        let track = (await player.search(query, {
            source: "youtube",
        })).tracks[0] as TrackType;

        if (found == false) {
            player.destroy()
        }

        if (!track) {
            return interaction.editReply({ embeds: [createUserEmbed(interaction, "⚠️ Aucune vidéo trouvée pour cette recherche")] });
        }

        const databaseDAO = new DatabaseDAO();

        if (!(await databaseDAO.getUser(interaction.user.id))) {
            await databaseDAO.createUser(interaction.user.id);
        }

        const videoId = await getVideoId(track.info.uri);

        if (!videoId) {
            return interaction.editReply({ embeds: [createUserEmbed(interaction, "⚠️ Impossible d'extraire l'ID de la vidéo")] });
        }

        try {
            await databaseDAO.addFavoriteTrack(new Track(interaction.user.id, videoId, track.info.title, track.info.uri, null, track.info.sourceName, track.info.artworkUrl));
            return interaction.editReply({ embeds: [createUserEmbed(interaction, `✅ La vidéo **${track.info.title}** a été ajoutée à vos favoris`).setColor("Green").setImage(track.info.artworkUrl)] });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Error adding favorite track: ${errorMessage}`);
            return interaction.editReply({ embeds: [createUserEmbed(interaction, `⚠️ ${errorMessage}`).setColor("Red")] });
        }
    },
};