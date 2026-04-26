/*
    * Function to log detailed information about a Lavalink player instance, including its state and relevant messages
    * @param {Client} client - The Discord client instance
    * @param {Player} player - The Lavalink player instance to log information about
    * @param {...string} messages - Additional messages to log alongside the player information
*/

module.exports.logPlayer = async function logPlayer(client, player) {
    console.log("-".repeat(38) + " Player Log " + "-".repeat(54));
    console.group("Player Event");
    console.log(`| Player Position: ${player.position}`);
    console.log(`| Player Creation Timestamp : ${player.createdTimeStamp}`)
    console.log(`| Playing ? ${player.playing}`);
    console.log(`| Volume: ${player.volume}`)
    console.log(`| Guild: ${player.guildId} | ${client.guilds.cache.get(player.guildId)?.name}`);
    console.log(`| Repeat Mode: ${player.repeatMode}`)
    console.log(`| Voice Channel: #${(client.channels.cache.get(player.voiceChannelId))?.name || player.voiceChannelId}`);
    if (player.queue.current) {
        console.group("| Track Info:");
        console.log(player.queue.current.info);
    }
    console.groupEnd();
    console.groupEnd();
    console.log("-".repeat(104));
    return;
};