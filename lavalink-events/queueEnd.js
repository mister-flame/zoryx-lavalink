const { updateVoiceStatus } = require("../functions/updateVoiceStatus");

/*
    * Lavalink "queueEnd" event handler
    * @param {Client} client - The Discord client instance
    * @param {Player} player - The Lavalink player instance
*/

module.exports = {
    name: "queueEnd",
    once: false,
    on: true,
    async execute(client, player) {

        updateVoiceStatus(player.voiceChannelId, "Plus de musiques dans la file❗");

        return;
    }
}