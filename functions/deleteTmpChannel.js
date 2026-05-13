// Dependency imports

const sqlite3 = require("sqlite3").verbose();
const { connectDB } = require("./connectDatabase");

/**
 * Delete a specific channel on discord and in the database of the bot
 * @param {channelId} channelId - The id of the channel to delete
 * @param {channel} channel - The channel to delete in discord
 */

module.exports.deleteTmpChannel = async function deleteTmpChannel(channelId, channel = null) {

    // Connect to the database and store the connection in a variable

    let dbTemp = await connectDB();

    // Query the database to delete the entry corresponding to the specified channel ID

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