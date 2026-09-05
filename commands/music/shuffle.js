const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getPlayer } = require('../../functions/getPlayer');

module.exports = {
    name: 'shuffle',
    cooldown: 5,
    data: new SlashCommandBuilder().setName('shuffle').setDescription('Mélanger la file d\'attente'),
    async execute(interaction) {

        if (!interaction.member.voice.channel) {
            return interaction.reply({ content: "⚠️ Tu dois être en vocal pour utiliser cette commande", flags: MessageFlags.Ephemeral });
        }

        const player = await getPlayer(interaction.client, interaction.guild.id);

        if (!player) {
            return interaction.reply({ content: '❌ Aucun player/morceau pour ce serveur.', flags: MessageFlags.Ephemeral });
        }

        if (player.queue.tracks.length < 3) {
            return interaction.reply({ content: '❌ Il doit y avoir au moins 3 morceaux dans la file d\'attente pour mélanger. (Morceau en cours non compris)' }).then(msg => {
                setTimeout(() => msg.delete().catch(() => { }), 15000);
            }).catch(() => { });
        }

        await interaction.deferReply();

        player.queue.shuffle();
        return interaction.editReply({ content: `🔀 \`${player.queue.tracks.length}\` morceaux mélangés.` }).then(() => {
            setTimeout(() => interaction.deleteReply().catch(() => { }), 15000);
        }).catch(() => { });
    },
};