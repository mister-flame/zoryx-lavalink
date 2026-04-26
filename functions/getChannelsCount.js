// Dependency imports

const sqlite3 = require("sqlite3").verbose();
const { connectDB } = require("./connectDatabase");

/**
 * Gets the number of channels in the database
 * @returns a promise of the number of channels
 */

module.exports.getChannelsCount = async function getChannelsCount() {

    let dbTemp = await connectDB();

    return new Promise((resolve, reject) => {
        dbTemp.all("SELECT DISTINCT * FROM tempChannel;", (err, rows) => {
            if (err) reject(err);
            resolve(rows.length);
        });
    });
};