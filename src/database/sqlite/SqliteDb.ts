import { Database, SQLiteError } from "bun:sqlite"

/** This is used throughout the class for when the  */
const dbNotInitializedError: ReferenceError = ReferenceError("Database has not been initialized"); // TODO: Language support for this

/**
 * This class is used for creating, managing, and accessing data from an Sqlite database.
 */
export default class SqliteDb {
    /** The singleton instance of the class */
    private static instance: SqliteDb | undefined;

    /** The reference to the database */
    private static db: Database | undefined = undefined;

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
                    create: true,
                    strict: true
                })

                // Setup the DB schema
                this.createDatabaseSchema(SqliteDb.db);
            }
        }
    }

    /**
     * This method is used to initialize the database instance. It must be run first before the 
     * class can be used anywhere.
     * @param path The path to the sqlite db file, or, leave blank or use :memory: to just keep in memory.
     */
    public initialize(path: string = ":memory:"): void {
        // if there is no DB
        if(SqliteDb.instance == undefined) {
            // create the DB
            SqliteDb.instance = new SqliteDb(path);
        }
    }

    /**
     * This gets the current 
     * @returns The current sqlite db being used.
     * @throws ReferenceError if the DB is not initialized yet.
     */
    public static getInstance(): SqliteDb {
        // if there is no DB
        if(SqliteDb.instance == undefined) {
            // Throw an error because the db is not created yet
            throw dbNotInitializedError;
        }
        // Return the singleton instance
        return SqliteDb.instance;
    }

    /**
     * This private method is used to setup the schema for the database. It is used when 
     * creating a new database.
     * @param db The database which to setup the schema for.
     */
    private createDatabaseSchema(db: Database): void {
        // enable write-ahead logging mode
        db.exec("PRAGMA journal_mode = WAL;");

        // enable foreign keys
        db.exec("PRAGMA foreign_keys = 1;");

        // create the guild table
        db.run(`
            CREATE TABLE guild_config (
                id INTEGER NOT NULL PRIMARY KEY,
                discord_guild_id INTEGER NOT NULL
            );
        `);

        // // create the channel table
        // db.run(`
        //     CREATE TABLE channel_config (
        //         id INTEGER NOT NULL PRIMARY KEY,
        //         guild_id INT NOT NULL,
        //         discord_channel_id INTEGER NOT NULL UNIQUE,
        //         whitelisted INT NOT NULL,
        //         blacklisted INT NOT NULL,
        //         -- outputChannelId
        //         -- ...
        //         FOREIGN KEY(guild_id) REFERENCES guild_config(id)
        //     );
        // `);

        // create the channel table
        db.run(`
            CREATE TABLE whitelisted_channel (
                id INTEGER NOT NULL PRIMARY KEY,
                guild_id INT NOT NULL,
                discord_channel_id INTEGER NOT NULL UNIQUE,
                FOREIGN KEY(guild_id) REFERENCES guild_config(id)
            );
        `);

        // create the channel blacklist table
        db.run(`
            CREATE TABLE blacklisted_channel (
                id INTEGER NOT NULL PRIMARY KEY,
                guild_id INTEGER NOT NULL,
                discord_channel_id INTEGER NOT NULL UNIQUE,
                FOREIGN KEY(guild_id) REFERENCES guild_config(id)
            );
        `);
    }

    ///// C /////
    
    /**
     * This is used to add a whitelisted channel.
     * @param guildId the discord id of the guild to add a whitelisted channel for.
     * @param channelId the discord id of the channel being whitelisted.
     * @throws ReferenceError if the DB is not initialized yet.
     */
    public addToGuildWhitelist(guildId: number, channelId: number): void {
        if(SqliteDb.db) {
            // Insert new guild entry if needed
            SqliteDb.db.query(`
                INSERT OR IGNORE INTO guild_config (discord_guild_id) VALUES ($guildId);
            `)
            .run({
                guildId: guildId
            })

            // Add a new whitelisted channel
            SqliteDb.db.query(`
                INSERT INTO whitelisted_channel (guild_id, discord_channel_id) 
                    SELECT guild_config.id, $channelId FROM guild_config WHERE discord_guild_id = $guildId;
            `)
            .run({
                guildId: guildId,
                channelId: channelId
            });
        } else {
            throw dbNotInitializedError;
        }
    }

    /**
     * This is used to add a whitelisted channel.
     * @param guildId the discord id of the guild to add a whitelisted channel for.
     * @param channelId the discord id of the channel being whitelisted.
     * @throws ReferenceError if the DB is not initialized yet.
     */
    public addToGuildBlacklist(guildId: number, channelId: number): void {
        if(SqliteDb.db) {
            // Insert new guild entry if needed
            SqliteDb.db.query(`
                INSERT OR IGNORE INTO guild_config (discord_guild_id) VALUES ($guildId);
            `)
            .run({
                guildId: guildId
            })

            // Add a new whitelisted channel
            SqliteDb.db.query(`
                INSERT INTO blacklisted_channel (guild_id, discord_channel_id) 
                    SELECT guild_config.id, $channelId FROM guild_config WHERE discord_guild_id = $guildId;
            `)
            .run({
                guildId: guildId,
                channelId: channelId
            });
        } else {
            throw dbNotInitializedError;
        }
    }

    ///// R /////

    /**
     * This is used to get the whitelisted channels for a guild.
     * @param guildId the id of the discord guild to get the whitelisted channels for.
     * @throws ReferenceError if the DB is not initialized yet.
     */
    public getGuildWhitelist(guildId: number): {channelId: number}[] {
        if(SqliteDb.db) {
            return SqliteDb.db.query<{channelId: number}, {guildId: number}>(`
                SELECT whitelisted_channel.discord_channel_id FROM whitelisted_channel 
                    JOIN guild_config ON whitelisted_channel.guild_id = guild_config.id 
                    WHERE guild_config.discord_guild_id = $guildId;
            `)
            .all({
                guildId: guildId
            });
        } else {
            throw dbNotInitializedError;
        }
    }

    /**
     * This is used to get the blacklisted channels for a guild.
     * @param guildId the id of the discord guild to get the blacklisted channels for.
     * @throws ReferenceError if the DB is not initialized yet.
     */
    public getGuildBlacklist(guildId: number): {channelId: number}[] {
        if(SqliteDb.db) {
            return SqliteDb.db.query<{channelId: number}, {guildId: number}>(`
                SELECT blacklisted_channel.discord_channel_id FROM blacklisted_channel 
                    JOIN guild_config ON blacklisted_channel.guild_id = guild_config.id 
                    WHERE guild_config.discord_guild_id = $guildId;
            `)
            .all({
                guildId: guildId
            });
        } else {
            throw dbNotInitializedError;
        }
    }

    ///// U /////

    // None

    ///// D /////

    //
}