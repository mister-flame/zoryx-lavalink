const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getPlayer } = require('../../functions/getPlayer');
const { createUserEmbed } = require('../../functions/createUserEmbed');

module.exports = {
    name: 'replay',
    cooldown: 5,
    data: new SlashCommandBuilder().setName('replay').setDescription('Rejouer le morceau en cours'),
    async execute(interaction) {

        if (!interaction.member.voice.channel) {
            return interaction.reply({ embeds: [createUserEmbed(interaction, "⚠️ Tu dois être en vocal pour utiliser cette commande")], flags: MessageFlags.Ephemeral });
        }

        const player = await getPlayer(interaction.client, interaction.guild.id);

        if (!player) {
            return interaction.reply({ embeds: [createUserEmbed(interaction, '❌ Aucun player/morceau pour ce serveur.')], flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply();

        await player.play(player.queue.current);

        return interaction.editReply({ embeds: [createUserEmbed(interaction, '🔂 Je relance le morceau en cours.')] }).then(() => {
            setTimeout(() => interaction.deleteReply().catch(() => { }), 15000);
        }).catch(() => { });
    },
};