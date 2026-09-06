import { Embed, EmbedBuilder, Interaction, Message } from "discord.js";

function getUserFooter(interaction: Interaction) {
    return {
        text: `Demandé par ${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL(),
    };
}

function createUserEmbed(interaction: Interaction, message: string) {
    return new EmbedBuilder()
        .setDescription(message)
        .setFooter(getUserFooter(interaction));
}

function addUserFooter(interaction: Interaction, embed: EmbedBuilder) {
    return embed.setFooter(getUserFooter(interaction));
}

export { createUserEmbed, addUserFooter };