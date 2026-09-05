const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js');
const { getPlayer } = require('../../functions/getPlayer');
const { COLOR_EMBED } = require('../../util/config');
const { formatDuration } = require('../../functions/formatDuration');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder().setName('queue').setDescription('Voir la file d\'attente !'),
    async execute(interaction) {

        if (!interaction.member.voice.channel) {
            return interaction.reply({ content: "⚠️ Tu dois être en vocal pour utiliser cette commande", flags: MessageFlags.Ephemeral });
        }

        const player = await getPlayer(interaction.client, interaction.guild.id);

        if (!player) {
            return interaction.reply({ content: '❌ Aucun player/morceau pour ce serveur.', flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply();

        let queue = null;

        if (player && player.queue.current) {

            let totalDuration = parseInt(player.queue.current.info.duration - (Date.now() - player.queue.current.info.startedPlaying));

            queue = `1. [${player.queue.current.info.title}](<${player.queue.current.info.uri}>) \`${player.queue.current.info.isStream == false ? (await formatDuration(parseInt(player.queue.current.info.duration - (Date.now() - player.queue.current.info.startedPlaying)))).join(":") : "Stream 🔴"}\`\n`;

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
                .setFooter({ text: `${player.queue.tracks.length + 1} musique(s) au total`, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp(new Date());

            return interaction.editReply({ embeds: [queueEmbed] }).then(() => {
                setTimeout(() => interaction.deleteReply().catch(() => { }), 15000);
            }).catch(() => { });
        } else {
            const queueEmbed = new EmbedBuilder()
                .setColor(COLOR_EMBED)
                .setTitle("📜 Liste des 10 prochaines musiques :")
                .setDescription("Aucune musique dans la file d'attente.")
                .setFooter({ text: `${player.queue.tracks.length} musique(s) au total`, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp(new Date());

            return interaction.editReply({ embeds: [queueEmbed] }).then(() => {
                setTimeout(() => interaction.deleteReply().catch(() => { }), 15000);
            }).catch(() => { });
        }
    },
};