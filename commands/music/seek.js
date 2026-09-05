const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getPlayer } = require('../../functions/getPlayer');
const { formatDuration } = require('../../functions/formatDuration');
const ms = require('ms');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder().setName('seek').setDescription('Se déplacer dans la musique')
        .addStringOption(option =>
            option.setName('time')
                .setDescription('Durée à laquelle se déplacer (ex: 1s, 1m, 1h, 1:00, 1:00:00)')
                .setRequired(true)),
    async execute(interaction) {

        if (!interaction.member.voice.channel) {
            return interaction.reply({ content: "⚠️ Tu dois être en vocal pour utiliser cette commande", flags: MessageFlags.Ephemeral });
        }

        const player = await getPlayer(interaction.client, interaction.guild.id);

        if (!player) {
            return interaction.reply({ content: '❌ Aucun player/morceau pour ce serveur.', flags: MessageFlags.Ephemeral });
        }

        track = player.queue.current;

        if (track.info.isStream == true) {
            return interaction.reply({ content: '❌ Impossible de seek une musique en stream.', flags: MessageFlags.Ephemeral }).catch(() => { });
        }

        if (!interaction.options.getString('time')) {
            return interaction.reply({ content: '❌ Précise une durée à laquelle se déplacer. Utilise le format `1s`, `1m`, `1h`, etc. ou `1:00`, `1:00:00`, etc.', flags: MessageFlags.Ephemeral }).catch(() => { });
        }

        let arg = interaction.options.getString('time');
        let time = ms(arg);

        if (!time && time != 0) {
            if (arg.includes(":")) {
                const timeParts = arg.split(":").map(part => parseInt(part));
                if (timeParts.some(isNaN)) {
                    return interaction.reply({ content: '❌ Durée invalide. Utilise le format `1s`, `1m`, `1h`, etc. ou `1:00`, `1:00:00`, etc.', flags: MessageFlags.Ephemeral }).catch(() => { });
                }
                if (timeParts.length > 3) {
                    return interaction.reply({ content: '❌ Durée invalide. Utilise le format `1s`, `1m`, `1h`, etc. ou `1:00`, `1:00:00`, etc.', flags: MessageFlags.Ephemeral }).catch(() => { });
                }
                time = 0;
                for (let i = timeParts.length - 1; i >= 0; i--) {
                    time += timeParts[i] * Math.pow(60, timeParts.length - 1 - i) * 1000;
                }
            } else {
                return interaction.reply({ content: '❌ Précise une durée valide. Utilise le format `1s`, `1m`, `1h`, etc. ou `1:00`, `1:00:00`, etc.', flags: MessageFlags.Ephemeral }).catch(() => { });
            }
        }

        if (isNaN(time)) {
            return interaction.reply({ content: '❌ Durée invalide. Utilise le format `1s`, `1m`, `1h`, etc.', flags: MessageFlags.Ephemeral }).catch(() => { });
        }

        if (time < 0 || time > track.info.duration) {
            return interaction.reply({ content: `❌ La durée doit être comprise entre \`0\` et \`${(await formatDuration(track.info.duration)).join(":")}\`.`, flags: MessageFlags.Ephemeral }).catch(() => { });
        }

        await interaction.deferReply();

        track.info.startedPlaying = Date.now() - time;
        await player.seek(time);

        return interaction.editReply({ content: `⏩ Je me déplace à \`${((await formatDuration(time)).join(":"))}\` dans la musique.` }).then(() => {
            setTimeout(() => interaction.deleteReply().catch(() => { }), 15000);
        }).catch(() => { });
    }
};