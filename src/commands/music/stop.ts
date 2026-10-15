import { SlashCommandBuilder, MessageFlags, ChatInputCommandInteraction } from 'discord.js';
import { getPlayer } from '../../functions/getPlayer';
import { createUserEmbed } from '../../functions/createUserEmbed';
import { updateVoiceStatus } from '../../functions/updateVoiceStatus';
import { BotClient } from '../../types';
import { PlayerType } from '../../types/player';

module.exports = {
    name: 'stop',
    cooldown: 5,
    data: new SlashCommandBuilder().setName('stop').setDescription('Arrêter la lecture et vider la file d\'attente !'),
    async execute(interaction: ChatInputCommandInteraction) {

        if (!interaction.guild) {
            return;
        }

        const member = await interaction.guild.members.fetch(interaction.user.id);

        if (!member.voice.channel) {
            return interaction.editReply({ embeds: [createUserEmbed(interaction, "⚠️ Tu dois être en vocal pour utiliser cette commande")] });
        }

        const player = await getPlayer(interaction.client as BotClient, interaction.guild.id) as PlayerType;

        if (!player) {
            return interaction.editReply({ embeds: [createUserEmbed(interaction, '❌ Aucun player/morceau pour ce serveur.')] });
        }

        player.stopPlaying();
        updateVoiceStatus(player.voice.channelId as string);
        return interaction.editReply({ embeds: [createUserEmbed(interaction, '⏹️ Lecture arrêtée.')] }).then(() => {
            setTimeout(() => interaction.deleteReply().catch(() => { }), 15000);
        });
    },
};