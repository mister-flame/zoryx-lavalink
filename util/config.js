let config;

try {
  config = require("../config.json");
} catch (error) {
  config = null;
}

exports.token = config ? config.token : process.env.token;
exports.prefix = config ? config.prefix : process.env.prefix || "!";
exports.node = config ? config.node : process.env.node;
exports.START_WEBHOOK = config ? config.START_WEBHOOK : process.env.START_WEBHOOK;
exports.COLOR_EMBED = config ? config.COLOR_EMBED : process.env.COLOR_EMBED || "#0099ff";
exports.dbPath = config ? config.dbPath : process.env.dbPath || "/home/mr-flame/Desktop/Lavalink-BOT-Test/databases/tcDB.db";