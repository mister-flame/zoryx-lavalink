import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import { getPlayer } from '../../functions/getPlayer';
import { createUserEmbed } from '../../functions/createUserEmbed';
import { BotClient, BotConfig } from '../../types';
import { PlayerType } from '../../types/player';
import { TrackType } from '../../types/track';
import DatabaseDAO from '../../classes/DatabaseDAO';
import { getVideoId } from '../../functions/getVideoId';
import Track from "../../classes/Track";

module.exports = {
    name: 'delete_favorite',
    cooldown: 10,
    data: new SlashCommandBuilder().setName('delete_favorite').setDescription('Supprimer une vidéo des favoris')
        .addStringOption((option) => option.setName('query').setDescription('La vidéo à supprimer des favoris').setAutocomplete(true).setRequired(true)),
    async autocomplete(interaction: AutocompleteInteraction) {

        if (!interaction.guild) {
            return;
        }

        const focusedValue = interaction.options.getFocused();

        if (!focusedValue) {
            return interaction.respond([]);
        }

        try {

            const client = interaction.client as BotClient;
            let player = await getPlayer(client, interaction.guild.id) as PlayerType;

            if (!player) {
                player = await client.lavalink.createPlayer({
                    guildId: interaction.guild.id,
                    voiceChannelId: "",
                    textChannelId: interaction.channel?.id,
                    // optional configurations:
                    selfDeaf: true,
                    selfMute: false,
                    volume: 100
                }) as PlayerType;
            }

            const choices = await player.search(focusedValue, {
                source: "youtube"
            });

            if (!choices || !choices.tracks || choices.tracks.length === 0) {
                return interaction.respond([{ name: "⚠️ Aucune vidéo trouvée pour cette recherche", value: "no_results_found_-1" }]);
            }

            await interaction.respond(choices.tracks
                .filter((choice) => choice.info.uri)
                .slice(0, 5)
                .map((choice) => ({ name: choice.info.title, value: choice.info.uri! })));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Error during autocomplete for /play command: ${errorMessage}`);
            return interaction.respond([{ name: "⚠️ Une erreur est survenue lors de la recherche de la vidéo", value: "error_occurred_-1" }]);
        } finally {
            const player = await getPlayer(interaction.client as BotClient, interaction.guild.id) as PlayerType;
            if (player && player.state === "CONNECTED") {
                await player.destroy();
            }
        }
    },
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

        if (!player) {
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

        player.destroy();

        if (!track) {
            return interaction.editReply({ embeds: [createUserEmbed(interaction, "⚠️ Aucune vidéo trouvée pour cette recherche")] });
        }

        const databaseDAO = new DatabaseDAO();

        const videoId = await getVideoId(track.info.uri);

        if (!videoId) {
            return interaction.editReply({ embeds: [createUserEmbed(interaction, "⚠️ Impossible d'extraire l'ID de la vidéo")] });
        }

        if (!await databaseDAO.getFavoriteTrack(interaction.user.id, videoId)) {
            return interaction.editReply({ embeds: [createUserEmbed(interaction, "⚠️ Cette vidéo n'est pas dans vos favoris")] });
        }

        try {
            await databaseDAO.deleteFavoriteTrack(interaction.user.id, new Track(interaction.user.id, videoId, track.info.title, track.info.uri, null, track.info.sourceName, track.info.artworkUrl));
            return interaction.editReply({ embeds: [createUserEmbed(interaction, `✅ La vidéo **${track.info.title}** a été supprimée de vos favoris`).setColor("Green").setImage(track.info.artworkUrl)] });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Error deleting favorite track: ${errorMessage}`);
            return interaction.editReply({ embeds: [createUserEmbed(interaction, `⚠️ ${errorMessage}`).setColor("Red")] });
        }
    },
};