const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { COLOR_EMBED } = require('../../util/config');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'help',
    cooldown: 3,
    data: new SlashCommandBuilder().setName('help').setDescription('Affiche les commandes disponibles !'),
    async execute(interaction) {

        await interaction.deferReply();

        const commandsPath = path.join(__dirname, '..');
        const musicCommands = fs.readdirSync(path.join(commandsPath, 'music')).filter(file => file.endsWith('.js')).join(', ').replace(/\.js/g, '').split(', ').map(cmd => `\/${cmd}`).join(', ');
        const utilityCommands = fs.readdirSync(path.join(commandsPath, 'utility')).filter(file => file.endsWith('.js')).join(', ').replace(/\.js/g, '').split(', ').map(cmd => `\/${cmd}`).join(', ');
        const funCommands = fs.readdirSync(path.join(commandsPath, 'fun')).filter(file => file.endsWith('.js')).join(', ').replace(/\.js/g, '').split(', ').map(cmd => `\/${cmd}`).join(', ');

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

        const linkButton = new ButtonBuilder()
            .setLabel("Lien du Github")
            .setStyle(ButtonStyle.Link)
            .setURL("https://github.com/mister-flame/zoryx-lavalink");

        const addButton = new ButtonBuilder()
            .setLabel("Ajouter le bot")
            .setStyle(ButtonStyle.Link)
            .setURL("https://discord.com/oauth2/authorize?client_id=1424383941502173306");


        return interaction.editReply({ embeds: [helpEmbed], components: [new ActionRowBuilder().addComponents(linkButton, addButton)] });
    },
};