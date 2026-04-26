// Dependency imports

const sqlite3 = require("sqlite3").verbose();
const { connectDB } = require("./connectDatabase");

/**
 * Delete a specific channel on discord and in the database of the bot
 * @param {channelId} channelId - The id of the channel to delete
 * @param {channel} channel - The channel to delete in discord
 */

module.exports.deleteTmpChannel = async function deleteTmpChannel(channelId, channel = null) {

    let dbTemp = await connectDB();

    query = `DELETE FROM tempChannel WHERE channelId = ${channelId};`;
    dbTemp.run(query, function (err) {
        if (err) {
            console.error(
                "Erreur lors de la suppression de la donnée :",
                err.message
            );
        }
    });

    try {
        channel.delete()
    } catch (error) {
        console.error(error);
    }
};