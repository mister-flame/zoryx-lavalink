// Dependency imports

const sqlite3 = require("sqlite3").verbose();
const { connectDB } = require("./connectDatabase");

/**
 * Gets the number of channels in the database
 * @returns a promise of the number of channels
 */

export async function getChannelsCount() {

    // Connect to the database and store the connection in a variable

    let dbTemp = await connectDB();

    if (!dbTemp) {
        console.error("Impossible de se connecter à la base de données. Veuillez vérifier le chemin d'accès à la base de données dans le fichier config.json ou dans les variables d'environnement.");
        return;
    }

    // Query the database to get the count of distinct channels and return it as a promise

    return new Promise((resolve, reject) => {
        dbTemp.all("SELECT DISTINCT * FROM tempChannel;", (err: Error, rows: Object[]) => {
            if (err) reject(err);
            resolve(rows.length);
        });
    });
};