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

        if (player.mainMessage && player.mainMessage.deletable) {
            player.mainMessage.delete().catch(() => { });
            player.mainMessage = null;
        }

        updateVoiceStatus(player.voiceChannelId, "Plus de musiques dans la file❗");

        return;
    }
}