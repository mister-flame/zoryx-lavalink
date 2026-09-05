const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getPlayer } = require('../../functions/getPlayer');
const { updateVoiceStatus } = require('../../functions/updateVoiceStatus');
const { createUserEmbed } = require('../../functions/createUserEmbed');

module.exports = {
    name: 'leave',
    cooldown: 5,
    data: new SlashCommandBuilder().setName('leave').setDescription('Quitter le vocal et vider la file d\'attente !'),
    async execute(interaction) {

        if (!interaction.member.voice.channel) {
            return interaction.reply({ embeds: [createUserEmbed(interaction, "⚠️ Tu dois être en vocal pour utiliser cette commande")], flags: MessageFlags.Ephemeral });
        }

        const player = await getPlayer(interaction.client, interaction.guild.id);

        if (!player) {
            return interaction.reply({ embeds: [createUserEmbed(interaction, '❌ Aucun player/morceau pour ce serveur.')], flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply();

        updateVoiceStatus(player.voiceChannelId);
        player.destroy();
        return interaction.editReply({ embeds: [createUserEmbed(interaction, '👋 Déconnecté.')] }).then(() => {
            setTimeout(() => interaction.deleteReply().catch(() => { }), 15000);
        }).catch(() => { });
    },
};