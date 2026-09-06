// Dependency imports

const sqlite3 = require("sqlite3").verbose();
import fs from "fs";
import { BotConfig } from "../types";

const config = require("../util/config") as BotConfig;

if (!config.token || !config.clientId) {
    throw new Error("Missing token or clientId in src/config.json or environment variables.");
}

const { dbPath } = config;

/**
 * Returns a connection between the program and the database
 * @returns the connection
 */

export async function connectDB() {

    if (!fs.existsSync(dbPath)) {
        console.warn(`Le fichier de base de données n'existe pas à l'emplacement spécifié : ${dbPath}. Veuillez vérifier le chemin d'accès à la base de données dans le fichier config.json ou dans les variables d'environnement.`
        );
        return null;
    }

    // Create a new SQLite database connection using the specified database path and return the connection object. If there is an error during the connection, it logs the error message to the console.

    const connection = new sqlite3.Database(dbPath, (err: Error) => {
        if (err) {
            console.error(
                "Erreur lors de la connexion à la base de données : ",
                err.message
            );
        }
    });
    return connection;
};