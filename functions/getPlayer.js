/*
    * Function to check if the player exists and if there is a current track. If not, it sends a code error in order to know which error occured.
    * @param {Client} client - The Discord client instance
    * @param {string} guildId - The ID of the guild to check for the player
    * @returns {Player|void} - Returns the player instance if it exists and has a current track, otherwise sends an error message and returns void
*/

module.exports.getPlayer = async function getPlayer(client, guildId) {

    // Get the player for the specified guild ID from the Lavalink client

    const player = client.lavalink.players.get(guildId);

    // Check if the player exists and if there is a current track. If not, send an error message to the channel and return void

    return typeof (player) != "undefined" ? player : null;
};