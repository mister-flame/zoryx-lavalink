const { Client, GatewayIntentBits } = require("discord.js");
const { token } = require("./util/config");
const fs = require("fs");
const path = require("path");

// Create bot client with necessary intents to listen to events and interact with Discord API
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Dynamically load event handlers from the "events" directory and register them to the client

const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);

  const event = require(filePath);

  if (event.once) {
    client.once(event.name, (...args) => event.execute(client, ...args));
  } else {
    client.on(event.name, (...args) => event.execute(client, ...args));
  }
}

// Connect the bot to Discord using the provided token in the configuration file

client.login(token);
