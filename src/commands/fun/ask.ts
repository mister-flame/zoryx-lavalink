import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags, ChatInputCommandInteraction } from 'discord.js';
import { askMistral } from '../../functions/askMistral';
import { BotConfig } from '../../types';

const config = require("../../util/config") as BotConfig;

if (!config.token || !config.clientId) {
    throw new Error("Missing token or clientId in src/config.json or environment variables.");
}

const { COLOR_EMBED } = config;

module.exports = {
    name: 'ask',
    cooldown: 3,
    data: new SlashCommandBuilder().setName('ask').setDescription('Pose une question au bot !')
        .addStringOption(option => option.setName('question').setDescription('La question à poser au bot').setRequired(true))
        .addStringOption(option => option.setName('comportement').setDescription('Le comportement que l\'IA doit avoir au moment de répondre à la question').setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {

        const question = interaction.options.getString('question') as string;
        const behaviour = interaction.options.getString('comportement') as string;

        let answer;

        try {
            answer = await askMistral(question, behaviour);
        } catch (error) {
            console.error('Error occurred while asking Mistral:', error);
            return interaction.reply({ content: 'Une erreur est survenue lors de la réponse du bot.', flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply();

        const askEmbed = new EmbedBuilder()
            .setTitle("❓ " + question)
            .setColor(COLOR_EMBED)
            .setDescription(answer)
            .setFooter({ text: `Demandé par ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        const askButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setLabel("Lien du Github")
                .setStyle(ButtonStyle.Link)
                .setURL("https://github.com/mister-flame/zoryx-lavalink"),

            new ButtonBuilder()
                .setLabel("Ajouter le bot")
                .setStyle(ButtonStyle.Link)
                .setURL("https://discord.com/oauth2/authorize?client_id=1424383941502173306")
        );

        return interaction.editReply({ embeds: [askEmbed], components: [askButtons] });
    },
};