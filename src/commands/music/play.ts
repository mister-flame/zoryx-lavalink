import { SlashCommandBuilder, EmbedBuilder, MessageFlags, TextChannel, ChatInputCommandInteraction, AutocompleteInteraction, User } from 'discord.js';
import { getPlayer } from '../../functions/getPlayer';
import { formatDuration } from '../../functions/formatDuration';
import { getBestThumbnail } from '../../functions/getBestThumbnail';
import { createUserEmbed } from '../../functions/createUserEmbed';
import { BotClient, BotConfig } from '../../types';
import { PlayerType } from '../../types/player';
import { TrackType } from '../../types/track';
import DatabaseDAO from '../../classes/DatabaseDAO';
import Track from '../../classes/Track';
import { getVideoId } from '../../functions/getVideoId';

const config = require("../../util/config") as BotConfig;

if (!config.token || !config.clientId) {
    throw new Error("Missing token or clientId in src/config.json or environment variables.");
}

const { COLOR_EMBED } = config;

module.exports = {
    name: 'play',
    cooldown: 10,
    data: new SlashCommandBuilder().setName('play').setDescription('Jouer une vidéo depuis YouTube ou d\'autres plateformes supportées!')
        .addStringOption((option) => option.setName('query').setDescription('La vidéo à jouer').setAutocomplete(true))
        .addUserOption((option) => option.setName("utilisateur").setDescription("Jouer les musiques favorites de cet utilisateur")),
    async autocomplete(interaction: AutocompleteInteraction) {

        if (!interaction.guild) {
            return;
        }

        const member = await interaction.guild.members.fetch(interaction.user.id);

        if (!member.voice.channel) {
            return interaction.respond([{ name: "⚠️ Tu dois être en vocal pour utiliser cette commande", value: "invalid_voice_channel_-1" }]);
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
                    voiceChannelId: member.voice.channel?.id,
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
            if (player && player.state === "CONNECTED" && player.voiceChannelId !== member.voice.channel.id) {
                await player.destroy();
            }
        }
    },
    async execute(interaction: ChatInputCommandInteraction) {

        const query = interaction.options.getString('query') as string;

        let user = interaction.options.getUser("utilisateur");

        if (!interaction.guild) {
            return;
        }

        if (!user) {
            user = interaction.user;
        }

        if (query && user) {
            user = null;
        }

        const member = await interaction.guild.members.fetch(interaction.user.id);

        if (!member.voice.channel) {
            return interaction.editReply({ embeds: [createUserEmbed(interaction, "⚠️ Tu dois être en vocal pour utiliser cette commande")] });
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

        const client = interaction.client as BotClient;

        let player = await getPlayer(client, interaction.guild.id) as PlayerType;

        if (!interaction.channel?.id) {
            return interaction.editReply({ embeds: [createUserEmbed(interaction, "❌ Pas de channel valide")] });
        }

        if (!player) {
            player = await client.lavalink.createPlayer({
                guildId: interaction.guild.id,
                voiceChannelId: member.voice.channel.id,
                textChannelId: interaction.channel.id,
                // optional configurations:
                selfDeaf: true,
                selfMute: false,
                volume: 100
            }) as PlayerType;
        }

        if (query && user) {
            const databaseDAO = new DatabaseDAO();
            const tempTrack = await databaseDAO.getFavoriteTrackFromTitle(user?.id, query);

            if (!tempTrack) {
                return interaction.editReply({ embeds: [createUserEmbed(interaction, `⚠️ Aucun résultat trouvé pour \`${query}\` dans les favoris de <@${user.id}>.`)] });
            }

            let track = (await player.search(tempTrack.getUrl(), {
                source: tempTrack.getPlatform() as "youtube" | "spotify" | "soundcloud",
            })).tracks[0] as TrackType;

            track.info.requester = interaction.user;
            track.info.requestTimestamp = Date.now();

            if (track.sourceName === "youtube") {
                const newArtworkUrl = await getBestThumbnail(track.info.identifier);
                track.info.artworkUrl = newArtworkUrl || track.info.artworkUrl;
            }

            await player.queue.add(track);

            if (!player.playing) player.play();

            const node = player.node;
            if (!node || !node.connected) {
                node.connect();
            }

            if (!player.connected) player.connect();

            if ((player.mainMessage && player.mainMessage.embeds.length > 0) && interaction.channel && interaction.channel instanceof TextChannel && player.mainMessage.editable) {

                let emojiRepeat;

                switch (player.repeatMode) {
                    case "track":
                        emojiRepeat = "🔂";
                        break;
                    case "queue":
                        emojiRepeat = "🔁";
                        break;
                    case "off":
                        emojiRepeat = "❌";
                        break;
                }

                const embed = EmbedBuilder.from(player.mainMessage.embeds[0]);

                if (player.queue.current.info.requester) {
                    embed.setFooter({ text: `Demandé par ${player.queue.current.info.requester.username} • Loop : ${emojiRepeat} • ${player.queue.tracks.length + 1} morceaux`, iconURL: player.queue.current.info.requester.displayAvatarURL() });
                }

                player.mainMessage.edit({ embeds: [embed] });
            }

            return interaction.editReply({ embeds: [createUserEmbed(interaction, `✅ La musique \`${query}\` de <@${user?.id}> à été rajouté dans la file !`).setColor("Green")] });
        }

        if (!query && user) {
            const databaseDAO = new DatabaseDAO();
            const tracks = await databaseDAO.getFavoriteTracks(user?.id);

            if (!tracks || tracks.length === 0) {
                return interaction.editReply({ embeds: [createUserEmbed(interaction, "⚠️ Cet utilisateur n'a pas encore de musiques favorites.")] });
            }

            for (const tempTrack of tracks) {

                let track = (await player.search(tempTrack.getUrl(), {
                    source: tempTrack.getPlatform() as "youtube" | "spotify" | "soundcloud",
                })).tracks[0] as TrackType;

                track.info.requester = interaction.user;
                track.info.requestTimestamp = Date.now();

                if (track.sourceName === "youtube") {
                    const newArtworkUrl = await getBestThumbnail(track.info.identifier);
                    track.info.artworkUrl = newArtworkUrl || track.info.artworkUrl;
                }

                await player.queue.add(track);
            }
            if (!player.playing) player.play();

            const node = player.node;
            if (!node || !node.connected) {
                node.connect();
            }

            if (!player.connected) player.connect();

            if ((player.mainMessage && player.mainMessage.embeds.length > 0) && interaction.channel && interaction.channel instanceof TextChannel && player.mainMessage.editable) {

                let emojiRepeat;

                switch (player.repeatMode) {
                    case "track":
                        emojiRepeat = "🔂";
                        break;
                    case "queue":
                        emojiRepeat = "🔁";
                        break;
                    case "off":
                        emojiRepeat = "❌";
                        break;
                }

                const embed = EmbedBuilder.from(player.mainMessage.embeds[0]);

                if (player.queue.current.info.requester) {
                    embed.setFooter({ text: `Demandé par ${player.queue.current.info.requester.username} • Loop : ${emojiRepeat} • ${player.queue.tracks.length + tracks.length} morceaux`, iconURL: player.queue.current.info.requester.displayAvatarURL() });
                }

                player.mainMessage.edit({ embeds: [embed] });
            }

            return interaction.editReply({ embeds: [createUserEmbed(interaction, `✅ Toutes les musiques favorites ont été ajoutées à la file d'attente ! (${tracks.length} musiques)`).setColor("Green")] });
        }

        if (!query && !user) {
            return interaction.editReply({ embeds: [createUserEmbed(interaction, "⚠️ Veuillez préciser une musique ou un utilisateur")] });
        }

        let track = (await player.search(query, {
            source: "youtube",
        })).tracks[0] as TrackType;

        if (!track) {
            return interaction.editReply({ embeds: [createUserEmbed(interaction, "⚠️ Aucune vidéo trouvée pour cette recherche")] });
        }

        await player.queue.add(track);

        if (!player.playing) player.play();

        const node = player.node;
        if (!node || !node.connected) {
            node.connect();
        }

        if (!player.connected) player.connect();

        track.info.requester = interaction.user;
        track.info.requestTimestamp = Date.now();

        if (track.sourceName === "youtube") {
            const newArtworkUrl = await getBestThumbnail(track.info.identifier);
            track.info.artworkUrl = newArtworkUrl || track.info.artworkUrl;
        }

        const addSong = new EmbedBuilder()
            .setColor(COLOR_EMBED)
            .setTitle("➕ Ta musique a été ajoutée à la file d'attente :")
            .setDescription(`**[${track.info.title}](${track.info.uri})** | Durée : \`${track.info.isStream == false ? (await formatDuration(track.info.duration)).join(":") : "Stream 🔴"}\``)
            .setThumbnail(track.info.artworkUrl)
            .setFooter({ text: `Demandé par ${track.info.requester.username} | Position n°${player.queue.current ? player.queue.tracks.length + 1 : 1}`, iconURL: track.info.requester.displayAvatarURL() })
            .setTimestamp(track.info.requestTimestamp);

        await interaction.editReply({ embeds: [addSong] }).then(() => {
            setTimeout(() => interaction.deleteReply().catch(() => { }), 15000);
        }).catch(() => { });

        if ((player.mainMessage && player.mainMessage.embeds.length > 0) && interaction.channel && interaction.channel instanceof TextChannel && player.mainMessage.editable) {

            let emojiRepeat;

            switch (player.repeatMode) {
                case "track":
                    emojiRepeat = "🔂";
                    break;
                case "queue":
                    emojiRepeat = "🔁";
                    break;
                case "off":
                    emojiRepeat = "❌";
                    break;
            }

            const embed = EmbedBuilder.from(player.mainMessage.embeds[0]);

            if (player.queue.current.info.requester) {
                embed.setFooter({ text: `Demandé par ${player.queue.current.info.requester.username} • Loop : ${emojiRepeat} • ${player.queue.tracks.length + 1} morceaux`, iconURL: player.queue.current.info.requester.displayAvatarURL() });
            }

            player.mainMessage.edit({ embeds: [embed] });
        }
    },
};