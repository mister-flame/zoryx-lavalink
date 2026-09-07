// Dependency imports

import { BotClient } from "../types";

import { ActivityOptions, ActivityType, PresenceStatusData } from "discord.js";
import { getChannelsCount } from "./getChannelsCount";

/**
    * Function to generate a random activity status for the bot that includes information about the number of servers, users, and tracks being played
    * @param {BotClient} client - The Discord client instance
    * @returns {string} - A randomly generated activity status string
*/

export async function updateActivities(client: BotClient) {

    // Define an array of possible activity status messages that include dynamic information about the bot's usage and presence on Discord

    const activities = [
        {
            type: ActivityType.Custom,
            name: `/help | Sur ${client.guilds.cache.size || 0} serveurs 🗨️`,
            state: `/help | Sur ${client.guilds.cache.size || 0} serveurs 🗨️`
        },

        {
            type: ActivityType.Custom,
            name: `/help | Utilisé par ${client.users.cache.size || 0} utilisateurs 👥`,
            state: `/help | Utilisé par ${client.users.cache.size || 0} utilisateurs 👥`
        },

        {
            type: ActivityType.Custom,
            name: `/help | En train de jouer ${client.lavalink.players.size || 0} musiques 🎶`,
            state: `/help | En train de jouer ${client.lavalink.players.size || 0} musiques 🎶`
        },

        {
            type: ActivityType.Custom,
            name: `/help | Gère ${await getChannelsCount() || 0} channel(s) 🗃️`,
            state: `/help | Gère ${await getChannelsCount() || 0} channel(s) 🗃️`
        }
    ] as ActivityOptions[];

    // Define an array of possible activity status types that the bot can have, such as "online", "idle", and "dnd" (do not disturb)

    const status = ["online", "idle", "dnd", "dnd"] as PresenceStatusData[];

    // Randomly select and return one of the activity status messages from the array to be used as the bot's current activity status

    const randomIndex = Math.floor(Math.random() * activities.length);

    // Set the bot's presence with the randomly selected activity status and a randomly selected status type

    if (client.user) {
        client.user.setPresence({
            activities: [activities[randomIndex]],
            status: status[randomIndex]
        });
    }
    return 0;
};