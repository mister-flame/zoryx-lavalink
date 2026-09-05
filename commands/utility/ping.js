const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { COLOR_EMBED } = require('../../util/config');
const { getPlayer } = require('../../functions/getPlayer');

module.exports = {
    cooldown: 3,
    data: new SlashCommandBuilder().setName('ping').setDescription('Replies with Pong!'),
    async execute(interaction) {

        const client = interaction.client;

        await interaction.deferReply();

        const latency = Date.now() - interaction.createdTimestamp;

        let averageNodeLatency = 0;

        client.lavalink.nodeManager.nodes.forEach(node => {
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

        if (await getPlayer(client, interaction.guild.id)) {
            pingEmbed.addFields({ name: "🎵 Player Ping :", value: `\`${player.ping.ws / 1000}s (${player.ping.ws}ms)\`` });
        }

        const linkButton = new ButtonBuilder()
            .setLabel("Lien du Github")
            .setStyle(ButtonStyle.Link)
            .setURL("https://github.com/mister-flame/zoryx-lavalink");


        return interaction.editReply({ embeds: [pingEmbed], components: [new ActionRowBuilder().addComponents(linkButton)] });
    },
};