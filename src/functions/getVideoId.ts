export type Platform = "youtube" | "spotify" | "soundcloud";

export interface MediaInfo {
    platform: Platform;
    id: string;
    type: string; // video, track, album, playlist, episode, user, short...
    url: string;  // URL
}

const YOUTUBE_ID_REGEX = /^[\w-]{11}$/;
const SPOTIFY_ID_REGEX = /^[A-Za-z0-9]{22}$/;
const SPOTIFY_TYPES = ["track", "album", "playlist", "artist", "episode", "show"];
const SOUNDCLOUD_RESERVED = [
    "discover", "you", "stream", "search", "upload", "pages",
    "charts", "feed", "settings", "notifications", "messages", "tags",
];

function youtube(id: string): MediaInfo {
    return { platform: "youtube", id, type: "video", url: `https://www.youtube.com/watch?v=${id}` };
}

function parseYouTube(host: string, url: URL): MediaInfo | null {
    let candidate: string | null = null;

    if (host === "youtu.be") {
        candidate = url.pathname.split("/")[1] ?? null;
    } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
        if (url.pathname === "/watch") {
            candidate = url.searchParams.get("v");
        } else {
            const [, type, id] = url.pathname.split("/");
            if (["embed", "shorts", "live", "v"].includes(type)) {
                candidate = id ?? null;
            }
        }
    }

    return candidate && YOUTUBE_ID_REGEX.test(candidate) ? youtube(candidate) : null;
}

function parseSpotify(url: URL): MediaInfo | null {
    // Manage /track/ID, /intl-fr/track/ID, /embed/track/ID, /user/xxx/playlist/ID...
    const segments = url.pathname.split("/").filter(Boolean);

    for (let i = 0; i < segments.length - 1; i++) {
        const type = segments[i];
        const id = segments[i + 1];
        if (SPOTIFY_TYPES.includes(type) && SPOTIFY_ID_REGEX.test(id)) {
            return { platform: "spotify", id, type, url: `https://open.spotify.com/${type}/${id}` };
        }
    }
    return null;
}

function parseSoundCloud(host: string, url: URL): MediaInfo | null {
    const segments = url.pathname.split("/").filter(Boolean);
    if (host === "on.soundcloud.com") {
        const code = segments[0];
        return code
            ? { platform: "soundcloud", id: code, type: "short", url: `https://on.soundcloud.com/${code}` }
            : null;
    }
    if (host === "api.soundcloud.com") {
        return segments[0] === "tracks" && /^\d+$/.test(segments[1] ?? "")
            ? { platform: "soundcloud", id: segments[1], type: "track", url: `https://api.soundcloud.com/tracks/${segments[1]}` }
            : null;
    }

    if (host !== "soundcloud.com" || segments.length === 0) return null;
    if (SOUNDCLOUD_RESERVED.includes(segments[0])) return null;
    if (segments[1] === "sets" && segments[2]) {
        const id = `${segments[0]}/sets/${segments[2]}`;
        return { platform: "soundcloud", id, type: "playlist", url: `https://soundcloud.com/${id}` };
    }
    if (segments[1]) {
        const id = `${segments[0]}/${segments[1]}`;
        return { platform: "soundcloud", id, type: "track", url: `https://soundcloud.com/${id}` };
    }
    return { platform: "soundcloud", id: segments[0], type: "user", url: `https://soundcloud.com/${segments[0]}` };
}

export async function getVideoId(input: string): Promise<string | undefined> {
    const value = input.trim();
    if (YOUTUBE_ID_REGEX.test(value)) return youtube(value).id;
    const uri = value.match(/^spotify:(\w+):([A-Za-z0-9]{22})$/);
    if (uri && SPOTIFY_TYPES.includes(uri[1])) {
        return uri[2];
    }

    let url: URL;
    try {
        url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    } catch {
        return undefined;
    }

    const host = url.hostname.replace(/^(www\.|m\.|music\.)/, "");

    if (host === "youtu.be" || host === "youtube.com" || host === "youtube-nocookie.com") {
        return parseYouTube(host, url)?.id;
    }
    if (host === "open.spotify.com" || host === "play.spotify.com") {
        return parseSpotify(url)?.id;
    }
    if (host === "soundcloud.com" || host === "on.soundcloud.com" || host === "api.soundcloud.com") {
        return parseSoundCloud(host, url)?.id;
    }

    return undefined;
}