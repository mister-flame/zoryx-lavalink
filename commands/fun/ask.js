const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const { askMistral } = require('../../functions/askMistral');
const { COLOR_EMBED } = require('../../util/config');

module.exports = {
    name: 'ask',
    cooldown: 3,
    data: new SlashCommandBuilder().setName('ask').setDescription('Pose une question au bot !')
        .addStringOption(option => option.setName('question').setDescription('La question à poser au bot').setRequired(true)),
    async execute(interaction) {

        let answer;

        try {
            answer = await askMistral(interaction.options.getString('question'));
        } catch (error) {
            console.error('Error occurred while asking Mistral:', error);
            return interaction.editReply({ content: 'Une erreur est survenue lors de la réponse du bot.', flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply();

        const askEmbed = new EmbedBuilder()
            .setColor(COLOR_EMBED)
            .setDescription(answer)
            .setFooter({ text: `Demandé par ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        const linkButton = new ButtonBuilder()
            .setLabel("Lien du Github")
            .setStyle(ButtonStyle.Link)
            .setURL("https://github.com/mister-flame/zoryx-lavalink");

        const addButton = new ButtonBuilder()
            .setLabel("Ajouter le bot")
            .setStyle(ButtonStyle.Link)
            .setURL("https://discord.com/oauth2/authorize?client_id=1424383941502173306");

        return interaction.editReply({ embeds: [askEmbed], components: [new ActionRowBuilder().addComponents(linkButton, addButton)] });
    },
};