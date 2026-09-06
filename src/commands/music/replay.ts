import { SlashCommandBuilder, MessageFlags, ChatInputCommandInteraction } from 'discord.js';
import { getPlayer } from '../../functions/getPlayer';
import { createUserEmbed } from '../../functions/createUserEmbed';
import { BotClient } from '../../types';
import { PlayerType } from '../../types/player';

module.exports = {
    name: 'replay',
    cooldown: 5,
    data: new SlashCommandBuilder().setName('replay').setDescription('Rejouer le morceau en cours'),
    async execute(interaction: ChatInputCommandInteraction) {

        if (!interaction.guild) {
            return;
        }

        const member = await interaction.guild.members.fetch(interaction.user.id);

        if (!member.voice.channel) {
            return interaction.reply({ embeds: [createUserEmbed(interaction, "⚠️ Tu dois être en vocal pour utiliser cette commande")], flags: MessageFlags.Ephemeral });
        }

        const player = await getPlayer(interaction.client as BotClient, interaction.guild.id) as PlayerType;

        if (!player) {
            return interaction.reply({ embeds: [createUserEmbed(interaction, '❌ Aucun player/morceau pour ce serveur.')], flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply();

        await player.play({ track: player.queue.current });

        return interaction.editReply({ embeds: [createUserEmbed(interaction, '🔂 Je relance le morceau en cours.')] }).then(() => {
            setTimeout(() => interaction.deleteReply().catch(() => { }), 15000);
        }).catch(() => { });
    },
};