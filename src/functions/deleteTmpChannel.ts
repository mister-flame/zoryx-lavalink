import { VoiceChannel } from "discord.js";
import { connectDB } from "./connectDatabase";

const sqlite3 = require("sqlite3").verbose();

/**
 * Delete a specific channel on discord and in the database of the bot
 * @param {string} channelId - The id of the channel to delete
 * @param {VoiceChannel} channel - The channel to delete in discord
 */

export async function deleteTmpChannel(channelId: string, channel?: VoiceChannel | null) {

    // Connect to the database and store the connection in a variable

    let dbTemp = await connectDB();

    if (!dbTemp) {
        console.error("Impossible de se connecter à la base de données. Veuillez vérifier le chemin d'accès à la base de données dans le fichier config.json ou dans les variables d'environnement.");
        return;
    }

    // Query the database to delete the entry corresponding to the specified channel ID

    let query = "";

    query = `DELETE FROM tempChannel WHERE channelId = ${channelId};`;
    dbTemp.run(query, function (err: Error) {
        if (err) {
            console.error(
                "Erreur lors de la suppression de la donnée :",
                err.message
            );
        }
    });

    try {
        if (channel) {
            channel.delete()
        }
    } catch (error) {
        console.error(error);
    }
};