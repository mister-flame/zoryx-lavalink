const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { COLOR_EMBED } = require('../../util/config');
const { getPlayer } = require('../../functions/getPlayer');

module.exports = {
    cooldown: 3,
    data: new SlashCommandBuilder().setName('help').setDescription('Replies with help information!'),
    async execute(interaction) {

        const helpEmbed = new EmbedBuilder()
            .setColor(COLOR_EMBED)
            .setTitle("📜 Commandes disponibles :")
            .setDescription(`Voici les commandes que tu peux utiliser avec ce bot de musique Lavalink :\n
                            \`/play <lien ou recherche>\` - Ajoute une ou plusieurs musiques à la file d'attente. (YouTube uniquement)\n
                            \`/skip [nombre]\` - Passe au morceau suivant ou aux morceaux spécifiés.\n
                            \`/stop\` - Arrête la lecture et vide la file d'attente.\n
                            \`/leave\` - Déconnecte le bot du salon vocal.\n
                            \`/loop <track|queue|off>\` - Définit le mode de boucle.\n
                            \`/queue\` - Affiche la file d'attente actuelle.\n
                            \`/ping\` - Obtenir le temps de réponse du bot.\n
                            \`/help\` - Affiche ce message d'aide.\n
                            \`/replay\` - Relance le morceau en cours.\n
                            \`/nowplaying\` - Affiche la musique en cours de lecture.\n
                            \`/seek <durée>\` - Se déplace à une position spécifique dans la musique (ex: \`1m30s\`, \`90s\`, etc. ou \`1:00\`, \`1:00:00\`, etc.).\n
                            Amuse-toi bien ! 🎶`)
            .setFooter({ text: `Demandé par ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        const linkButton = new ButtonBuilder()
            .setLabel("Lien du Github")
            .setStyle(ButtonStyle.Link)
            .setURL("https://github.com/mister-flame/zoryx-lavalink");


        return interaction.editReply({ embeds: [helpEmbed], components: [new ActionRowBuilder().addComponents(linkButton)] });
    },
};