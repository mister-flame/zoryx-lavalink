// Dependency imports

const sqlite3 = require("sqlite3").verbose();
const { connectDB } = require("./connectDatabase");
const { dbPath } = require("../util/config");
const { deleteTmpChannel } = require("./deleteTmpChannel");


/**
 * Delete all the temp channels which are supposed to be deleted (at the start of the bot)
 * @param {client} client - The client which will delete the channels
 */

module.exports.deleteTmpChannels = async function deleteTmpChannels(client) {
    const dbTemp = await connectDB();

    let query = "SELECT * FROM tempChannel;"
    dbTemp.all(query, async (err, rows) => {
        if (err) {
            console.error("Erreur avec l'obtention des données :", err.message);
        } else {

            if (rows.length === 0) return;

            for (i = 0; i < rows.length; i++) {
                let row = rows[i];
                try {
                    var currChannel = await client.channels.fetch(row.channelId);
                } catch (e) {
                    console.error(e);
                    await deleteTmpChannel(row.channelId, null);
                    continue;
                }
                if (currChannel.members.size === 0) {
                    await deleteTmpChannel(row.channelId, currChannel);
                }
            }
        }
    });
};