const { EmbedBuilder, TextChannel } = require("discord.js");
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

        if (command != prefix + 'ping' && command != prefix + 'help') {
            if (message && message.deletable) {
                setTimeout(() => {
                    message.delete().catch(() => { });
                }, 30000);
            }
        }

        let player = await getPlayer(client, message.guild.id);
        let track;

        switch (command) {
            case prefix + 'ping':

                const latency = Date.now() - message.createdTimestamp;

                let averageNodeLatency = 0;

                client.lavalink.nodeManager.nodes.forEach(node => {
                    if (node.connected) {
                        if (node.heartbeatLatency && !isNaN(node.heartbeatLatency) && node.heartbeatLatency >= 0) {
                            averageNodeLatency += node.heartbeatLatency;
                        }
                    }
                });

                averageNodeLatency = averageNodeLatency / client.lavalink.nodeManager.nodes.size;

                const apiLatency = client.ws.ping;

                const pingEmbed = new EmbedBuilder()
                    .setColor(COLOR_EMBED)
                    .setTitle("🏓 Pong !")
                    .setDescription(`**Latence du bot :** \`${latency / 1000}s (${latency}ms)\`\n**Latence API :** \`${apiLatency / 1000}s (${apiLatency}ms)\`\n**Latence avec le Serveur Lavalink :** \`${averageNodeLatency < 0 || isNaN(averageNodeLatency) ? "N/A (pas de node connecté)" : `${averageNodeLatency.toFixed(2)}ms`}\``)
                    .setFooter({ text: `Demandé par ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                    .setTimestamp();

                if (player) {
                    pingEmbed.addFields({ name: "🎵 Player Ping :", value: `\`${player.ping.ws / 1000}s (${player.ping.ws}ms)\`` });
                }

                return message.reply({ embeds: [pingEmbed] });

            case prefix + 'help':
                const helpEmbed = new EmbedBuilder()
                    .setColor(COLOR_EMBED)
                    .setTitle("📜 Commandes disponibles :")
                    .setDescription(`Voici les commandes que tu peux utiliser avec ce bot de musique Lavalink :\n
                    \`${prefix}play <lien ou recherche>\` - Ajoute une ou plusieurs musiques à la file d'attente. (YouTube uniquement)\n
                    \`${prefix}skip [nombre]\` - Passe au morceau suivant ou aux morceaux spécifiés.\n
                    \`${prefix}stop\` - Arrête la lecture et vide la file d'attente.\n
                    \`${prefix}leave\` - Déconnecte le bot du salon vocal.\n
                    \`${prefix}loop <track|queue|off>\` - Définit le mode de boucle.\n
                    \`${prefix}queue\` - Affiche la file d'attente actuelle.\n
                    \`${prefix}ping\` - Obtenir le temps de réponse du bot.\n
                    \`${prefix}help\` - Affiche ce message d'aide.\n
                    \`${prefix}replay\` - Relance le morceau en cours.\n
                    \`${prefix}nowplaying\` - Affiche la musique en cours de lecture.\n
                    \`${prefix}seek <durée>\` - Se déplace à une position spécifique dans la musique (ex: \`1m30s\`, \`90s\`, etc. ou \`1:00\`, \`1:00:00\`, etc.).\n
                    Amuse-toi bien ! 🎶`)
                    .setFooter({ text: `Demandé par ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                    .setTimestamp();

                return message.reply({ embeds: [helpEmbed] });

            case prefix + 'play':
                let query = args.join(' ');

                if (!query) {
                    message.reply({ content: '❌ Fournis un lien ou une recherche.' }).then(msg => {
                        setTimeout(() => msg.delete().catch(() => { }), 30000);
                    }).catch(() => { });
                    return;
                }

                const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;

                if (youtubeRegex.test(query) && query.includes("watch?v=") && !query.includes("list=")) {
                    const videoParams = new URLSearchParams(query.split('?')[1]);
                    query = "https://www.youtube.com/watch?v=" + videoParams.get("v");
                } else if (youtubeRegex.test(query) && !query.includes("watch?v=") && query.includes("youtu.be/") && !query.includes("list=")) {
                    const videoId = query.split('/').pop();
                    query = "https://www.youtube.com/watch?v=" + videoId;
                } else if (youtubeRegex.test(query) && query.includes("list=")) {
                    const listId = query.split('list=')[1].split('&')[0];
                    query = `https://www.youtube.com/playlist?list=${listId}`;
                } else if (youtubeRegex.test(query) && !query.includes("watch?v=") && !query.includes("list=")) {
                    message.reply({ content: '❌ Pour l\'instant, seules les vidéos YouTube (vidéos individuelles et playlists) sont supportées.' }).then(msg => {
                        setTimeout(() => msg.delete().catch(() => { }), 30000);
                    }).catch(() => { });
                    return;
                }

                const channel = message.member.voice.channel;
                if (!channel) {
                    message.reply({ content: '🔊 Rejoins un salon vocal.' }).then(msg => {
                        setTimeout(() => msg.delete().catch(() => { }), 30000);
                    }).catch(() => { });
                    return;
                }

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
                        .setDescription(`Un nouveau player a été créé pour ce serveur\n(pour le salon vocal <#${channel.id}>)`)
                        .setColor(COLOR_EMBED)
                        .setTimestamp();

                    message.channel.send({ embeds: [newPlayer] }).then(msg => {
                        setTimeout(() => msg.delete().catch(() => { }), 30000);
                    }).catch(() => { });
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

                if (!result.tracks.length) {
                    message.reply({ content: '❌ Aucun résultat.' }).then(msg => {
                        setTimeout(() => msg.delete().catch(() => { }), 30000);
                    }).catch(() => { });
                    return;
                }

                track = result.tracks[0];

                if (result.loadType === "playlist") {
                    const playlistEmbed = new EmbedBuilder()
                        .setColor(COLOR_EMBED)
                        .setTitle(result.playlist.name)
                        .setDescription(`\`${result.tracks.length}\` morceaux | Durée totale : \`${(await formatDuration(result.playlist.duration)).join(":")}\``)
                        .setThumbnail(result.tracks[0].info.artworkUrl)
                        .setFooter({ text: `Demandé par ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                        .setTimestamp();

                    for (const track of result.tracks) {

                        track.info.requester = message.author;
                        track.info.requestDate = new Date();

                        if (track.sourceName === "youtube") {
                            const newArtworkUrl = await getBestThumbnail(track.info.identifier);
                            track.info.artworkUrl = newArtworkUrl || track.info.artworkUrl;
                        }

                        player.queue.add(track);
                    }

                    message.channel.send({ embeds: [playlistEmbed] }).then(msg => {
                        setTimeout(() => msg.delete().catch(() => { }), 30000);
                    }).catch(() => { });
                } else {
                    track.info.requester = message.author;
                    track.info.requestDate = new Date();

                    if (track.sourceName === "youtube") {
                        const newArtworkUrl = await getBestThumbnail(track.info.identifier);
                        track.info.artworkUrl = newArtworkUrl || track.info.artworkUrl;
                    }

                    player.queue.add(track);
                }

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

                message.channel.send({ embeds: [addSong] }).then(msg => {
                    setTimeout(() => msg.delete().catch(() => { }), 30000);
                }).catch(() => { });
                return;

            case prefix + 'skip':

                if (!player) {
                    message.reply({ content: '❌ Aucun player/morceau pour ce serveur.' }).then(msg => {
                        setTimeout(() => msg.delete().catch(() => { }), 30000);
                    }).catch(() => { });
                    return;
                }

                if (player.repeatMode === "track" || (player.repeatMode === "queue" && player.queue.tracks.length === 0)) {
                    message.reply({ content: '🔂 Boucle activée, je relance le morceau.' }).then(msg => {
                        setTimeout(() => msg.delete().catch(() => { }), 30000);
                    }).catch(() => { });
                    return player.play(player.queue.current);
                } else if ((player.repeatMode === "off") && player.queue.tracks.length === 0) {
                    return player.stopPlaying();
                }
                player.skip(args[0] ? parseInt(args[0]) - 1 : 0);
                message.reply({ content: `${args[0] ? `🔂 Je passe au morceau \`${parseInt(args[0])}\`` : '⏭️ Morceau suivant.'}` }).then(msg => {
                    setTimeout(() => msg.delete().catch(() => { }), 30000);
                }).catch(() => { });
                return;

            case prefix + 'stop':

                if (!player) {
                    message.reply({ content: '❌ Aucun player/morceau pour ce serveur.' }).then(msg => {
                        setTimeout(() => msg.delete().catch(() => { }), 30000);
                    }).catch(() => { });
                    return;
                }

                player.stopPlaying();
                updateVoiceStatus(player.voiceChannelId);
                message.reply({ content: '⏹️ Lecture arrêtée.' }).then(msg => {
                    setTimeout(() => msg.delete().catch(() => { }), 30000);
                }).catch(() => { });
                return;

            case prefix + 'leave':

                if (!player) {
                    message.reply({ content: '❌ Aucun player/morceau pour ce serveur.' }).then(msg => {
                        setTimeout(() => msg.delete().catch(() => { }), 30000);
                    }).catch(() => { });
                    return;
                }

                if (player) {
                    updateVoiceStatus(player.voiceChannelId);
                    player.destroy();
                    message.reply({ content: '👋 Déconnecté.' }).then(msg => {
                        setTimeout(() => msg.delete().catch(() => { }), 30000);
                    }).catch(() => { });
                } else {
                    message.reply({ content: '❌ Je ne suis pas connecté.' }).then(msg => {
                        setTimeout(() => msg.delete().catch(() => { }), 30000);
                    }).catch(() => { });
                }
                return;

            case prefix + 'loop':

                if (!player) {
                    message.reply({ content: '❌ Aucun player/morceau pour ce serveur.' }).then(msg => {
                        setTimeout(() => msg.delete().catch(() => { }), 30000);
                    }).catch(() => { });
                    return;
                }

                let choice = args[0];
                if (!choice || (choice !== "track" && choice !== "queue" && choice !== "off")) {
                    message.reply({ content: `❌ Précise "track", "queue" ou "off". (Actuellement : \`${player.repeatMode}\`)` }).then(msg => {
                        setTimeout(() => msg.delete().catch(() => { }), 30000);
                    }).catch(() => { });
                    return;
                }

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

                if (!player) {
                    message.reply({ content: '❌ Aucun morceau en cours.' }).then(msg => {
                        setTimeout(() => msg.delete().catch(() => { }), 30000);
                    }).catch(() => { });
                    return;
                }
                player.setRepeatMode(choice);

                if ((player.mainMessage && player.mainMessage.embeds.length > 0) && message.channel && message.channel instanceof TextChannel && player.mainMessage.editable) {

                    const embed = EmbedBuilder.from(player.mainMessage.embeds[0]);
                    embed.setFooter({ text: `Demandé par ${player.queue.current.info.requester.username} • Loop : ${emojiRepeat} • ${player.queue.tracks.length + 1} morceaux`, iconURL: player.queue.current.info.requester.displayAvatarURL() });

                    player.mainMessage.edit({ embeds: [embed] });
                }

                message.reply({ content: `${emojiRepeat} Mode boucle définit sur le mode : \`${player.repeatMode}\`.` }).then(msg => {
                    setTimeout(() => msg.delete().catch(() => { }), 30000);
                }).catch(() => { });
                return;

            case prefix + 'queue':

                if (!player) {
                    message.reply({ content: '❌ Aucun player/morceau pour ce serveur.' }).then(msg => {
                        setTimeout(() => msg.delete().catch(() => { }), 30000);
                    }).catch(() => { });
                    return;
                }

                let queue = null;

                if (player && player.queue.current) {

                    let totalDuration = parseInt(player.queue.current.info.duration - (Date.now() - player.queue.current.info.startedPlaying));

                    queue = `1. [${player.queue.current.info.title}](<${player.queue.current.info.uri}>) \`${player.queue.current.info.isStream == false ? (await formatDuration(parseInt(player.queue.current.info.duration - (Date.now() - player.queue.current.info.startedPlaying)))).join(":") : "Stream 🔴"}\`\n`;

                    for (let i = 1; i < player.queue.tracks.length; i++) {

                        let track = player.queue.tracks[i];
                        totalDuration += track.info.duration

                        if (i < 10) {
                            queue = queue + `${i + 2}. [${track.info.title}](<${track.info.uri}>) \`${track.info.isStream == false ? (await formatDuration(track.info.duration)).join(":") : "Stream 🔴"}\`\n`;
                        }
                    }

                    if (player.queue.tracks.length > 10) {
                        queue = queue + `...et ${player.queue.tracks.length - 9} autres morceaux !`;
                    }

                    queue += `\nDurée total de la file d'attente : \`${(await formatDuration(totalDuration)).join(":")}\``

                    const queueEmbed = new EmbedBuilder()
                        .setColor(COLOR_EMBED)
                        .setTitle("📜 Liste des 10 prochaines musiques :")
                        .setThumbnail(player.queue.current.info.artworkUrl)
                        .setDescription((player.queue.tracks.length === 0) && (!player.queue.current) ? "Aucune musique dans la file d'attente." : queue)
                        .setFooter({ text: `${player.queue.tracks.length + 1} musique(s) au total`, iconURL: message.author.displayAvatarURL() })
                        .setTimestamp(new Date());

                    message.reply({ embeds: [queueEmbed] }).then(msg => {
                        setTimeout(() => msg.delete().catch(() => { }), 30000);
                    }).catch(() => { });
                    return;
                } else {
                    const queueEmbed = new EmbedBuilder()
                        .setColor(COLOR_EMBED)
                        .setTitle("📜 Liste des 10 prochaines musiques :")
                        .setDescription("Aucune musique dans la file d'attente.")
                        .setFooter({ text: `${player.queue.tracks.length} musique(s) au total`, iconURL: message.author.displayAvatarURL() })
                        .setTimestamp(new Date());

                    message.reply({ embeds: [queueEmbed] }).then(msg => {
                        setTimeout(() => msg.delete().catch(() => { }), 30000);
                    }).catch(() => { });
                    return;
                }
                return;

            case prefix + 'replay':

                if (!player) {
                    message.reply({ content: '❌ Aucun player/morceau pour ce serveur.' }).then(msg => {
                        setTimeout(() => msg.delete().catch(() => { }), 30000);
                    }).catch(() => { });
                    return;
                }

                await player.play(player.queue.current);
                message.reply({ content: '🔂 Je relance le morceau en cours.' }).then(msg => {
                    setTimeout(() => msg.delete().catch(() => { }), 30000);
                }).catch(() => { });
                return;

            case prefix + 'nowplaying':

                if (!player) {
                    message.reply({ content: '❌ Aucun player/morceau pour ce serveur.' }).then(msg => {
                        setTimeout(() => msg.delete().catch(() => { }), 30000);
                    }).catch(() => { });
                    return;
                }

                track = player.queue.current;

                if (!track) {
                    message.reply({ content: '❌ Aucun morceau en cours.' }).then(msg => {
                        setTimeout(() => msg.delete().catch(() => { }), 30000);
                    }).catch(() => { });
                    return;
                }

                const currentTime = Date.now() - track.info.startedPlaying;
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
                message.reply({ embeds: [nowPlayingEmbed] }).then(msg => {
                    setTimeout(() => msg.delete().catch(() => { }), 30000);
                }).catch(() => { });
                return;

            case prefix + 'shuffle':

                if (!player) {
                    message.reply({ content: '❌ Aucun player/morceau pour ce serveur.' }).then(msg => {
                        setTimeout(() => msg.delete().catch(() => { }), 30000);
                    }).catch(() => { });
                    return;
                }

                if (player.queue.tracks.length < 3) {
                    message.reply({ content: '❌ Il doit y avoir au moins 3 morceaux dans la file d\'attente pour mélanger. (Morceau en cours non compris)' }).then(msg => {
                        setTimeout(() => msg.delete().catch(() => { }), 30000);
                    }).catch(() => { });
                    return;
                }
                player.queue.shuffle();
                message.reply({ content: `🔀 \`${player.queue.tracks.length}\` morceaux mélangés.` }).then(msg => {
                    setTimeout(() => msg.delete().catch(() => { }), 30000);
                }).catch(() => { });
                return;

            case prefix + 'seek':

                if (!player) {
                    message.reply({ content: '❌ Aucun player/morceau pour ce serveur.' }).then(msg => {
                        setTimeout(() => msg.delete().catch(() => { }), 30000);
                    }).catch(() => { });
                    return;
                }

                track = player.queue.current;

                if (track.info.isStream == true) {
                    message.reply({ content: '❌ Impossible de seek une musique en stream.' }).then(msg => {
                        setTimeout(() => msg.delete().catch(() => { }), 30000);
                    }).catch(() => { });
                    return;
                }

                let time = ms(args[0]);

                if (!time && time != 0) {
                    if (args[0].includes(":")) {
                        const timeParts = args[0].split(":").map(part => parseInt(part));
                        if (timeParts.some(isNaN)) {
                            message.reply({ content: '❌ Durée invalide. Utilise le format `1s`, `1m`, `1h`, etc. ou `1:00`, `1:00:00`, etc.' }).then(msg => {
                                setTimeout(() => msg.delete().catch(() => { }), 30000);
                            }).catch(() => { });
                            return;
                        }
                        if (timeParts.length > 3) {
                            message.reply({ content: '❌ Durée invalide. Utilise le format `1s`, `1m`, `1h`, etc. ou `1:00`, `1:00:00`, etc.' }).then(msg => {
                                setTimeout(() => msg.delete().catch(() => { }), 30000);
                            }).catch(() => { });
                            return;
                        }
                        time = 0;
                        for (let i = timeParts.length - 1; i >= 0; i--) {
                            time += timeParts[i] * Math.pow(60, timeParts.length - 1 - i) * 1000;
                        }
                    } else {
                        message.reply({ content: '❌ Précise une durée valide. Utilise le format `1s`, `1m`, `1h`, etc. ou `1:00`, `1:00:00`, etc.' }).then(msg => {
                            setTimeout(() => msg.delete().catch(() => { }), 30000);
                        }).catch(() => { });
                        return;
                    }
                }

                if (isNaN(time)) {
                    message.reply({ content: '❌ Durée invalide. Utilise le format `1s`, `1m`, `1h`, etc.' }).then(msg => {
                        setTimeout(() => msg.delete().catch(() => { }), 30000);
                    }).catch(() => { });
                    return;
                }

                if (time < 0 || time > track.info.duration) {
                    message.reply({ content: `❌ La durée doit être comprise entre \`0\` et \`${(await formatDuration(track.info.duration)).join(":")}\`.` }).then(msg => {
                        setTimeout(() => msg.delete().catch(() => { }), 30000);
                    }).catch(() => { });
                    return;
                }

                track.info.startedPlaying = Date.now() - time;
                await player.seek(time);

                message.reply({ content: `⏩ Je me déplace à \`${((await formatDuration(time)).join(":"))}\` dans la musique.` }).then(msg => {
                    setTimeout(() => msg.delete().catch(() => { }), 30000);
                }).catch(() => { });
                return;

            default:
                return;
        }
    },
};
