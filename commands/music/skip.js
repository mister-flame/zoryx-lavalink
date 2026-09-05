const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getPlayer } = require('../../functions/getPlayer');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder().setName('skip').setDescription('Ignorer le morceau actuel !')
        .addIntegerOption((option) => option.setName('nombre').setDescription('Le nombre de morceaux à ignorer').setMinValue(1).setMaxValue(10)),
    async execute(interaction) {

        if (!interaction.member.voice.channel) {
            return interaction.reply({ content: "⚠️ Tu dois être en vocal pour utiliser cette commande", flags: MessageFlags.Ephemeral });
        }

        const player = await getPlayer(interaction.client, interaction.guild.id);

        if (!player) {
            return interaction.reply({ content: '❌ Aucun player/morceau pour ce serveur.', flags: MessageFlags.Ephemeral }).then(msg => {
                setTimeout(() => msg.delete().catch(() => { }), 15000);
            }).catch(() => { });
        }

        await interaction.deferReply();

        if (player.repeatMode === "track" || (player.repeatMode === "queue" && player.queue.tracks.length === 0)) {
            interaction.editReply({ content: '🔂 Boucle activée, je relance le morceau.' }).then(msg => {
                setTimeout(() => msg.delete().catch(() => { }), 15000);
            }).catch(() => { });
            return player.play(player.queue.current);
        } else if ((player.repeatMode === "off") && player.queue.tracks.length === 0) {
            return player.stopPlaying();
        }

        const value = interaction.options.getInteger('nombre');

        player.skip(value ? value - 1 : 0);
        interaction.editReply({ content: `${value ? `🔂 Je passe au morceau \`${value}\`` : '⏭️ Morceau suivant.'}` }).then(() => {
            setTimeout(() => interaction.deleteReply().catch(() => { }), 15000);
        }).catch(() => { });
    },
};