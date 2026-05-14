const { EmbedBuilder } = require("discord.js");
const { prefix, COLOR_EMBED } = require("../util/config");
const { getPlayer } = require("../functions/getPlayer");
const { getBestThumbnail } = require("../functions/getBestThumbnail");
const { formatDuration } = require("../functions/formatDuration");
const { updateVoiceStatus } = require("../functions/updateVoiceStatus");
const { LavalinkManager } = require("lavalink-client");
const ms = require("ms");

module.exports = {
    name: "messageCreate",
    async execute(client, message) {

        if (!message.content.startsWith(prefix)) return;

        if (message.author.bot || !message.guild) return;
        const args = message.content.trim().split(/\s+/);
        const command = args.shift().toLowerCase();

        let player = await getPlayer(client, message.guild.id);
        let track;

        switch (command) {
            case prefix + 'ping':

                const latency = Date.now() - message.createdTimestamp;
                const apiLatency = client.ws.ping;

                const pingEmbed = new EmbedBuilder()
                    .setColor(COLOR_EMBED)
                    .setTitle("🏓 Pong !")
                    .setDescription(`**Latence du bot :** \`${latency / 1000}s (${latency}ms)\`\n**Latence API :** \`${apiLatency / 1000}s (${apiLatency}ms)\``)
                    .setFooter({ text: `Demandé par ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                    .setTimestamp();

                if (player) {
                    pingEmbed.addFields({ name: "🎵 Lavalink Ping :", value: `\`${player.ping.ws / 1000}s (${player.ping.ws}ms)\`` });
                }

                return message.reply({ embeds: [pingEmbed] });

            case prefix + 'help':
                const helpEmbed = new EmbedBuilder()
                    .setColor(COLOR_EMBED)
                    .setTitle("📜 Commandes disponibles :")
                    .setDescription(`Voici les commandes que tu peux utiliser avec ce bot de musique Lavalink :\n
                    \`${prefix}play <lien ou recherche>\` - Joue une musique ou l'ajoute à la file d'attente.\n
                    \`${prefix}skip [nombre]\` - Passe au morceau suivant ou aux morceaux spécifiés.\n
                    \`${prefix}stop\` - Arrête la lecture et vide la file d'attente.\n
                    \`${prefix}leave\` - Déconnecte le bot du salon vocal.\n
                    \`${prefix}loop <track|queue|off>\` - Définit le mode de boucle.\n
                    \`${prefix}queue\` - Affiche la file d'attente actuelle.\n
                    \`${prefix}ping\` - Obtenir le temps de réponse du bot.\n
                    \`${prefix}help\` - Affiche ce message d'aide.\n
                    \`${prefix}replay\` - Relance le morceau en cours.\n
                    \`${prefix}nowplaying\` - Affiche la musique en cours de lecture.\n
                    Amuse-toi bien ! 🎶`)
                    .setFooter({ text: `Demandé par ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                    .setTimestamp();

                return message.reply({ embeds: [helpEmbed] });

            case prefix + 'play':
                let query = args.join(' ');

                if (!query) return message.reply('❌ Fournis un lien ou une recherche.');

                const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
                const spotifyRegex = /^(https?:\/\/)?(www\.)?(spotify\.com|open\.spotify\.?com)\/.+$/;

                if (youtubeRegex.test(query) && query.includes("watch?v=")) {
                    const videoParams = new URLSearchParams(query.split('?')[1]);
                    query = "https://www.youtube.com/watch?v=" + videoParams.get("v");
                } else if (youtubeRegex.test(query) && !query.includes("watch?v=") && query.includes("youtu.be/")) {
                    const videoId = query.split('/').pop();
                    query = "https://www.youtube.com/watch?v=" + videoId;
                } else if (youtubeRegex.test(query)) {
                    return message.reply('❌ Pour l\'instant, seules les vidéos YouTube individuelles sont supportées (pas les playlists ni les autres plateformes).');
                }

                const channel = message.member.voice.channel;
                if (!channel) return message.reply('🔊 Rejoins un salon vocal.');

                if (!player) {

                    player = await client.lavalink.createPlayer({
                        guildId: message.guild.id,
                        voiceChannelId: channel.id,
                        textChannelId: message.channel.id,
                        // optional configurations:
                        selfDeaf: true,
                        selfMute: false,
                        volume: 100
                    });

                    const newPlayer = new EmbedBuilder()
                        .setDescription(`Un nouveau player a été créé pour ce serveur\n(dans le salon vocal <#${channel.id}>)`)
                        .setColor(COLOR_EMBED)
                        .setTimestamp();

                    message.channel.send({ embeds: [newPlayer] });
                }

                // Verify that the Lavalink node is connected before attempting to search for the track, and if not, attempt to reconnect the node and player before searching again

                const node = player.node;
                if (!node || !node.connected) {
                    await node.connect();
                }

                if (!player.connected) await player.connect();

                const result = await player.search({
                    query: query
                });

                if (!result.tracks.length) return message.reply('❌ Aucun résultat.');

                track = result.tracks[0];

                track.info.requester = message.author;

                track.info.requestDate = new Date();

                if (track.sourceName === "youtube") {
                    const newArtworkUrl = await getBestThumbnail(track.info.identifier);
                    track.info.artworkUrl = newArtworkUrl || track.info.artworkUrl;
                }

                player.queue.add(track);

                if (!player.playing) {
                    await player.play();
                    return;
                }

                const addSong = new EmbedBuilder()
                    .setColor(COLOR_EMBED)
                    .setTitle("➕ Ta musique a été ajoutée à la file d'attente :")
                    .setDescription(`**[${track.info.title}](${track.info.uri})** | Durée : \`${track.info.isStream == false ? (await formatDuration(track.info.duration)).join(":") : "Stream 🔴"}\``)
                    .setThumbnail(track.info.artworkUrl)
                    .setFooter({ text: `Demandé par ${track.info.requester.username} | Position n°${player.queue.tracks.length + 1}`, iconURL: track.info.requester.displayAvatarURL() })
                    .setTimestamp(track.info.requestDate);

                return message.channel.send({ embeds: [addSong] });

            case prefix + 'skip':

                if (!player) return message.reply('❌ Aucun player/morceau pour ce serveur.');

                if (player.repeatMode === "track" || (player.repeatMode === "queue" && player.queue.tracks.length === 0)) {
                    message.reply('🔂 Boucle activée, je relance le morceau.');
                    return player.play(player.queue.current);
                } else if ((player.repeatMode === "off") && player.queue.tracks.length === 0) {
                    return player.stopPlaying();
                }
                player.skip(args[0] ? parseInt(args[0]) - 1 : 0);
                return message.reply(`${args[0] ? `🔂 Je passe au morceau \`${parseInt(args[0])}\`` : '⏭️ Morceau suivant.'}`);

            case prefix + 'stop':

                if (!player) return message.reply('❌ Aucun player/morceau pour ce serveur.');

                player.stopPlaying();
                updateVoiceStatus(player.voiceChannelId);
                return message.reply('⏹️ Lecture arrêtée.');

            case prefix + 'leave':

                if (!player) return message.reply('❌ Aucun player/morceau pour ce serveur.');

                if (player) {
                    updateVoiceStatus(player.voiceChannelId);
                    player.destroy();
                    message.reply('👋 Déconnecté.');
                } else {
                    message.reply('❌ Je ne suis pas connecté.');
                }
                return;

            case prefix + 'loop':

                if (!player) return message.reply('❌ Aucun player/morceau pour ce serveur.');

                let choice = args[0];
                if (!choice || (choice !== "track" && choice !== "queue" && choice !== "off")) return message.reply('❌ Précise "track", "queue" ou "off".');

                let emojiRepeat;
                switch (choice) {
                    case "track":
                        emojiRepeat = "🔂";
                        break;
                    case "queue":
                        emojiRepeat = "🔁";
                        break;
                    case "off":
                        emojiRepeat = "❌";
                        break;
                }

                if (!player) return message.reply('❌ Aucun morceau en cours.');
                player.setRepeatMode(choice);
                return message.reply(`${emojiRepeat} Mode boucle définit sur le mode : \`${player.repeatMode}\`.`);

            case prefix + 'queue':

                if (!player) return message.reply('❌ Aucun player/morceau pour ce serveur.');

                let queue = null;

                if (player && player.queue.current) {

                    let totalDuration = parseInt(player.queue.current.info.duration - (Date.now() - player.queue.current.info.startedPlaying));

                    queue = `1. [${player.queue.current.info.title}](<${player.queue.current.info.uri}>) \`${player.queue.current.info.isStream == false ? (await formatDuration(parseInt(player.queue.current.info.duration - (Date.now() - player.queue.current.info.startedPlaying)))).join(":") : "Stream 🔴"}\`\n`;

                    for (let i = 0; i < player.queue.tracks.length; i++) {

                        let track = player.queue.tracks[i];
                        totalDuration += track.info.duration

                        console.log(totalDuration)

                        if (i <= 10) {
                            queue = queue + `${i + 2}. [${track.info.title}](<${track.info.uri}>) \`${track.info.isStream == false ? (await formatDuration(track.info.duration)).join(":") : "Stream 🔴"}\`\n`;
                        }
                    }

                    if (player.queue.tracks.length > 10) {
                        queue = queue + `...et ${player.queue.tracks.length - 10} autres morceaux !`;
                    }

                    queue += `\nDurée total de la file d'attente : \`${(await formatDuration(totalDuration)).join(":")}\``

                    const queueEmbed = new EmbedBuilder()
                        .setColor(COLOR_EMBED)
                        .setTitle("📜 Liste des 10 prochaines musiques :")
                        .setThumbnail(player.queue.current.info.artworkUrl)
                        .setDescription((player.queue.tracks.length === 0) && (!player.queue.current) ? "Aucune musique dans la file d'attente." : queue)
                        .setFooter({ text: `${player.queue.tracks.length + 1} musique(s) au total`, iconURL: message.author.displayAvatarURL() })
                        .setTimestamp(new Date());

                    return message.reply({ embeds: [queueEmbed] });
                } else {
                    const queueEmbed = new EmbedBuilder()
                        .setColor(COLOR_EMBED)
                        .setTitle("📜 Liste des 10 prochaines musiques :")
                        .setDescription("Aucune musique dans la file d'attente.")
                        .setFooter({ text: `${player.queue.tracks.length} musique(s) au total`, iconURL: message.author.displayAvatarURL() })
                        .setTimestamp(new Date());

                    return message.reply({ embeds: [queueEmbed] });
                }
                return;

            case prefix + 'replay':

                if (!player) return message.reply('❌ Aucun player/morceau pour ce serveur.');

                await player.play(player.queue.current);
                return message.reply('🔂 Je relance le morceau en cours.');

            case prefix + 'nowplaying':

                if (!player) return message.reply('❌ Aucun player/morceau pour ce serveur.');

                track = player.queue.current;

                const currentTime = Date.now() - player.queue.current.info.startedPlaying;
                const totalTime = track.info.duration;
                const progress = Math.floor((currentTime / totalTime) * 20);

                let progressBar = "";

                if (track.info.isStream == false) {
                    progressBar = "\n**【**" + '▬'.repeat(progress) + '⚪' + '▬'.repeat(20 - progress) + "**】**";
                }

                const nowPlayingEmbed = new EmbedBuilder()
                    .setColor(COLOR_EMBED)
                    .setTitle("🎶 Musique en cours de lecture :")
                    .setDescription(`**[${track.info.title}](${track.info.uri})**\n${progressBar}\n\`${(await formatDuration(parseInt(currentTime))).join(":")} / ${track.info.isStream == false ? (await formatDuration(totalTime)).join(":") : "Stream 🔴"}\``)
                    .setThumbnail(track.info.artworkUrl)
                    .setFooter({ text: `Demandé par ${track.info.requester.username}`, iconURL: track.info.requester.displayAvatarURL() })
                    .setTimestamp(track.info.requestDate);
                return message.reply({ embeds: [nowPlayingEmbed] });

            case prefix + 'shuffle':

                if (!player) return message.reply('❌ Aucun player/morceau pour ce serveur.');

                if ((player.queue.tracks.length + 1) <= 2) return message.reply('❌ Il doit y avoir au moins 2 morceaux dans la file d\'attente pour mélanger.');
                player.queue.shuffle();
                return message.reply('🔀 La file d\'attente a été mélangée.');

            case prefix + 'seek':

                if (!player) return message.reply('❌ Aucun player/morceau pour ce serveur.');

                track = player.queue.current;

                if (track.info.isStream == true) return message.reply('❌ Impossible de seek une musique en stream.');

                let time = ms(args[0]);

                if (!time && time != 0) {
                    if (args[0].includes(":")) {
                        const timeParts = args[0].split(":").map(part => parseInt(part));
                        if (timeParts.some(isNaN)) return message.reply('❌ Durée invalide. Utilise le format `1s`, `1m`, `1h`, etc. ou `1:00`, `1:00:00`, etc.');
                        if (timeParts.length > 3) return message.reply('❌ Durée invalide. Utilise le format `1s`, `1m`, `1h`, etc. ou `1:00`, `1:00:00`, etc.');
                        time = 0;
                        for (let i = timeParts.length - 1; i >= 0; i--) {
                            time += timeParts[i] * Math.pow(60, timeParts.length - 1 - i) * 1000;
                        }
                    } else {
                        return message.reply('❌ Précise une durée valide. Utilise le format `1s`, `1m`, `1h`, etc. ou `1:00`, `1:00:00`, etc.');
                    }
                }

                if (isNaN(time)) return message.reply('❌ Durée invalide. Utilise le format `1s`, `1m`, `1h`, etc.');

                if (time < 0 || time > track.info.duration) return message.reply(`❌ La durée doit être comprise entre \`0\` et \`${(await formatDuration(track.info.duration)).join(":")}\`.`);

                await player.seek(time);

                return message.reply(`⏩ Je me déplace à \`${((await formatDuration(time)).join(":"))}\` dans la musique.`);

            default:
                return;
        }
    },
};
