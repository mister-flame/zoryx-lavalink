import { Interaction, Collection, MessageFlags, WebhookClient, EmbedBuilder, CommandInteraction, TextChannel, VoiceChannel, InteractionType } from "discord.js";
import { BotClient, BotConfig } from "../types";

const config = require("../util/config") as BotConfig;

if (!config.token || !config.clientId) {
    throw new Error("Missing token or clientId in src/config.json or environment variables.");
}

const { LOGS_WEBHOOK, COLOR_EMBED } = config;

const webhookClientLogs = new WebhookClient({ url: LOGS_WEBHOOK });

module.exports = {
    name: "interactionCreate",
    async execute(client: BotClient, interaction: Interaction) {

        if (!interaction.guild) return;

        if (!interaction.channel) return;

        if (!(interaction.channel instanceof TextChannel) && !(interaction.channel instanceof VoiceChannel)) return;

        if (interaction.user.bot) return;

        if (interaction.isChatInputCommand()) {

            const command = client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            const { cooldowns } = client;

            if (!cooldowns.has(command.data.name)) {
                cooldowns.set(command.data.name, new Collection());
            }
            const now = Date.now();
            const timestamps = cooldowns.get(command.data.name);
            const defaultCooldownDuration = 3;

            const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1_000;
            if (timestamps && timestamps.has(interaction.user.id)) {
                const expirationTime = timestamps.get(interaction.user.id)! + cooldownAmount;
                if (now < expirationTime) {
                    const expiredTimestamp = Math.round(expirationTime / 1_000);
                    return interaction.reply({
                        content: `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`,
                        flags: MessageFlags.Ephemeral,
                    });
                }
            }

            if (timestamps) {
                timestamps.set(interaction.user.id, now);
                setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
            }

            const logsEmbed = new EmbedBuilder()
                .setColor(COLOR_EMBED)
                .setTitle("📥 Interaction reçue !")
                .setDescription(`**Auteur :** ${interaction.user.tag} (${interaction.user.id})\n**Salon :** ${interaction.channel.name} (${interaction.channel.id})\n**Commande :** \`${interaction.commandName}\`\n` + `**Options :** \`${interaction.options.data.map(option => `${option.name}: ${option.value}`).join(", ")}\``)
                .setFooter({ text: `Guild : ${interaction.guild.name} (${interaction.guild.id})`, iconURL: interaction.guild.iconURL() ?? undefined })
                .setTimestamp();

            webhookClientLogs.send({ embeds: [logsEmbed] }).catch((error) => {
                console.error("Impossible d'envoyer le log de l'interaction :", error);
            });

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({
                        content: 'There was an error while executing this command!',
                        flags: MessageFlags.Ephemeral,
                    });
                } else {
                    await interaction.reply({
                        content: 'There was an error while executing this command!',
                        flags: MessageFlags.Ephemeral,
                    });
                }
            }
        } else if (interaction.isAutocomplete()) {
            const command = client.commands.get(interaction.commandName);

            if (!command || typeof command.autocomplete !== "function") {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }
            try {
                await command.autocomplete(interaction);
            } catch (error) {
                console.error(error);
            }
        } else if (interaction.isButton()) {

            let commandName = interaction.customId;

            if (interaction.customId === "loopTrack" || interaction.customId === "loopQueue") {
                commandName = "loop";
            }

            const command = client.commands.get(commandName);

            const { cooldowns } = client;

            if (cooldowns && command && !cooldowns.has(command.data.name)) {
                cooldowns.set(command.data.name, new Collection());
            }

            if (!command) {
                console.log("Unknown command!")
                return;
            }

            const now = Date.now();
            const timestamps = cooldowns.get(command.data.name);
            const defaultCooldownDuration = 3;

            const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1_000;
            if (timestamps && timestamps.has(interaction.user.id)) {
                const expirationTime = timestamps.get(interaction.user.id)! + cooldownAmount;
                if (now < expirationTime) {
                    const expiredTimestamp = Math.round(expirationTime / 1_000);
                    return interaction.reply({
                        content: `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`,
                        flags: MessageFlags.Ephemeral,
                    });
                }
            }

            if (timestamps) {
                timestamps.set(interaction.user.id, now);
                setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
            }

            if (!command) {
                console.error(`No command matching ${interaction.customId} was found.`);
                return;
            }

            const logsEmbed = new EmbedBuilder()
                .setColor(COLOR_EMBED)
                .setTitle("📥 Bouton reçu !")
                .setDescription(`**Auteur :** ${interaction.user.tag} (${interaction.user.id})\n**Salon :** ${interaction.channel.name} (${interaction.channel.id})\n**Bouton :** \`${interaction.customId}\``)
                .setFooter({ text: `Guild : ${interaction.guild.name} (${interaction.guild.id})`, iconURL: interaction.guild.iconURL() ?? undefined })
                .setTimestamp();

            webhookClientLogs.send({ embeds: [logsEmbed] }).catch((error) => {
                console.error("Impossible d'envoyer le log de l'interaction :", error);
            });

            try {
                await command.execute(interaction, (interaction.customId === "loopTrack" ? "track" : "queue"));
            } catch (error) {
                console.error(error);
            }
        }

    }
};