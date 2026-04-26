// Dependency imports

const { ActivityType } = require("discord.js");
const { prefix } = require("../util/config");
const { getChannelsCount } = require("../functions/getChannelsCount");

/*
    * Function to generate a random activity status for the bot that includes information about the number of servers, users, and tracks being played
    * @param {Client} client - The Discord client instance
    * @returns {string} - A randomly generated activity status string
*/

module.exports.updateActivities = async function updateActivities(client) {

    // Define an array of possible activity status messages that include dynamic information about the bot's usage and presence on Discord

    const activities = [
        {
            type: ActivityType.Custom,
            name: `${prefix}help | Sur ${client.guilds.cache.size} serveurs 🗨️`,
            state: `${prefix}help | Sur ${client.guilds.cache.size} serveurs 🗨️`
        },

        {
            type: ActivityType.Custom,
            name: `${prefix}help | Utilisé par ${client.users.cache.size} utilisateurs 👥`,
            state: `${prefix}help | Utilisé par ${client.users.cache.size} utilisateurs 👥`
        },

        {
            type: ActivityType.Custom,
            name: `${prefix}help | En train de jouer ${client.lavalink.players.size} musiques 🎶`,
            state: `${prefix}help | En train de jouer ${client.lavalink.players.size} musiques 🎶`
        },

        {
            type: ActivityType.Custom,
            name: `${prefix}help | Gère ${await getChannelsCount()} channel(s) 🗃️`,
            state: `${prefix}help | Gère ${await getChannelsCount()} channel(s) 🗃️`
        }
    ];

    // Define an array of possible activity status types that the bot can have, such as "online", "idle", and "dnd" (do not disturb)

    const status = ["online", "idle", "dnd", "dnd"];

    // Randomly select and return one of the activity status messages from the array to be used as the bot's current activity status

    const randomIndex = Math.floor(Math.random() * activities.length);

    // Set the bot's presence with the randomly selected activity status and a randomly selected status type

    client.user.setPresence({
        activities: [activities[randomIndex]],
        status: status[randomIndex]
    });
    return;
};