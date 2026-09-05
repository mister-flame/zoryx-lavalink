const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js');
const { getPlayer } = require('../../functions/getPlayer');
const { COLOR_EMBED } = require('../../util/config');
const { formatDuration } = require('../../functions/formatDuration');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder().setName('nowplaying').setDescription('Voir le morceau en cours !'),
    async execute(interaction) {

        if (!interaction.member.voice.channel) {
            return interaction.reply({ content: "⚠️ Tu dois être en vocal pour utiliser cette commande", flags: MessageFlags.Ephemeral });
        }

        const player = await getPlayer(interaction.client, interaction.guild.id);

        if (!player) {
            return interaction.reply({ content: '❌ Aucun player/morceau pour ce serveur.', flags: MessageFlags.Ephemeral });
        }

        track = player.queue.current;

        if (!track) {
            return interaction.reply({ content: '❌ Aucun morceau en cours.', flags: MessageFlags.Ephemeral });
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
            .setDescription(`**[${track.info.title}](${track.info.uri})**\n${progressBar}\n\`${(await formatDuration(parseInt(currentTime))).join(":")} / ${track.info.isStream == false ? (await formatDuration(totalTime)).join(":") : "Stream 🔴"}\``)
            .setThumbnail(track.info.artworkUrl)
            .setFooter({ text: `Demandé par ${track.info.requester.username}`, iconURL: track.info.requester.displayAvatarURL() })
            .setTimestamp(track.info.requestDate);
        interaction.editReply({ embeds: [nowPlayingEmbed] }).then(msg => {
            setTimeout(() => msg.delete().catch(() => { }), 15000);
        }).catch(() => { });
        return;

    },
};