import { VoiceState,  ChannelType, PermissionsBitField, VoiceChannel } from "discord.js";
import { BotClient } from "../types";
import { Row } from "../types/row";
import { PlayerType } from "../types/player";
import { connectDB } from "../functions/connectDatabase";
import { deleteTmpChannel } from "../functions/deleteTmpChannel";
import { getPlayer } from "../functions/getPlayer";
import { updateVoiceStatus } from "../functions/updateVoiceStatus";

let query = null;

module.exports = {
  name: "voiceStateUpdate",
  async execute(client: BotClient, oldstate: VoiceState, newstate: VoiceState) {

    if (oldstate.channelId === newstate.channelId) return;

    if (!oldstate.member || !newstate.member) return;

    if (!client.user) return;

    if (oldstate.channelId != null && newstate.channelId === null && oldstate.member.user.id === client.user.id) {
      const player = await getPlayer(client, oldstate.guild.id) as PlayerType;

      if (player) {
        if (player.mainMessage && player.mainMessage.deletable) {
          player.mainMessage.delete().catch((err: Error) => console.error(`Error deleting main message: ${err.message}`));
          await updateVoiceStatus(oldstate.channelId).catch((err: Error) => console.error(`Error updating voice status: ${err.message}`));
        }
        player.destroy();
      }
    }

    if (newstate.channel !== null) {
      const dbMainChannels = await connectDB();

      if (!dbMainChannels) {
        console.error("Impossible de se connecter à la base de données. Veuillez vérifier le chemin d'accès à la base de données dans le fichier config.json ou dans les variables d'environnement.");
        return;
      }

      query = `SELECT DISTINCT id, channelId FROM mainChannel WHERE channelId = ${newstate.channel.id};`;
      dbMainChannels.all(query, async (err: Error, rows: Row[]) => {
        if (err) {
          console.error("Erreur avec l'obtention des données :", err.message);
        } else {

          if (rows.length === 0) return;

          let row = rows[0];

          if (!oldstate.channel || !newstate.channel) return;

          if (!oldstate.member || !newstate.member) return;

          if (newstate.channel.id === row.channelId) {
            if (newstate.member.user.bot == true) {
              return;
            }

            const dbTempChannels = await connectDB();

            if (!dbTempChannels) {
              console.error("Impossible de se connecter à la base de données. Veuillez vérifier le chemin d'accès à la base de données dans le fichier config.json ou dans les variables d'environnement.");
              return;
            }

            const newChannel = await newstate.guild.channels
              .create({
                name: `${newstate.member.user.username}'s channel`,
                reason: `Temp channel of ${newstate.member.user.username} (${newstate.member.user.id})`,
                type: ChannelType.GuildVoice,
                parent: newstate.channel.parent,
                permissionOverwrites: [
                  {
                    id: newstate.member.user.id,
                    allow: [PermissionsBitField.Flags.ManageChannels],
                  }
                ]
              })
              .catch((error) => {
                console.error(error);
              }) as VoiceChannel;
            query = `INSERT INTO tempChannel (channelId, mainChannel) VALUES (${newChannel.id}, ${row.id});`;

            dbTempChannels.run(query);
            newstate.member.voice.setChannel(newChannel).catch((error) => {
              console.error(error);
            });
            dbTempChannels.close((err: Error) => {
              if (err) {
                console.error(
                  "Erreur avec la fermeture de la base :",
                  err.message
                );
              }
            });
          }
        }
      });

      dbMainChannels.close((err: Error) => {
        if (err) {
          console.error("Erreur avec la fermeture de la base :", err.message);
        }
      });
    }

    if (oldstate.channel !== null) {
      const dbTempChannels = await connectDB();

      if (!dbTempChannels) {
        console.error("Impossible de se connecter à la base de données. Veuillez vérifier le chemin d'accès à la base de données dans le fichier config.json ou dans les variables d'environnement.");
        return;
      }

      query = `SELECT DISTINCT channelId FROM tempChannel WHERE channelId = ${oldstate.channel.id};`;
      dbTempChannels.all(query, (err: Error, rows: Row[]) => {
        if (err) {
          console.error("Erreur avec l'obtention des données :", err.message);
        } else {

          if (rows.length === 0) return;

          let row = rows[0];

          if (!oldstate.channel || !newstate.channel) return;

          if (oldstate.channel.id === row.channelId) {
            if (oldstate.channel.members.size === 0) {
              deleteTmpChannel(row.channelId, oldstate.channel as VoiceChannel);
            }
          }
        }
      });
      dbTempChannels.close((err: Error) => {
        if (err) {
          console.error("Erreur avec la fermeture de la base :", err.message);
        }
      });
    }
  },
};
