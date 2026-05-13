// Dependency imports

const sqlite3 = require("sqlite3").verbose();
const { dbPath } = require("../util/config");

/**
 * Returns a connection between the program and the database
 * @returns the connection
 */

module.exports.connectDB = async function connectDB() {

    // Create a new SQLite database connection using the specified database path and return the connection object. If there is an error during the connection, it logs the error message to the console.

    const connection = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error(
                "Erreur lors de la connexion à la base de données : ",
                err.message
            );
        }
    });
    return connection;
};