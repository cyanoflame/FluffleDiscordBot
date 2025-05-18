import { Database, SQLiteError } from "bun:sqlite"


/**
 * This is used for accessing an Sqlite database to retrieve data.
 */
export default class SqliteDb {
    /** The singleton instance of the class */
    private static instance: SqliteDb | undefined;

    /** The reference to the database */
    private static db: Database | undefined;

    /**
     * The constructor for the database object. If the DB has not been created, it will be 
     * be created for the application.
     * @param path The path to the sqlite DB file.
     */
    private constructor(path: string) {
        try {
            // Try to access the DB first -- if it cannot access it, it will make a new one and setup the schema
            SqliteDb.db = new Database(path, {
                create: false,
                strict: true
            })
        } catch(err) {
            // Should go here if there is no db file
            if(err instanceof SQLiteError && err.errno == 21) {
                // Create the new DB
                SqliteDb.db = new Database(path, {
                    create: false,
                    strict: true
                })

                // Setup the DB schema
                this.createDatabaseSchema(SqliteDb.db);
            }
        }
    }

    public static getInstance(path: string = ":memory:"): SqliteDb {
        // if there is no DB
        if(SqliteDb.instance == undefined) {
            // create the DB
            SqliteDb.instance = new SqliteDb(path);
        }
        // Return the singleton instance
        return SqliteDb.instance;
    }

    private createDatabaseSchema(db: Database): void {
        // enable write-ahead logging mode
        db.exec("PRAGMA journal_mode = WAL;");

        // // create the server table
        // db.run(`
        //     CREATE TABLE guild_config (
        //         id INTEGER NOT NULL PRIMARY KEY,
        //         guild_id INTEGER NOT NULL
        //     );
        // `);

        // create the channel whitelist for guilds
        db.run(`
            CREATE TABLE whitelisted_channel (
                id INTEGER NOT NULL PRIMARY KEY,
                guild_id INT NOT NULL,
                channel_id INTEGER NOT NULL UNIQUE
            );
        `);

        // create the channel blacklist for guilds
        db.run(`
            CREATE TABLE blacklisted_channel (
                id INTEGER NOT NULL PRIMARY KEY,
                guild_id INTEGER NOT NULL,
                channel_id INTEGER NOT NULL UNIQUE
            );
        `);
    }

    public getWhitelist(guildId: number, channelId: number) {
        db.query(`SELECT channel_id FROM whitelisted_channel WHERE guild_id = $guildId;`)
    }
}