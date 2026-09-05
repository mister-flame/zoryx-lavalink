const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags, TextChannel } = require('discord.js');
const { COLOR_EMBED } = require('../../util/config');
const { getPlayer } = require('../../functions/getPlayer');
const { formatDuration } = require('../../functions/formatDuration');
const { getBestThumbnail } = require('../../functions/getBestThumbnail');

module.exports = {
    name: 'play',
    cooldown: 5,
    data: new SlashCommandBuilder().setName('play').setDescription('Jouer une vidéo depuis YouTube ou d\'autres plateformes supportées!')
        .addStringOption((option) => option.setName('query').setDescription('La vidéo à jouer').setAutocomplete(true).setRequired(true)),
    async autocomplete(interaction) {

        if (!interaction.member.voice.channel) {
            return interaction.respond([{ name: "⚠️ Tu dois être en vocal pour utiliser cette commande", value: "invalid_voice_channel_-1" }]);
        }

        const focusedValue = interaction.options.getFocused();

        if (!focusedValue) {
            return interaction.respond([]);
        }

        try {

            const client = interaction.client;
            let player = await getPlayer(interaction.client, interaction.guild.id);

            if (!player) {
                player = await client.lavalink.createPlayer({
                    guildId: interaction.guild.id,
                    voiceChannelId: interaction.member.voice.channel.id,
                    textChannelId: interaction.channel.id,
                    // optional configurations:
                    selfDeaf: true,
                    selfMute: false,
                    volume: 100
                });
            }

            const choices = await player.search({
                query: focusedValue,
                source: "youtube",
                limit: 5,
            })

            if (!choices || !choices.tracks || choices.tracks.length === 0) {
                return interaction.respond([{ name: "⚠️ Aucune vidéo trouvée pour cette recherche", value: "no_results_found_-1" }]);
            }

            await interaction.respond(choices.tracks.slice(0, 5).map((choice) => ({ name: choice.info.title, value: choice.info.uri })));
        } catch (error) {
            console.error(`Error during autocomplete for /play command: ${error.message}`);
            return interaction.respond([{ name: "⚠️ Une erreur est survenue lors de la recherche de la vidéo", value: "error_occurred_-1" }]);
        } finally {
            const player = await getPlayer(interaction.client, interaction.guild.id);
            if (player && player.state === "CONNECTED" && player.voiceChannelId !== interaction.member.voice.channel.id) {
                await player.destroy();
            }
        }
    },
    async execute(interaction) {

        const query = interaction.options.getString('query');

        if (!interaction.member.voice.channel) {
            return interaction.reply({ content: "⚠️ Tu dois être en vocal pour utiliser cette commande", ephemeral: MessageFlags.Ephemeral });
        }

        if (!query) {
            return interaction.reply({ content: "⚠️ Tu dois fournir une vidéo à jouer", ephemeral: MessageFlags.Ephemeral });
        }

        if (query === "invalid_voice_channel_-1") {
            return interaction.reply({ content: "⚠️ Tu dois être en vocal pour utiliser cette commande", ephemeral: MessageFlags.Ephemeral });
        }

        if (query === "no_results_found_-1") {
            return interaction.reply({ content: "⚠️ Aucune vidéo trouvée pour cette recherche", ephemeral: MessageFlags.Ephemeral });
        }

        if (query === "error_occurred_-1") {
            return interaction.reply({ content: "⚠️ Une erreur est survenue lors de la recherche de la vidéo", ephemeral: MessageFlags.Ephemeral });
        }

        const client = interaction.client;

        let player = await getPlayer(interaction.client, interaction.guild.id);

        if (!player) {
            player = await client.lavalink.createPlayer({
                guildId: interaction.guild.id,
                voiceChannelId: interaction.member.voice.channel.id,
                textChannelId: interaction.channel.id,
                // optional configurations:
                selfDeaf: true,
                selfMute: false,
                volume: 100
            });
        }

        let track = (await player.search({
            query: query,
            source: "youtube",
        })).tracks[0];

        const node = player.node;
        if (!node || !node.connected) {
            await node.connect();
        }

        if (!player.connected) await player.connect();

        if (!track) {
            return interaction.reply({ content: "⚠️ Aucune vidéo trouvée pour cette recherche", flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply();

        track.info.requester = interaction.user;
        track.info.requestDate = new Date();

        if (track.sourceName === "youtube") {
            const newArtworkUrl = await getBestThumbnail(track.info.identifier);
            track.info.artworkUrl = newArtworkUrl || track.info.artworkUrl;
        }

        player.queue.add(track);

        const addSong = new EmbedBuilder()
            .setColor(COLOR_EMBED)
            .setTitle("➕ Ta musique a été ajoutée à la file d'attente :")
            .setDescription(`**[${track.info.title}](${track.info.uri})** | Durée : \`${track.info.isStream == false ? (await formatDuration(track.info.duration)).join(":") : "Stream 🔴"}\``)
            .setThumbnail(track.info.artworkUrl)
            .setFooter({ text: `Demandé par ${track.info.requester.username} | Position n°${player.queue.tracks.length}`, iconURL: track.info.requester.displayAvatarURL() })
            .setTimestamp(track.info.requestDate);

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
            embed.setFooter({ text: `Demandé par ${player.queue.current.info.requester.username} • Loop : ${emojiRepeat} • ${player.queue.tracks.length + 1} morceaux`, iconURL: player.queue.current.info.requester.displayAvatarURL() });

            player.mainMessage.edit({ embeds: [embed] });
        }
    },
};