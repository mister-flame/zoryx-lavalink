const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getPlayer } = require('../../functions/getPlayer');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder().setName('leave').setDescription('Quitter le vocal et vider la file d\'attente !'),
    async execute(interaction) {

        if (!interaction.member.voice.channel) {
            return interaction.reply({ content: "⚠️ Tu dois être en vocal pour utiliser cette commande", flags: MessageFlags.Ephemeral });
        }

        const player = await getPlayer(interaction.client, interaction.guild.id);

        if (!player) {
            return interaction.reply({ content: '❌ Aucun player/morceau pour ce serveur.', flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply();

        updateVoiceStatus(player.voiceChannelId);
        player.destroy();
        return interaction.editReply({ content: '👋 Déconnecté.' }).then(() => {
            setTimeout(() => interaction.deleteReply().catch(() => { }), 15000);
        }).catch(() => { });
    },
};