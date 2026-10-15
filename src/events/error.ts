// Dependency imports

import { BotClient, BotConfig } from "../types";
import { EmbedBuilder, WebhookClient } from "discord.js";

const config = require("../util/config") as BotConfig;

if (!config.token || !config.clientId) {
    throw new Error("Missing token or clientId in src/config.json or environment variables.");
}

const { COLOR_EMBED, ERROR_WEBHOOK } = config;

/*
    * Discord.js "error" event handler
    * @param {Client} client - The Discord client instance
    * @param {Error} error - The error that occurred
*/

module.exports = {
    name: "error",
    once: false,
    async execute(client: BotClient, error: Error) {

        // Create a WebhookClient instance to send messages to the specified webhook URL for logging bot errors

        const webhookClientError = new WebhookClient({ url: ERROR_WEBHOOK });

        // Create an embed message to log the error details
        
        const errorEmbed = new EmbedBuilder()
            .setColor(COLOR_EMBED)
            .setTitle("❌ An error occurred in the bot")
            .setDescription(`\`\`\`${error.message}\`\`\``)
            .setTimestamp();

        // Send the error embed to the specified webhook for logging

        await webhookClientError.send({ embeds: [errorEmbed] }).catch(console.error);

        // Log the error to the console for debugging purposes
        console.error("An error occurred:", error);
    },
};