// Dependency imports

const { LavalinkManager } = require("lavalink-client");
const { EmbedBuilder, WebhookClient } = require("discord.js");
const { node, START_WEBHOOK, COLOR_EMBED } = require("../util/config");
const fs = require("fs");
const path = require("path");
const { deleteTmpChannels } = require("../functions/checkTempChannels");
const { updateActivities } = require("../functions/updateActivities");

// Create a WebhookClient instance to send messages to the specified webhook URL for logging bot startup events

const webhookClientStart = new WebhookClient({ url: START_WEBHOOK });

/*
    * Discord.js "clientReady" event handler
    * @param {Client} client - The Discord client instance
*/

module.exports = {
    name: "clientReady",
    once: true,
    async execute(client) {

        // Initialize the LavalinkManager with the specified node configuration and set up event listeners for Lavalink events

        client.lavalink = new LavalinkManager({
            nodes: [node],
            sendToShard: (guildId, payload) =>
                client.guilds.cache.get(guildId)?.shard?.send(payload),
            client: { id: client.user.id, username: client.user.username },
            autoSkip: true,
            playerOptions: {
                clientBasedPositionUpdateInterval: 60,
                defaultSearchPlatform: "youtube",
                volumeDecrementer: 1,
                onDisconnect: { autoReconnect: false, destroyPlayer: true },
                onEmptyQueue: { destroyAfterMs: 120_000 },
            },
            queueOptions: { maxPreviousTracks: 0 },
        });

        // Set up event listeners for Lavalink events to log node connections, errors, and statistics

        client.lavalink.on("nodeConnect", (node) => {
            console.log(`✅ Lavalink Node connecté : ${node.options.id}`);
        });

        client.lavalink.on("nodeError", (node, err) => {
            console.error(`❌ Erreur sur node ${node.options.id} :`, err);
        });

        client.lavalink.on("error", (err) => {
            console.error("Erreur Lavalink Manager :", err);
        });

        client.lavalink.on("nodeStats", (node, stats) => {
            console.log(`Stats de ${node.options.id} :`, stats);
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

        const eventsPath = path.join(__dirname, "../lavalink-events");
        const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith(".js"));

        for (const file of eventFiles) {
            const event = require(path.join(eventsPath, file));
            if (event.once) {
                client.lavalink.once(event.name, (...args) => event.execute(client, ...args));
            } else {
                client.lavalink.on(event.name, (...args) => event.execute(client, ...args));
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

        try {
            deleteTmpChannels(client);
        } catch (error) {
            console.error(error);
        }
    },
};