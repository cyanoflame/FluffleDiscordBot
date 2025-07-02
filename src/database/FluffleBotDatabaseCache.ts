import type { FluffleBotDatabase } from "./FluffleBotDatabase";

/**
 * This class is used by the bot as an intermediary for the database, making use of it to 
 * cache commands
 */
export class FluffleBotDatabaseCache implements FluffleBotDatabase {

    /** The instance used to access the database. */
    private readonly db: FluffleBotDatabase;

    /** Cached settings stored from the DB */
    private guildSettings: Map<string, { // guildId -->
        // These should be hash sets for O(1) lookup
        whitelistedChannels?: Set<string>, // set of channel ids
        blacklistedChannels?: Set<string>, // set of channel ids
    }>;

    /**
     * This creates the object with a database instance used to access the database when it needs
     * @param db The database accessor being used by the cache to pull from the database.
     */
    constructor(db: FluffleBotDatabase) {
        // Store the database accessor
        this.db = db;

        // create the cache
        this.guildSettings = new Map<string, {
            whitelistedChannels: Set<string>,
            blacklistedChannels: Set<string>
        }>();
    }

        ///// C /////
    
    /**
     * This is used to add a whitelisted channel.
     * @param guildId the discord id of the guild to add a whitelisted channel for.
     * @param channelId the discord id of the channel being whitelisted.
     * @throws ReferenceError if the DB is not initialized yet.
     */
    public addToGuildWhitelist(guildId: string, channelId: string): void {
        //
    }

    /**
     * This is used to add a whitelisted channel.
     * @param guildId the discord id of the guild to add a whitelisted channel for.
     * @param channelId the discord id of the channel being whitelisted.
     * @throws ReferenceError if the DB is not initialized yet.
     */
    public addToGuildBlacklist(guildId: string, channelId: string): void {
        //
    }

    ///// R /////

    /**
     * This is used to get the whitelisted channels for a guild.
     * @param guildId the id of the discord guild to get the whitelisted channels for.
     * @throws ReferenceError if the DB is not initialized yet.
     */
    public getGuildWhitelist(guildId: string): {channelId: string}[] {
        let settings = this.guildSettings.get(guildId);
        if(!settings || !settings.whitelistedChannels) {
            // If the whitelisted settings haven't been retrieved yet, get them and add them to the cache
            let whitelist = new Set<string>();
            // Cache the channels for the guild
            this.db.getGuildWhitelist(guildId).forEach(channel => {
                whitelist.add(channel.channelId);
            });
            if(!settings) {
                // insert a new guild entry
                this.guildSettings.set(guildId, {
                    whitelistedChannels: whitelist
                });
            } else {
                // insert just the list to the entry
                settings.whitelistedChannels = whitelist;
            }
        }

        return Array.from(settings!.whitelistedChannels!.values());
    }

    /**
     * This is used to get the blacklisted channels for a guild.
     * @param guildId the id of the discord guild to get the blacklisted channels for.
     * @throws ReferenceError if the DB is not initialized yet.
     */
    public getGuildBlacklist(guildId: string): {channelId: string}[] {
        //
    }

    ///// U /////

    // None - since it's either there or not for the current whitelist/blacklist setup //

    ///// D /////

    /**
     * This is used to remove a whitelisted channel from a guild.
     * @param channelId the discord id of the channel being removed from the whitelist.
     * @throws ReferenceError if the DB is not initialized yet.
     */
    public removeFromGuildWhitelist(channelId: string): void {
        //
    }

    /**
     * This is used to remove a blacklisted channel from a guild.
     * @param channelId the discord id of the channel being removed from the blacklist.
     * @throws ReferenceError if the DB is not initialized yet.
     */
    public removeFromGuildBlacklist(channelId: string): void {
        //
    }
}
