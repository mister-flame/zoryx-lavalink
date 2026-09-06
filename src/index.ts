import { Client, GatewayIntentBits, Collection, REST, Routes } from "discord.js";
import type { BotClient, BotConfig } from "./types";
import fs from "fs";
import path from "path";

const config = require("./util/config") as BotConfig;

if (!config.token || !config.clientId) {
  throw new Error("Missing token or clientId in src/config.json or environment variables.");
}

const { token, clientId } = config;

// Create bot client with necessary intents to listen to events and interact with Discord API
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
}) as BotClient;

// Import all the commands from the "commands" directory and register them to the client

client.commands = new Collection();
client.cooldowns = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter((file: string) => file.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }
}


const commands = [];

for (const folder of commandFolders) {
  // Grab all the command files from the commands directory you created earlier
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter((file: string) => file.endsWith('.js'));
  // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);
(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);
    const data = await rest.put(Routes.applicationCommands(clientId), { body: commands }) as Object[];
    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    console.error(error);
  }
})();

// Dynamically load event handlers from the "events" directory and register them to the client

const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file: string) => file.endsWith(".js"));

for (const file of eventFiles) {

  const filePath = path.join(eventsPath, file);

  const event = require(filePath);

  if (event.once) {
    client.once(event.name, (...args: any[]) => event.execute(client, ...args));
  } else {
    client.on(event.name, (...args: any[]) => event.execute(client, ...args));
  }
}

// Connect the bot to Discord using the provided token in the configuration file

client.login(token);
