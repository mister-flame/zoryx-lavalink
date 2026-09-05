const { SlashCommandBuilder, EmbedBuilder, MessageFlags, TextChannel } = require('discord.js');
const { getPlayer } = require('../../functions/getPlayer');
const { createUserEmbed } = require('../../functions/createUserEmbed');

module.exports = {
    name: 'loop',
    cooldown: 5,
    data: new SlashCommandBuilder().setName('loop').setDescription('Mettre en boucle la lecture !')
        .addStringOption((option) => option.setName('mode').setDescription('Le mode de boucle').setRequired(true)
            .addChoices(
                { name: '❌ Désactivé', value: 'off' },
                { name: '🔂 Morceau actuel', value: 'track' },
                { name: '🔁 File d\'attente', value: 'queue' },
            ).setRequired(true)),
    async execute(interaction, p_mode) {

        if (!interaction.member.voice.channel) {
            return interaction.reply({ embeds: [createUserEmbed(interaction, "⚠️ Tu dois être en vocal pour utiliser cette commande")], flags: MessageFlags.Ephemeral });
        }

        const player = await getPlayer(interaction.client, interaction.guild.id);

        if (!player) {
            return interaction.reply({ embeds: [createUserEmbed(interaction, '❌ Aucun player/morceau pour ce serveur.')], flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply();

        let choice = p_mode;

        if (interaction.options) {
            choice = interaction.options.getString('mode');
        } else if (!p_mode) {
            return interaction.editReply({ embeds: [createUserEmbed(interaction, `❌ Précise "track", "queue" ou "off". (Actuellement : \`${player.repeatMode}\`)`)] }).then(() => {
                setTimeout(() => interaction.deleteReply().catch(() => { }), 15000);
            }).catch(() => { });
        }

        if (!choice || (choice !== "track" && choice !== "queue" && choice !== "off")) {
            return interaction.editReply({ embeds: [createUserEmbed(interaction, `❌ Précise "track", "queue" ou "off". (Actuellement : \`${player.repeatMode}\`)`)] }).then(() => {
                setTimeout(() => interaction.deleteReply().catch(() => { }), 15000);
            }).catch(() => { });
        }

        let emojiRepeat;
        switch (choice) {
            case "track":
                emojiRepeat = "🔂";
                break;
            case "queue":
                emojiRepeat = "🔁";
                break;
            case "off":
                emojiRepeat = "❌";
                break;
        }

        player.setRepeatMode(choice);

        if ((player.mainMessage && player.mainMessage.embeds.length > 0) && interaction.channel && interaction.channel instanceof TextChannel && player.mainMessage.editable) {

            const embed = EmbedBuilder.from(player.mainMessage.embeds[0]);
            embed.setFooter({ text: `Demandé par ${interaction.user.username} • Loop : ${emojiRepeat} • ${player.queue.tracks.length + 1} morceaux`, iconURL: interaction.user.displayAvatarURL() });

            player.mainMessage.edit({ embeds: [embed] });
        }

        return interaction.editReply({ embeds: [createUserEmbed(interaction, `${emojiRepeat} Mode boucle définit sur le mode : \`${player.repeatMode}\`.`)] }).then(() => {
            setTimeout(() => interaction.deleteReply().catch(() => { }), 15000);
        }).catch(() => { });
    },
};