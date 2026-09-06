import { ChatInputCommandInteraction, SlashCommandBuilder, MessageFlags } from "discord.js";

import { getPlayer } from '../../functions/getPlayer';
import { updateVoiceStatus } from '../../functions/updateVoiceStatus';
import { createUserEmbed } from '../../functions/createUserEmbed';
import { PlayerType } from "../../types/player";
import { BotClient } from "../../types";

module.exports = {
    name: 'leave',
    cooldown: 5,
    data: new SlashCommandBuilder().setName('leave').setDescription('Quitter le vocal et vider la file d\'attente !'),
    async execute(interaction: ChatInputCommandInteraction) {

        if (!interaction.guild) {
            return;
        }

        const member = await interaction.guild.members.fetch(interaction.user.id);

        if (!member) {
            return;
        }

        if (!member.voice || !member.voice.channel) {
            return interaction.reply({ embeds: [createUserEmbed(interaction, "⚠️ Tu dois être en vocal pour utiliser cette commande")], flags: MessageFlags.Ephemeral });
        }

        const player = await getPlayer(interaction.client as BotClient, interaction.guild.id) as PlayerType;

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