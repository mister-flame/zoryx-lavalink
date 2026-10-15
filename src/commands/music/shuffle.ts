import { ChatInputCommandInteraction, SlashCommandBuilder, MessageFlags } from "discord.js";
import { getPlayer } from '../../functions/getPlayer';
import { createUserEmbed } from '../../functions/createUserEmbed';
import { BotClient } from "../../types";

module.exports = {
    name: 'shuffle',
    cooldown: 5,
    data: new SlashCommandBuilder().setName('shuffle').setDescription('Mélanger la file d\'attente'),
    async execute(interaction: ChatInputCommandInteraction) {

        if (!interaction.guild) {
            return;
        }

        const member = await interaction.guild.members.fetch(interaction.user.id);

        if (!member.voice.channel) {
            return interaction.editReply({ embeds: [createUserEmbed(interaction, "⚠️ Tu dois être en vocal pour utiliser cette commande")] });
        }

        const player = await getPlayer(interaction.client as BotClient, interaction.guild.id);

        if (!player) {
            return interaction.editReply({ embeds: [createUserEmbed(interaction, '❌ Aucun player/morceau pour ce serveur.')] });
        }

        if (player.queue.tracks.length < 3) {
            return interaction.editReply({ embeds: [createUserEmbed(interaction, '❌ Il doit y avoir au moins 3 morceaux dans la file d\'attente pour mélanger. (Morceau en cours non compris)')] }).then(msg => {
                setTimeout(() => msg.delete().catch(() => { }), 15000);
            }).catch(() => { });
        }

        player.queue.shuffle();
        return interaction.editReply({ embeds: [createUserEmbed(interaction, `🔀 \`${player.queue.tracks.length}\` morceaux mélangés.`)] }).then(() => {
            setTimeout(() => interaction.deleteReply().catch(() => { }), 15000);
        }).catch(() => { });
    },
};