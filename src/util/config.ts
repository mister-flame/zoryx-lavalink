let config: any;

try {
  config = require("../../config.json");
} catch (error) {
  config = null;
}

exports.token = config ? config.token : process.env.token;
exports.node = config ? config.node : process.env.node;
exports.START_WEBHOOK = config ? config.START_WEBHOOK : process.env.START_WEBHOOK;
exports.COLOR_EMBED = config ? config.COLOR_EMBED || "#FF4E3A" : process.env.COLOR_EMBED || "#FF4E3A";
exports.dbPath = config ? config.dbPath || "/home/mr-flame/Desktop/Lavalink-BOT-Test/databases/tcDB.db" : process.env.dbPath || "/home/mr-flame/Desktop/Lavalink-BOT-Test/databases/tcDB.db";
exports.LOGS_WEBHOOK = config ? config.LOGS_WEBHOOK : process.env.LOGS_WEBHOOK;
exports.clientId = config ? config.clientId || "1424383941502173306" : process.env.clientId || "1424383941502173306";
exports.API_KEY = config ? config.API_KEY : process.env.API_KEY;