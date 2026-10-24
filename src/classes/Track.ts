/**
 * The Track class represents a track in the database, with its metadata and other related information.
 */

class Track {

    private userId: string;
    private trackId: string;
    private title: string;
    private url: string;
    private addedAt: Date | null;
    private platform: string;
    private thumbnailUrl: string;
    /**
     * Creates a new instance of the Track class.
     * @param userId The id of the user who owns the track
     * @param trackId The id of the track
     * @param title The title of the track
     * @param url The URL of the track
     * @param addedAt The date when the track was added
     * @param platform The platform of the track
     * @param thumbnailUrl The URL of the track's thumbnail
     */

    constructor(userId: string, trackId: string, title: string, url: string, addedAt: Date | null = null, platform: string = "youtube", thumbnailUrl: string = "") {
        this.userId = userId;
        this.trackId = trackId;
        this.title = title;
        this.url = url;
        this.addedAt = addedAt;
        this.platform = platform;
        this.thumbnailUrl = thumbnailUrl;
    }
    
    public getUserId(): string {
        return this.userId;
    }

    public getTrackId(): string {
        return this.trackId;
    }

    public getTitle(): string {
        return this.title;
    }

    public getUrl(): string {
        return this.url;
    }

    public getAddedAt(): Date | null {
        return this.addedAt;
    }

    public getPlatform(): string {
        return this.platform;
    }

    public getThumbnailUrl(): string {
        return this.thumbnailUrl;
    }

    public static convertToDate(addedAt: Date | null): string | null {
        if (!addedAt) return null;
        return addedAt.toLocaleDateString("fr-FR", {
            timeZone: "Europe/Paris",
        });
    }
}

export default Track;