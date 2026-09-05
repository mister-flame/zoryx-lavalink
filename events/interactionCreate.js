const { Collection, MessageFlags, WebhookClient, EmbedBuilder } = require("discord.js");
const { LOGS_WEBHOOK, COLOR_EMBED } = require("../util/config");

const webhookClientLogs = new WebhookClient({ url: LOGS_WEBHOOK });

module.exports = {
    name: "interactionCreate",
    async execute(client, interaction) {

        if (interaction.user.bot) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (interaction.isChatInputCommand()) {

            const { cooldowns } = interaction.client;

            if (!cooldowns.has(command.data.name)) {
                cooldowns.set(command.data.name, new Collection());
            }
            const now = Date.now();
            const timestamps = cooldowns.get(command.data.name);
            const defaultCooldownDuration = 3;

            const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1_000;
            if (timestamps.has(interaction.user.id)) {
                const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
                if (now < expirationTime) {
                    const expiredTimestamp = Math.round(expirationTime / 1_000);
                    return interaction.reply({
                        content: `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`,
                        flags: MessageFlags.Ephemeral,
                    });
                }
            }

            timestamps.set(interaction.user.id, now);
            setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

            const logsEmbed = new EmbedBuilder()
                .setColor(COLOR_EMBED)
                .setTitle("📥 Interaction reçue !")
                .setDescription(`**Auteur :** ${interaction.user.tag} (${interaction.user.id})\n**Salon :** ${interaction.channel.name} (${interaction.channel.id})\n**Commande :** \`${interaction.commandName}\`\n` + `**Options :** \`${interaction.options.data.map(option => `${option.name}: ${option.value}`).join(", ")}\``)
                .setFooter({ text: `Guild : ${interaction.guild.name} (${interaction.guild.id})`, iconURL: interaction.guild.iconURL() })
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
            if (!command) {
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

            const command = interaction.client.commands.get(commandName);

            const { cooldowns } = interaction.client;

            if (!cooldowns.has(command.data.name)) {
                cooldowns.set(command.data.name, new Collection());
            }
            const now = Date.now();
            const timestamps = cooldowns.get(command.data.name);
            const defaultCooldownDuration = 3;

            const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1_000;
            if (timestamps.has(interaction.user.id)) {
                const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
                if (now < expirationTime) {
                    const expiredTimestamp = Math.round(expirationTime / 1_000);
                    return interaction.reply({
                        content: `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`,
                        flags: MessageFlags.Ephemeral,
                    });
                }
            }

            timestamps.set(interaction.user.id, now);
            setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

            if (!command) {
                console.error(`No command matching ${interaction.customId} was found.`);
                return;
            }

            const logsEmbed = new EmbedBuilder()
                .setColor(COLOR_EMBED)
                .setTitle("📥 Bouton reçu !")
                .setDescription(`**Auteur :** ${interaction.user.tag} (${interaction.user.id})\n**Salon :** ${interaction.channel.name} (${interaction.channel.id})\n**Bouton :** \`${interaction.customId}\``)
                .setFooter({ text: `Guild : ${interaction.guild.name} (${interaction.guild.id})`, iconURL: interaction.guild.iconURL() })
                .setTimestamp();

            webhookClientLogs.send({ embeds: [logsEmbed] }).catch((error) => {
                console.error("Impossible d'envoyer le log de l'interaction :", error);
            });

            try {
                await command.execute(interaction, (interaction.customId === "loopTrack" ? "track" : "queue") ? (interaction.customId === "loopTrack" ? "track" : "queue") : null);
            } catch (error) {
                console.error(error);
            }
        }

        if (!interaction.isChatInputCommand()) return;
        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }
    }
};