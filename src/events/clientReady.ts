// Dependency imports

import { GuildShardPayload, LavalinkNode, LavalinkManager } from "lavalink-client";
import { BotClient, BotConfig } from "../types";
import { EmbedBuilder, WebhookClient } from "discord.js";
import fs from "fs";
import path from "path";
import { deleteTmpChannels } from "../functions/checkTempChannels";
import { updateActivities } from "../functions/updateActivities";

const config = require("../util/config") as BotConfig;

if (!config.token || !config.clientId) {
    throw new Error("Missing token or clientId in src/config.json or environment variables.");
}

const { COLOR_EMBED, START_WEBHOOK, node } = config;

// Create a WebhookClient instance to send messages to the specified webhook URL for logging bot startup events

const webhookClientStart = new WebhookClient({ url: START_WEBHOOK });

/*
    * Discord.js "clientReady" event handler
    * @param {Client} client - The Discord client instance
*/

module.exports = {
    name: "clientReady",
    once: true,
    async execute(client: BotClient) {

        // Initialize the LavalinkManager with the specified node configuration and set up event listeners for Lavalink events

        if (!client.user) return;

        client.lavalink = new LavalinkManager({
            nodes: [node],
            sendToShard: (guildId: string, payload: GuildShardPayload) => {
                const guild = client.guilds.cache.get(guildId);
                if (guild) guild.shard.send(payload);
            },

            client: { id: client.user.id, username: client.user.username },
            autoSkip: true,
            playerOptions: {
                onDisconnect: {
                    autoReconnect: false,
                    destroyPlayer: true
                },
                onEmptyQueue: {
                    destroyAfterMs: 300_000
                },
            },
            queueOptions: { maxPreviousTracks: 0 },
            autoSkipOnResolveError: true
        });

        // Set up event listeners for Lavalink events to log node connections, errors, and statistics

        client.lavalink.nodeManager.on("connect", (node: LavalinkNode) => {
            if (node) {
                console.log(`✅ Lavalink Node connecté : ${node.options.id}`);
            }
        });

        client.lavalink.nodeManager.on("error", (node: LavalinkNode, error: Error) => {
            console.error(`❌ Erreur sur node ${node.options.id} :`, error);
        });

        client.lavalink.nodeManager.on("disconnect", (node: LavalinkNode, reason: { code?: number; reason?: string }) => {
            console.warn(`❌ Node ${node.options.id} disconnected:`, reason.reason ?? reason.code ?? "unknown reason");
            setTimeout(() => {
                if (!node.isAlive) {
                    node.connect();
                }
            }, 5000);
        });

        client.lavalink.nodeManager.on("reconnecting", (node: LavalinkNode) => {
            console.log(`Node ${node.options.id} reconnexion en cours...`);

            // Reconnect all players that were previously playing before the node disconnected
            for (const [_, player] of client.lavalink.players) {
                if (player.playing) {
                    player.connect?.();
                }
            }
        });

        // Attempt to initialize the LavalinkManager and catch any errors that occur during initialization

        try {
            await client.lavalink.init({ ...client.user });
        } catch (error) {
            console.error("Erreur lors de l'initialisation de Lavalink:", error);
        }

        // Listen to raw events from the Discord client and send them to Lavalink for processing

        client.on("raw", (d) => client.lavalink.sendRawData(d));

        // Load and set up event listeners for all Lavalink events defined in the "lavalink-events" directory

        const eventsPath = path.join(process.cwd(), "dist", "lavalink-events");
        const eventFiles = fs.readdirSync(eventsPath).filter((f: string) => f.endsWith(".js"));

        for (const file of eventFiles) {
            const event = require(path.join(eventsPath, file));
            if (event.once) {
                client.lavalink.once(event.name, (...args: unknown[]) => event.execute(client, ...args));
            } else {
                client.lavalink.on(event.name, (...args: unknown[]) => event.execute(client, ...args));
            }
        }

        // Set the bot's activity status to a random activity from the generated list every 2 minutes

        setInterval(async () => {
            updateActivities(client);
        }, 2 * 60 * 1000);

        // Set the initial activity status of the bot when it becomes ready

        updateActivities(client);

        // Log a message to the console indicating that the bot is ready to be used

        console.log("Le bot Discord est prêt à être utilisé !");

        // Create an embed message to announce that the bot is ready and send it to the specified webhook for logging purposes

        const Démarrage = new EmbedBuilder()
            .setColor(COLOR_EMBED)
            .setDescription(`**${client.user.tag} est prêt !** ✅`)
            .setFooter({ text: `Made by MR.Flame` })
            .setTimestamp();

        console.log(`${client.user.tag} is online! ✅`);

        // Update the webhook client's name and avatar to reflect the bot's current username and avatar, then send the startup embed message to the webhook

        await webhookClientStart.edit({
            name: `${client.user.username} | Start`,
            avatar: client.user.displayAvatarURL({ extension: "png", forceStatic: false, size: 1024 }),
        });

        // Attempt to send the startup embed message to the webhook and catch any errors that occur during the sending process

        try {
            webhookClientStart.send({ embeds: [Démarrage] });
        } catch (error) {
            console.error(error);
        }

        setInterval(async () => {
            for (const [_, node] of client.lavalink.nodeManager.nodes) {
                if (node.reconnectionState === 'IDLE' && !node.isAlive) {
                    console.warn(`[Watchdog] Node mort détecté, reconnexion...`);
                    try {
                        await node.connect();
                    } catch (e) {
                        console.error('[Watchdog] Échec reconnexion:', e);
                    }
                }
            }
        }, 60_000); // Check every minute if the node is alive and attempt to reconnect if it's not

        // Attempt to delete any temporary voice channels that may have been left over from previous sessions and catch any errors that occur during the deletion process

        try {
            deleteTmpChannels(client);
        } catch (error) {
            console.error(error);
        }
    },
};