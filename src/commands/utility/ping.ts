import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";
import { BotClient, BotConfig } from "../../types";
import { getPlayer } from '../../functions/getPlayer';

const config = require("../../util/config") as BotConfig;

if (!config.token || !config.clientId) {
    throw new Error("Missing token or clientId in src/config.json or environment variables.");
}

const { COLOR_EMBED } = config;

module.exports = {
    name: 'ping',
    cooldown: 3,
    data: new SlashCommandBuilder().setName('ping').setDescription('Répond avec Pong !'),
    async execute(interaction: ChatInputCommandInteraction) {

        const client = interaction.client as BotClient;

        const latency = Date.now() - interaction.createdTimestamp;

        let averageNodeLatency = 0;

        client.lavalink.nodeManager.nodes.forEach((node: any) => {
            if (node.connected) {
                if (node.heartbeatLatency && !isNaN(node.heartbeatLatency) && node.heartbeatLatency >= 0) {
                    averageNodeLatency += node.heartbeatLatency;
                }
            }
        });

        averageNodeLatency = averageNodeLatency / client.lavalink.nodeManager.nodes.size;

        const apiLatency = client.ws.ping;

        const pingEmbed = new EmbedBuilder()
            .setColor(COLOR_EMBED)
            .setTitle("🏓 Pong !")
            .setDescription(`**Latence du bot :** \`${latency / 1000}s (${latency}ms)\`\n**Latence API :** \`${apiLatency / 1000}s (${apiLatency}ms)\`\n**Latence avec le Serveur Lavalink :** \`${averageNodeLatency < 0 || isNaN(averageNodeLatency) ? "N/A (pas de node connecté)" : `${averageNodeLatency.toFixed(2)}ms`}\``)
            .setFooter({ text: `Demandé par ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        if (!interaction.guild) {
            return interaction.reply({ content: "La commande n'a pas été lancé d'un serveur !", flags: MessageFlags.Ephemeral })
        }

        await interaction.deferReply();

        const player = await getPlayer(client, interaction.guild.id);

        if (player) {
            pingEmbed.addFields({ name: "🎵 Player Ping :", value: `\`${player.ping.ws / 1000}s (${player.ping.ws}ms)\`` });
        }

        const pingButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setLabel("Lien du Github")
                .setStyle(ButtonStyle.Link)
                .setURL("https://github.com/mister-flame/zoryx-lavalink"),
            new ButtonBuilder()
                .setLabel("Ajouter le bot")
                .setStyle(ButtonStyle.Link)
                .setURL("https://discord.com/oauth2/authorize?client_id=1424383941502173306"));


        return interaction.editReply({ embeds: [pingEmbed], components: [pingButtons] });
    },
};