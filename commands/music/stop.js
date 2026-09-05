const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getPlayer } = require('../../functions/getPlayer');

module.exports = {
    name: 'stop',
    cooldown: 5,
    data: new SlashCommandBuilder().setName('stop').setDescription('Arrêter la lecture et vider la file d\'attente !'),
    async execute(interaction) {

        if (!interaction.member.voice.channel) {
            return interaction.reply({ content: "⚠️ Tu dois être en vocal pour utiliser cette commande", flags: MessageFlags.Ephemeral });
        }

        const player = await getPlayer(interaction.client, interaction.guild.id);

        if (!player) {
            return interaction.reply({ content: '❌ Aucun player/morceau pour ce serveur.', flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply();

        player.stopPlaying();
        updateVoiceStatus(player.voiceChannelId);
        return interaction.editReply({ content: '⏹️ Lecture arrêtée.' }).then(() => {
            setTimeout(() => interaction.deleteReply().catch(() => { }), 15000);
        });
    },
};