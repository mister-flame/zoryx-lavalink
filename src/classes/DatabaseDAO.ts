// Import dependencies

import type { Pool } from "pg";
import DatabaseInstance from "./Database";
import User from "./User";
import Track from "./Track";

/**
 * DatabaseDAO is a class that provides data access methods for interacting with the database.
 * Instead of directly using the database connection, this class encapsulates the logic for querying and manipulating data.
 * It uses the DatabaseInstance singleton to obtain a connection pool and perform database operations.
 * This class is designed to be extended or instantiated to provide specific data access methods for different entities in the database.
 * Example usage:
 * const dbDAO = new DatabaseDAO();
 * const user = await dbDAO.getUser("123456789");
 * await dbDAO.createUser("123456789");
 */

class DatabaseDAO {

    /**
     * The pool to communicate with the database is obtained from the DatabaseInstance singleton.
     */

    private pool: Pool;

    /**
     * The constructor initializes the DatabaseDAO instance by obtaining a connection pool from the DatabaseInstance singleton.
     */

    constructor() {
        this.pool = DatabaseInstance.getPool();
    }

    /**
     * Returns a user object from the database based on the provided userId.
     * @param userId the id of user to search in the database
     * @returns the user object if found, otherwise undefined
     */

    public async getUser(userId: string): Promise<User | undefined> {
        const query = 'SELECT userId FROM users WHERE userId = $1';
        const values = [userId];

        try {
            const result = await this.pool.query(query, values);
            const row = result.rows[0];

            if (row) {
                return new User(row.userid);
            } else {
                return undefined;
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            throw error;
        }
    }

    /**
     * Retrieves the favorite tracks of a user from the database based on the provided userId.
     * @param userId The user id to search in the database
     * @returns an array of Track objects representing the user's favorite tracks
     */

    public async getFavoriteTracks(userId: string): Promise<Track[]> {
        const query = 'SELECT * FROM favorite_tracks WHERE userId = $1 ORDER BY addedAt DESC';
        const values = [userId];

        try {
            const result = await this.pool.query(query, values);
            const favoriteTracks: Track[] = [];
            for (const row of result.rows) {
                favoriteTracks.push(new Track(row.userid, row.trackid, row.title, row.url, row.addedat, row.platform, row.thumbnailurl));
            }
            return favoriteTracks;
        } catch (error) {
            console.error('Error fetching favorite tracks:', error);
            throw error;
        }
    }

    /**
     * Retrieves a specific favorite track of a user from the database based on the provided userId and trackId.
     * @param userId The user's id who is targeted
     * @param trackId  The id of the track we want to search
     * @returns the Track object if found, otherwise undefined
     */

    public async getFavoriteTrack(userId: string, trackId: string): Promise<Track | undefined> {
        const query = 'SELECT * FROM favorite_tracks WHERE userId = $1 AND trackId = $2';
        const values = [userId, trackId];

        try {
            const result = await this.pool.query(query, values);
            const row = result.rows[0];

            if (row) {
                return new Track(row.userid, row.trackid, row.title, row.url, row.addedat, row.platform, row.thumbnailurl);
            } else {
                return undefined;
            }
        } catch (error) {
            console.error('Error fetching favorite track:', error);
            throw error;
        }
    }

    /**
     * Creates a new user in the database.
     * @param userId the id of the user to create
     * @returns a promise resolving when the user is created
     */

    public async createUser(userId: string): Promise<void> {
        const query = 'INSERT INTO users (userId) VALUES ($1)';
        const values = [userId];

        try {
            await this.pool.query(query, values);
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    /**
     * Adds a favorite track for a user in the database.
     * @param userId The user's id who is adding the favorite track
     * @param trackId The id of the track to add as a favorite
     * @param title The title of the track
     * @param url The URL of the track
     * @returns a promise resolving when the favorite track is added
     */

    public async addFavoriteTrack(track: Track): Promise<void> {

        if (await this.getFavoriteTrack(track.getUserId(), track.getTrackId())) {
            throw new Error(`La musique : \`${track.getTitle()}\` est déjà présente dans la liste de vos musiques favorites.`);
        }

        const query = 'INSERT INTO favorite_tracks (userId, trackId, title, url, addedAt, platform, thumbnailUrl) VALUES ($1, $2, $3, $4, current_date, $5, $6)';
        const values = [track.getUserId(), track.getTrackId(), track.getTitle(), track.getUrl(), track.getPlatform(), track.getThumbnailUrl()];

        try {
            await this.pool.query(query, values);
        } catch (error) {
            console.error('Error adding favorite track:', error);
            throw error;
        }
    }

    /**
     * Removes a favorite track for a user from the database.
     * @param userId The user's id who is removing the favorite track
     * @param trackId The id of the track to remove from favorites
     * @returns a promise resolving when the favorite track is removed
     */

    public async deleteFavoriteTrack(userId: string, track: Track): Promise<void> {

        if (!(await this.getFavoriteTrack(userId, track.getTrackId()))) {
            throw new Error(`La musique : \`${track.getTitle()}\` n'est pas présente dans la liste de vos musiques favorites.`);
        }

        const query = 'DELETE FROM favorite_tracks WHERE userId = $1 AND trackId = $2';
        const values = [userId, track.getTrackId()];

        try {
            await this.pool.query(query, values);
        } catch (error) {
            console.error('Error removing favorite track:', error);
            throw error;
        }
    }
}

export default DatabaseDAO;