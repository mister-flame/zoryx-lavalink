const { EmbedBuilder } = require('discord.js');

function getUserFooter(interaction) {
    return {
        text: `Demandé par ${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL(),
    };
}

function createUserEmbed(interaction, message) {
    return new EmbedBuilder()
        .setDescription(message)
        .setFooter(getUserFooter(interaction));
}

function addUserFooter(interaction, embed) {
    return embed.setFooter(getUserFooter(interaction));
}

module.exports = { createUserEmbed, addUserFooter };