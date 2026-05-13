// Dependency imports

const sqlite3 = require("sqlite3").verbose();
const { connectDB } = require("./connectDatabase");

/**
 * Gets the number of channels in the database
 * @returns a promise of the number of channels
 */

module.exports.getChannelsCount = async function getChannelsCount() {

    // Connect to the database and store the connection in a variable

    let dbTemp = await connectDB();

    // Query the database to get the count of distinct channels and return it as a promise

    return new Promise((resolve, reject) => {
        dbTemp.all("SELECT DISTINCT * FROM tempChannel;", (err, rows) => {
            if (err) reject(err);
            resolve(rows.length);
        });
    });
};