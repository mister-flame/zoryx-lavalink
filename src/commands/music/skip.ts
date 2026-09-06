import { SlashCommandBuilder, MessageFlags, ChatInputCommandInteraction } from 'discord.js';
import { getPlayer } from '../../functions/getPlayer';
import { BotClient } from '../../types';
import { createUserEmbed } from '../../functions/createUserEmbed';
import { TrackType } from '../../types/track';

module.exports = {
    name: 'skip',
    cooldown: 5,
    data: new SlashCommandBuilder().setName('skip').setDescription('Ignorer le morceau actuel !')
        .addIntegerOption((option) => option.setName('nombre').setDescription('Le nombre de morceaux à ignorer').setMinValue(1).setMaxValue(10)),
    async execute(interaction: ChatInputCommandInteraction) {

        if (!interaction.guild) {
            return;
        }

        const member = await interaction.guild.members.fetch(interaction.user.id);

        if (!member.voice.channel) {
            return interaction.reply({ embeds: [createUserEmbed(interaction, "⚠️ Tu dois être en vocal pour utiliser cette commande")], flags: MessageFlags.Ephemeral });
        }

        const player = await getPlayer(interaction.client as BotClient, interaction.guild.id);

        if (!player) {
            return interaction.reply({ embeds: [createUserEmbed(interaction, '❌ Aucun player/morceau pour ce serveur.')], flags: MessageFlags.Ephemeral }).then(msg => {
                setTimeout(() => msg.delete().catch(() => { }), 15000);
            }).catch(() => { });
        }

        await interaction.deferReply();

        if (player.repeatMode === "track" || (player.repeatMode === "queue" && player.queue.tracks.length === 0)) {
            interaction.editReply({ embeds: [createUserEmbed(interaction, '🔂 Boucle activée, je relance le morceau.')] }).then(msg => {
                setTimeout(() => msg.delete().catch(() => { }), 15000);
            }).catch(() => { });
            return player.play({ track: player.queue.current as TrackType });
        } else if ((player.repeatMode === "off") && player.queue.tracks.length === 0) {
            return player.stopPlaying();
        }

        let value;

        if (interaction.options && interaction.options.getInteger('nombre')) {
            value = interaction.options.getInteger('nombre');
        } else {
            value = 0;
        }

        player.skip(value ? value - 1 : 0);
        return interaction.editReply({ embeds: [createUserEmbed(interaction, `${value ? `🔂 Je passe au morceau \`${value}\`` : '⏭️ Morceau suivant.'}`)] }).then(() => {
            setTimeout(() => interaction.deleteReply().catch(() => { }), 15000);
        }).catch(() => { });
    },
};