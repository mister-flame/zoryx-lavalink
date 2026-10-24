import Track from "./Track";

/**
 * The User class represents a user in the database, with its favorite tracks and other related information.
 */

class User {

    private userId: string;
    private favoriteTracks: Track[];

    constructor(userId: string) {
        this.userId = userId;
        this.favoriteTracks = [];
    }

    public getUserId(): string {
        return this.userId;
    }

    public getFavoriteTracks(): Track[] {
        return this.favoriteTracks;
    }

    public setFavoriteTracks(tracks: Track[]): void {
        this.favoriteTracks = tracks;
    }
}

export default User;