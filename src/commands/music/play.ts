import { SlashCommandBuilder, EmbedBuilder, MessageFlags, TextChannel, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import { getPlayer } from '../../functions/getPlayer';
import { formatDuration } from '../../functions/formatDuration';
import { getBestThumbnail } from '../../functions/getBestThumbnail';
import { createUserEmbed } from '../../functions/createUserEmbed';
import { BotClient, BotConfig } from '../../types';
import { PlayerType } from '../../types/player';
import { TrackType } from '../../types/track';

const config = require("../../util/config") as BotConfig;

if (!config.token || !config.clientId) {
    throw new Error("Missing token or clientId in src/config.json or environment variables.");
}

const { COLOR_EMBED } = config;

module.exports = {
    name: 'play',
    cooldown: 5,
    data: new SlashCommandBuilder().setName('play').setDescription('Jouer une vidéo depuis YouTube ou d\'autres plateformes supportées!')
        .addStringOption((option) => option.setName('query').setDescription('La vidéo à jouer').setAutocomplete(true).setRequired(true)),
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
                source: "youtube",
                limit: 5,
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

        const query = interaction.options.getString('query');

        if (!interaction.guild) {
            return;
        }

        const member = await interaction.guild.members.fetch(interaction.user.id);

        if (!member.voice.channel) {
            return interaction.reply({ embeds: [createUserEmbed(interaction, "⚠️ Tu dois être en vocal pour utiliser cette commande")], flags: MessageFlags.Ephemeral });
        }

        if (!query) {
            return interaction.reply({ embeds: [createUserEmbed(interaction, "⚠️ Tu dois fournir une vidéo à jouer")], flags: MessageFlags.Ephemeral });
        }

        if (query === "invalid_voice_channel_-1") {
            return interaction.reply({ embeds: [createUserEmbed(interaction, "⚠️ Tu dois être en vocal pour utiliser cette commande")], flags: MessageFlags.Ephemeral });
        }

        if (query === "no_results_found_-1") {
            return interaction.reply({ embeds: [createUserEmbed(interaction, "⚠️ Aucune vidéo trouvée pour cette recherche")], flags: MessageFlags.Ephemeral });
        }

        if (query === "error_occurred_-1") {
            return interaction.reply({ embeds: [createUserEmbed(interaction, "⚠️ Une erreur est survenue lors de la recherche de la vidéo")], flags: MessageFlags.Ephemeral });
        }

        const client = interaction.client as BotClient;

        let player = await getPlayer(client, interaction.guild.id) as PlayerType;

        if (!interaction.channel?.id) {
            return;
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

        let track = (await player.search(query, {
            source: "youtube",
        })).tracks[0] as TrackType;

        const node = player.node;
        if (!node || !node.connected) {
            await node.connect();
        }

        if (!player.connected) await player.connect();

        if (!track) {
            return interaction.reply({ embeds: [createUserEmbed(interaction, "⚠️ Aucune vidéo trouvée pour cette recherche")], flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply();

        track.info.requester = interaction.user;
        track.info.requestTimestamp = Date.now();

        if (track.sourceName === "youtube") {
            const newArtworkUrl = await getBestThumbnail(track.info.identifier);
            track.info.artworkUrl = newArtworkUrl || track.info.artworkUrl;
        }

        await player.queue.add(track);

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

        if (!player.playing) {
            await player.play();
            return;
        }

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