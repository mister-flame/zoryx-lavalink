// Dependency imports

const sqlite3 = require("sqlite3").verbose();
const { dbPath } = require("../util/config");
const fs = require("fs");

/**
 * Returns a connection between the program and the database
 * @returns the connection
 */

module.exports.connectDB = async function connectDB() {

    if (!fs.existsSync(dbPath)) {
        console.warn(`Le fichier de base de données n'existe pas à l'emplacement spécifié : ${dbPath}. Veuillez vérifier le chemin d'accès à la base de données dans le fichier config.json ou dans les variables d'environnement.`
        );
        return null;
    }

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