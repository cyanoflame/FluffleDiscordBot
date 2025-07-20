import type { FluffleBotDatabase } from "../FluffleBotDatabase";
import { Database, SQLiteError, constants } from "bun:sqlite"

/** This is used throughout the class for when the  */
const dbNotInitializedError: ReferenceError = ReferenceError("Database has not been initialized"); // TODO: Language support for this

/**
 * This class is used for creating, managing, and accessing data from an Sqlite database.
 */
export default class SqliteDb implements FluffleBotDatabase {
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
        // https://github.com/oven-sh/bun/issues/15876
        // try {
        //     // Try to access the DB first -- if it cannot access it, it will make a new one and setup the schema
        //     SqliteDb.db = new Database(path, {
        //         create: false,
        //         // strict: true
        //     })
        // } catch(err) {
        //     // Should go here if there is no db file
        //     if(err instanceof SQLiteError && err.errno == 21) {
        //         // Create the new DB
        //         SqliteDb.db = new Database(path, {
        //             create: true,
        //             // strict: true
        //         })

        //         // Setup the DB schema
        //         this.createDatabaseSchema(SqliteDb.db);
        //     }
        // }

        // Initialize DB asyncronously
        this.initializeDb(path);
    }

    /**
     * This is a method created to initialize the database asynchronously.
     * The only reason this exists is because there is currently a bug with Bun's Sqlite
     * implementation that makes {create: false} not work. See: https://github.com/oven-sh/bun/issues/15876
     * @param path The path to the database
     */
    public async initializeDb(path: string): Promise<void> {
        if(path != ":memory:" && (await Bun.file(path).exists())) {
            // Try to access the DB first -- if it cannot access it, it will make a new one and setup the schema
            SqliteDb.db = new Database(path, {
                strict: true
            });
        } else {
            // Create the new DB
            SqliteDb.db = new Database(path, {
                create: true,
                strict: true
            });

            // Setup the DB schema
            this.createDatabaseSchema(SqliteDb.db);
        }

        // This prevents wal files from lingering after the DB is closed
        SqliteDb.db.fileControl(constants.SQLITE_FCNTL_PERSIST_WAL, 0);
    }

    /**
     * This method is used to initialize the database instance. It must be run first before the 
     * class can be used anywhere.
     * @param path The path to the sqlite db file, or, leave blank or use :memory: to just keep in memory.
     */
    public static initialize(path: string = ":memory:"): SqliteDb {
        // if there is no DB
        if(SqliteDb.instance == undefined) {
            // create the DB
            SqliteDb.instance = new SqliteDb(path);
        }
        // Return the singeton instance
        return SqliteDb.instance;
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

        // Note: BOOLEAN is just an int that is 0 or 1

        // create the platforms table
        db.run(`
            CREATE TABLE platform (
                id INTEGER NOT NULL PRIMARY KEY,
                fluffle_id TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL UNIQUE
            );
            INSERT INTO supported_platforms (fluffle_id, name) VALUES 
            ('furaffinity','furaffinity'),
            ('twitter', 'twitter'),
            ('e621', 'e621'),
            ('weasyl', 'weasyl'),
            ('furry network', 'furry_network'),
            ('deviantart', 'deviantart'),
            ('inkbunny', 'inkbunny');
        `);

        // create the guild config table
        db.run(`
            CREATE TABLE guild_config (
                id INTEGER NOT NULL PRIMARY KEY,
                discord_guild_id TEXT NOT NULL UNIQUE,
                output_channel_discord_id TEXT,
                nsfw BOOLEAN NOT NULL DEFAULT 1
            );
        `);

        // create the channel config table
        // Whitelisted: allowed == 1
        // Blacklisted: allowed == 0
        // Neither: allowed == null
        db.run(`
            CREATE TABLE channel_config (
                id INTEGER NOT NULL PRIMARY KEY,
                discord_channel_id TEXT NOT NULL UNIQUE,
                guild_id INTEGER,
                allowed BOOLEAN,
                output_channel_discord_id TEXT,
                nsfw BOOLEAN NOT NULL DEFAULT 1.
                FOREIGN KEY(guild_id) REFERENCES guild_config(id)
            );
        `);

        // create the guild platform table
        // Whitelisted: allowed == 1
        // Blacklisted: allowed == 0
        // Neither: not in table
        db.run(`
            CREATE TABLE guild_platform (
                id INTEGER NOT NULL PRIMARY KEY,
                guild_id INTEGER NOT NULL,
                platform_id INTEGER NOT NULL,
                allowed BOOLEAN NOT NULL,
                UNIQUE(guild_id, platform_id),
                FOREIGN KEY(guild_id) REFERENCES guild_config(id),
                FOREIGN KEY(platform_id) REFERENCES platform(id)
            );
        `);

        // create the channel platform table
        // Whitelisted: allowed == 1
        // Blacklisted: allowed == 0
        // Neither: not in table
        db.run(`
            CREATE TABLE channel_platform (
                id INTEGER NOT NULL PRIMARY KEY,
                channel_id INTEGER NOT NULL,
                platform_id INTEGER NOT NULL,
                allowed BOOLEAN NOT NULL,
                UNIQUE(channel_id, platform_id),
                FOREIGN KEY(channel_id) REFERENCES channel_config(id),
                FOREIGN KEY(platform_id) REFERENCES platform(id)
            );
        `);

    }

    ///// C /////

    // Create Guild Config
    public createGuildConfig(guildId: string, outputChannelId?: string | null, allowNsfw?: boolean): void {
        if(SqliteDb.db) {
            // Insert new guild entry if needed
            SqliteDb.db.query(`
                INSERT OR IGNORE INTO guild_config (discord_guild_id, output_channel_discord_id, nsfw) VALUES ($guild, $outputChannel, $nsfw);
            `)
            .run({
                guild: guildId,
                outputChannel: outputChannelId ? outputChannelId: null,
                nsfw: allowNsfw === false ? 0 : 1,
            })
        } else {
            throw dbNotInitializedError;
        }
    }

    // channel_config
    public createChannelConfig(channelId: string, guildId?: string | null, setAllowed?: boolean | null, outputChannelId?: string | null, allowNsfw?: boolean | null): void {
        if(SqliteDb.db) {
            // if the channel is part of a guild, make sure the guild is created first
            if(guildId) {
                // Guild channel -- should link to a guild_config entry
                // Create a guild_config entry
                // this.createGuildConfig(guildId);
                // Insert the channel
                SqliteDb.db.query(`
                    INSERT OR IGNORE INTO channel_config (discord_channel_id, guild_id, allowed, output_channel_discord_id, nsfw) 
                        SELECT $channel, guild_config.id, $allowed, $outputChannel, $nsfw FROM guild_config WHERE discord_guild_id = $guild;
                `)
                .run({
                    channel: channelId,
                    guild: guildId,
                    allowed: setAllowed === undefined ? null : setAllowed, //default null for allowed
                    outputChannel: outputChannelId ? outputChannelId : null, // default to no output channel
                    nsfw: allowNsfw === false ? 0 : 1,
                });
            } else {
                // DMs channel -- no guild reference
                SqliteDb.db.query(`
                    INSERT OR IGNORE INTO channel_config (discord_channel_id, allowed, output_channel_discord_id, nsfw) VALUES 
                        ($channel, $allowed, $outputChannel, $nsfw);
                `)
                .run({
                    channel: channelId,
                    allowed: setAllowed === undefined ? null : setAllowed, //default null for allowed
                    outputChannel: outputChannelId ? outputChannelId : null, // default to no output channel
                    nsfw: allowNsfw === false ? 0 : 1,
                });
            }
        } else {
            throw dbNotInitializedError;
        }
    }

    // create guild platform
    public createGuildPlatform(guildId: string, platformId: string, setAllowed: boolean): void {
        if(SqliteDb.db) {
            SqliteDb.db.query(`
                INSERT OR IGNORE INTO guild_platform (guild_id, platform_id, allowed)  
                    SELECT guild_info.id, platform.id, $allowed FROM (
                        SELECT id FROM guild_config WHERE discord_guild_id = $guild
                    ) AS guild_info JOIN platform ON platform.fluffle_id = $flufflePlatform;
            `)
            .run({
                guild: guildId,
                flufflePlatform: platformId,
                allowed: setAllowed,
            });
        } else {
            throw dbNotInitializedError;
        }
    }

    // create channel platform
    public createChannelPlatform(channelId: string, platformId: string, setAllowed: boolean): void {
        if(SqliteDb.db) {
            SqliteDb.db.query(`
                INSERT OR IGNORE INTO channel_platform (channel_id, platform_id, allowed)  
                    SELECT channel_info.id, platform.id, $allowed FROM (
                        SELECT id FROM channel_config WHERE discord_channel_id = $channel
                    ) AS channel_info JOIN platform ON platform.fluffle_id = $flufflePlatform;
            `)
            .run({
                channel: channelId,
                flufflePlatform: platformId,
                allowed: setAllowed,
            });
        } else {
            throw dbNotInitializedError;
        }
    }
    
    // /**
    //  * This is used to add a whitelisted channel.
    //  * @param guildId the discord id of the guild to add a whitelisted channel for.
    //  * @param channelId the discord id of the channel being whitelisted.
    //  * @throws ReferenceError if the DB is not initialized yet.
    //  */
    // public addToGuildWhitelist(guildId: string, channelId: string): void {
    //     if(SqliteDb.db) {
    //         // Insert new guild entry if needed
    //         SqliteDb.db.query(`
    //             INSERT OR IGNORE INTO guild_config (discord_guild_id) VALUES ($guildId);
    //         `)
    //         .run({
    //             guildId: guildId
    //         })

    //         // Add a new whitelisted channel
    //         SqliteDb.db.query(`
    //             INSERT INTO whitelisted_channel (guild_id, discord_channel_id) 
    //                 SELECT guild_config.id, $channelId FROM guild_config WHERE discord_guild_id = $guildId;
    //         `)
    //         .run({
    //             guildId: guildId,
    //             channelId: channelId
    //         });
    //     } else {
    //         throw dbNotInitializedError;
    //     }
    // }

    // /**
    //  * This is used to add a whitelisted channel.
    //  * @param guildId the discord id of the guild to add a whitelisted channel for.
    //  * @param channelId the discord id of the channel being whitelisted.
    //  * @throws ReferenceError if the DB is not initialized yet.
    //  */
    // public addToGuildBlacklist(guildId: string, channelId: string): void {
    //     if(SqliteDb.db) {
    //         // Insert new guild entry if needed
    //         SqliteDb.db.query(`
    //             INSERT OR IGNORE INTO guild_config (discord_guild_id) VALUES ($guildId);
    //         `)
    //         .run({
    //             guildId: guildId
    //         })

    //         // Add a new whitelisted channel
    //         SqliteDb.db.query(`
    //             INSERT INTO blacklisted_channel (guild_id, discord_channel_id) 
    //                 SELECT guild_config.id, $channelId FROM guild_config WHERE discord_guild_id = $guildId;
    //         `)
    //         .run({
    //             guildId: guildId,
    //             channelId: channelId
    //         });
    //     } else {
    //         throw dbNotInitializedError;
    //     }
    // }

    ///// R /////

    // /**
    //  * This is used to get the whitelisted channels for a guild.
    //  * @param guildId the id of the discord guild to get the whitelisted channels for.
    //  * @throws ReferenceError if the DB is not initialized yet.
    //  */
    // public getGuildWhitelist(guildId: string): {channelId: string}[] {
    //     if(SqliteDb.db) {
    //         return SqliteDb.db.query<{channelId: string}, {guildId: string}>(`
    //             SELECT whitelisted_channel.discord_channel_id AS channelId FROM whitelisted_channel 
    //                 JOIN guild_config ON whitelisted_channel.guild_id = guild_config.id 
    //                 WHERE guild_config.discord_guild_id = $guildId;
    //         `)
    //         .all({
    //             guildId: guildId
    //         });
    //     } else {
    //         throw dbNotInitializedError;
    //     }
    // }

    // /**
    //  * This is used to get the blacklisted channels for a guild.
    //  * @param guildId the id of the discord guild to get the blacklisted channels for.
    //  * @throws ReferenceError if the DB is not initialized yet.
    //  */
    // public getGuildBlacklist(guildId: string): {channelId: string}[] {
    //     if(SqliteDb.db) {
    //         return SqliteDb.db.query<{channelId: string}, {guildId: string}>(`
    //             SELECT blacklisted_channel.discord_channel_id AS channelId FROM blacklisted_channel 
    //                 JOIN guild_config ON blacklisted_channel.guild_id = guild_config.id 
    //                 WHERE guild_config.discord_guild_id = $guildId;
    //         `)
    //         .all({
    //             guildId: guildId
    //         });
    //     } else {
    //         throw dbNotInitializedError;
    //     }
    // }

    ///// U /////

    // None - since it's either there or not for the current whitelist/blacklist setup //

    ///// D /////

    /**
     * This is used to remove a whitelisted channel from a guild.
     * @param channelId the discord id of the channel being removed from the whitelist.
     * @throws ReferenceError if the DB is not initialized yet.
     */
    public removeFromGuildWhitelist(channelId: string): void {
        if(SqliteDb.db) {
            // Delete the row
            SqliteDb.db.query<{guild_id: number}, {channelId: string}>(`
                DELETE FROM whitelisted_channel WHERE discord_channel_id = channelId RETURNING guild_id;
            `).get({
                channelId: channelId
            });
            // deleting the channelConfig record will be handled later (when the bot leaves a server)
        } else {
            throw dbNotInitializedError;
        }
    }

    /**
     * This is used to remove a blacklisted channel from a guild.
     * @param channelId the discord id of the channel being removed from the blacklist.
     * @throws ReferenceError if the DB is not initialized yet.
     */
    public removeFromGuildBlacklist(channelId: string): void {
        if(SqliteDb.db) {
            // Delete the row
            SqliteDb.db.query<{guild_id: number}, {channelId: string}>(`
                DELETE FROM blacklisted_channel WHERE discord_channel_id = channelId RETURNING guild_id;
            `).get({
                channelId: channelId
            });
            // deleting the channelConfig record will be handled later (when the bot leaves a server)
        } else {
            throw dbNotInitializedError;
        }
    }

}
