import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ChatInputCommandInteraction } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { BotConfig } from '../../types';

const config = require("../../util/config") as BotConfig;

if (!config.token || !config.clientId) {
    throw new Error("Missing token or clientId in src/config.json or environment variables.");
}

const { COLOR_EMBED } = config;

module.exports = {
    name: 'help',
    cooldown: 3,
    data: new SlashCommandBuilder().setName('help').setDescription('Affiche les commandes disponibles !'),
    async execute(interaction: ChatInputCommandInteraction) {

        await interaction.deferReply();

        const commandsPath = path.join(__dirname, '..');
        const musicCommands = fs.readdirSync(path.join(commandsPath, 'music')).filter((file: string) => file.endsWith('.ts')).join(', ').replace(/\.ts/g, '').split(', ').map(cmd => `\/${cmd}`).join(', ');
        const utilityCommands = fs.readdirSync(path.join(commandsPath, 'utility')).filter((file: string) => file.endsWith('.ts')).join(', ').replace(/\.ts/g, '').split(', ').map(cmd => `\/${cmd}`).join(', ');
        const funCommands = fs.readdirSync(path.join(commandsPath, 'fun')).filter((file: string) => file.endsWith('.ts')).join(', ').replace(/\.ts/g, '').split(', ').map(cmd => `\/${cmd}`).join(', ');

        const helpEmbed = new EmbedBuilder()
            .setColor(COLOR_EMBED)
            .setTitle("📜 Commandes disponibles :")
            .setDescription(
                `Voici les commandes que tu peux utiliser avec ce bot de musique Lavalink :\n\n` +
                `**Musique** :\n\`${musicCommands}\`\n\n` +
                `**Utilité** :\n\`${utilityCommands}\`\n\n` +
                `**Fun** :\n\`${funCommands}\`\n\n` +
                `Amuse-toi bien ! 🎶`
            )
            .setFooter({ text: `Demandé par ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        const helpButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setLabel("Lien du Github")
                .setStyle(ButtonStyle.Link)
                .setURL("https://github.com/mister-flame/zoryx-lavalink"),
            new ButtonBuilder()
                .setLabel("Ajouter le bot")
                .setStyle(ButtonStyle.Link)
                .setURL("https://discord.com/oauth2/authorize?client_id=1424383941502173306"));


        return interaction.editReply({ embeds: [helpEmbed], components: [helpButtons] });
    },
};