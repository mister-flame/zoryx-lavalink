const {
  ChannelType,
  PermissionsBitField,
} = require("discord.js");

const { connectDB } = require("../functions/connectDatabase");
const { deleteTmpChannel } = require("../functions/deleteTmpChannel");

let query = null;

module.exports = {
  name: "voiceStateUpdate",
  async execute(client, oldstate, newstate) {

    if (newstate.channel !== null) {
      const dbMainChannels = await connectDB();

      query = `SELECT DISTINCT id, channelId FROM mainChannel WHERE channelId = ${newstate.channel.id};`;
      dbMainChannels.all(query, async (err, rows) => {
        if (err) {
          console.error("Erreur avec l'obtention des données :", err.message);
        } else {

          if (rows.length === 0) return;

          let row = rows[0];

          if (newstate.channel.id === row.channelId) {
            if (newstate.member.user.bot == true) {
              return;
            }

            const dbTempChannels = await connectDB();

            const newChannel = await newstate.guild.channels
              .create({
                name: `${newstate.member.user.username}'s channel`,
                reason: `Temp channel of ${newstate.member.user.username} (${newstate.member.user.id})`,
                type: ChannelType.GuildVoice,
                parent: newstate.channel.parent,
              })
              .catch((error) => {
                console.error(error);
              });
            query = `INSERT INTO tempChannel (channelId, mainChannel) VALUES (${newChannel.id}, ${row.id});`;

            dbTempChannels.run(query);
            newstate.member.voice.setChannel(newChannel).catch((error) => {
              console.error(error);
            });
            newChannel.permissionOverwrites.set([
              {
                id: newstate.member.user.id,
                allow: [PermissionsBitField.Flags.ManageChannels],
              },
            ]);
            dbTempChannels.close((err) => {
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

      dbMainChannels.close((err) => {
        if (err) {
          console.error("Erreur avec la fermeture de la base :", err.message);
        }
      });
    }

    if (oldstate.channel !== null) {
      const dbTempChannels = await connectDB();
      query = `SELECT DISTINCT channelId FROM tempChannel WHERE channelId = ${oldstate.channel.id};`;
      dbTempChannels.all(query, (err, rows) => {
        if (err) {
          console.error("Erreur avec l'obtention des données :", err.message);
        } else {

          if (rows.length === 0) return;

          let row = rows[0];

          if (oldstate.channel.id === row.channelId) {
            if (oldstate.channel.members.size === 0) {
              deleteTmpChannel(row.channelId, oldstate.channel);
            }
          }
        }
      });
      dbTempChannels.close((err) => {
        if (err) {
          console.error("Erreur avec la fermeture de la base :", err.message);
        }
      });
    }
  },
};
