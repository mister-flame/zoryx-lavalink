// Import the necessary dependencies

import { Pool } from "pg";
import type { PoolConfig } from "pg";
import type { BotConfig } from "../types/index";
import { Database } from "sqlite3";
const config = require("../util/config") as BotConfig;

if (!config.token || !config.clientId) {
    throw new Error("Missing token or clientId in src/config.json or environment variables.");
}

const { pool } = config;

/**
 * DatabaseInstance is a singleton class that manages the PostgreSQL connection pool.
 * It ensures that only one instance of the pool is created and provides methods to access and close the pool.
 */

class DatabaseInstance {

    /**
     * The private static property _pool holds the instance of the PostgreSQL connection pool.
     * It is initialized to null and will be set when the getPool method is called for the first time.
     */

    private static _pool: Pool | null = null;

    /**
     * Returns a PostgreSQL connection pool.
     * @returns A connection pool in order to communicate with the database
     */

    public static getPool(): Pool {
        if (!DatabaseInstance._pool) {
            if (!pool) {
                throw new Error("Database pool configuration is missing.");
            }

            const newPool = new Pool(pool as PoolConfig);
            newPool.on("error", (err) => {
                console.error("Unexpected error on the pool:", err);
            });

            DatabaseInstance._pool = newPool;
        }

        return DatabaseInstance._pool;
    }

    /**
     * Closes the PostgreSQL connection pool if it exists.
     * This method should be called when the application is shutting down to release database resources.
     * @returns A promise that resolves when the pool is closed.
     */

    public static async close(): Promise<void> {
        if (DatabaseInstance._pool) {
            await DatabaseInstance._pool.end();
            DatabaseInstance._pool = null;
        }
    }
}

export default DatabaseInstance;