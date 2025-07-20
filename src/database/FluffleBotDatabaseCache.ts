import type { FluffleBotDatabase } from "./FluffleBotDatabase";

// All the allowed platforms
type AllowedPlatforms = {
    whitelisted: Set<string>,
    blacklisted: Set<string>
}

// All the configurable settings in a guild
type GuildSettings = {
    outputChannelId: string | null,
    nsfw: boolean,
    platforms: AllowedPlatforms | null,
    allowed: boolean, // if there are ANY whitelisted channels, than this WILL be false.
};

// All the configurable settings for a channel
type ChannelSettings =  GuildSettings & {
    guildId: string | null,
    allowed: boolean | null
}

/**
 * This class is used by the bot as an intermediary for the database, making use of it to 
 * cache commands
 */
export class FluffleBotDatabaseCache {

    /** The instance used to access the database. */
    private readonly db: FluffleBotDatabase;

    // Requires: 
    // - O(1) check for whitelist/blacklist, and O(1) access to allowed platforms
    // - Channels without any settings do NOT have an entry in the database

    /** Cached settings stored from the DB */
    private guildSettings: Map<string, GuildSettings>;
    private channelSettings: Map<string, ChannelSettings >;

    /**
     * This creates the object with a database instance used to access the database when it needs
     * @param db The database accessor being used by the cache to pull from the database.
     */
    constructor(db: FluffleBotDatabase) {
        // Store the database accessor
        this.db = db;

        // create the maps used for the cache
        this.guildSettings = new Map<string, GuildSettings>();
        this.channelSettings = new Map<string, ChannelSettings>();
    }

    private canUseChannel(channelId: string): boolean {
        // First check for channel specific settings
        let channel = this.channelSettings.get(channelId);
        if(channel) {
            // If the channel usability depends on the guild, check the guild. Otherwise, it is as it specifies.
            if(channel.allowed != null) {
                // Return whether or not the channel is white/black listed
                return channel.allowed;
            }
            // Then check for the guild-specific settings
            if(channel.guildId) {
                let guild = this.channelSettings.get(channel.guildId);
                if(guild) {
                    // Check the guild to see if there are any whitelisted channels
                    return guild.allowed;
                }
            }
        }
        // Nothing stopping it from being used
        return true;
    }

    private getSettings(channelId: string, guildId?: string | null): GuildSettings & ChannelSettings | undefined {
        // First check for channel specific settings
        let channel = this.channelSettings.get(channelId);
        let temp: any = {};

        for(const key: keyof ChannelSettings in channel) {
            temp[key] = channel[key] as any;
        }
        if(channel) {
            // If the channel usability depends on the guild, check the guild. Otherwise, it is as it specifies.
            if(channel.allowed != null) {
                // Return whether or not the channel is white/black listed
                return channel.allowed;
            }
            // Then check for the guild-specific settings
            if(channel.guildId) {
                let guild = this.channelSettings.get(channel.guildId);
                if(guild) {
                    // Check the guild to see if there are any whitelisted channels
                    return guild.allowed;
                }
            }
        }
        // Nothing stopping it from being used
        return undefined;
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
