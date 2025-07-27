import type { AllowedPlatform, FluffleBotDatabase, GuildConfig } from "./FluffleBotDatabase";

// All the configurable settings in a guild
type GuildSettings = {
    outputChannelId: string | null,
    nsfw: boolean,
    /** A list of the specific platforms allowed (by fluffle_id) or null if all are allowed. */
    platforms: string[] | null,
    allowed: boolean, // if there are ANY whitelisted channels, than this WILL be false.
};

// All the configurable settings for a channel
type ChannelSettings =  GuildSettings & {
    guildId: string | null,
    /** Whether or not the channel is allowed to be used. If it is null, then it will need to reference the guild's allowed. */
    allowed: boolean | null,
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

    /** A list (of fluffle_ids) of all currently supported platforms. */
    private allPlatforms: string[] | undefined;
    /** The settings stored for particular guilds. */
    private guildSettings: Map<string, GuildSettings>;
    /** The settings stored for particular channels. */
    private channelSettings: Map<string, ChannelSettings >;

    /**
     * This creates the object with a database instance used to access the database when it needs
     * @param db The database accessor being used by the cache to pull from the database.
     */
    constructor(db: FluffleBotDatabase) {
        // Store the database accessor
        this.db = db;

        // Create the cached variables
        this.allPlatforms = [];
        this.guildSettings = new Map<string, GuildSettings>();
        this.channelSettings = new Map<string, ChannelSettings>();
    }

    /**
     * Private helper method to get all of the platforms currently supported.
     * @returns List of fluffle_ids for all currently supported platforms.
     */
    private async getSupportedPlatforms(): Promise<string[]> {
        // If already made and cached, return the cached one
        if(!this.allPlatforms) {
            // Otherwise add all of them to the cache
            this.allPlatforms = [];
            for(const platform of await this.db.getPlatforms()) {
                this.allPlatforms.push(platform.fluffle_id);
            }
        }
        // return the cached set oof platforms
        return this.allPlatforms;
    }

    /**
     * Private helper method used to create a list platform strings (using fluffle_ids) to 
     * from a list and a list of platforms white/blacklisted.
     * @param allPlatformsList The list of all platforms to consider.
     * @param allowedPlatforms The list of allowed platforms to check.
     * @return List of ids for all the allowed platforms found.
     */
    private generatePlatformList(allPlatformsList: string[], allowedPlatforms: AllowedPlatform[]): string[] {
        // Track all of the blacklisted platforms
        let blacklisted: Set<string> = new Set<string>();
        // Make a list of whitelisted platforms to use
        let whitelisted: string[] = [];
        for(const checkPlatform of allowedPlatforms) {
            // If there are any whitelisted, make a list of just the whiteliste dones
            if(checkPlatform.allowed) {
                whitelisted.push(checkPlatform.fluffle_id);
            } else {
                blacklisted.add(checkPlatform.fluffle_id);
            }
        }
        // return just the whitelisted ones if there were specific ones whitelisted
        if(whitelisted.length > 0) {
            return whitelisted;
        } 
        // Otherwise, return all of the not blacklisted channels
        return allPlatformsList.filter(platform => !blacklisted.has(platform));
    }

    /**
     * Private helper method used to get the guild from the cache, and if it's not in the cache,
     * retrieve it from the databse. If it's not in the databse, it will return undefined.
     * @param guildId The Discord id of the guild to retrieve.
     * @return The data for the guild or undefined if not found. 
     */
    private async getGuild(guildId: string): Promise<GuildSettings | undefined> {
        // First check check the cache
        let guild = this.guildSettings.get(guildId);
        // If the guild is not in the cache, go retrieve the guild settings
        if(!guild) {
            // Attempt to get guild settings from database
            let guildConfig = await this.db.getGuildConfig(guildId);
            // If it found a guild, check it for any whitelisted channels.
            if(guildConfig) {
                // Get all of the necessary guild data
                let platforms = this.getSupportedPlatforms();
                let guildPlatforms = this.db.getGuildPlatforms(guildId);
                let guildWhitelist = this.db.getGuildWhitelist(guildId);
                // Update the guild settings
                guild = {
                    outputChannelId: guildConfig.output_channel_discord_id,
                    nsfw: guildConfig.nsfw,
                    platforms: this.generatePlatformList(await platforms, await guildPlatforms),
                    allowed: (await guildWhitelist).length > 0,
                }
                // Add to the cache if it was able to retrieve it
                this.guildSettings.set(guildId, guild);
            } else {
                // no guild data in DB --> return undefined
            }
        }
        // Return any found guild data
        return guild;
    }

    /**
     * Private helper method used to get the channel from the cache, and if it's not in the cache,
     * retrieve it from the databse. If it's not in the databse, it will return undefined.
     * @param channelId The Discord id of the channel to retrieve.
     * @return The data for the channel or undefined if not found. 
     */
    private async getChannel(channelId: string): Promise<ChannelSettings | undefined> {
        // First check check the cache
        let channel = this.channelSettings.get(channelId);
        // If the channel is not in the cache, go retrieve the channel settings
        if(!channel) {
            // Attempt to get guild settings from database
            let channelConfig = await this.db.getChannelConfig(channelId);
            // If it found a channel, check it for any whitelisted channels.
            if(channelConfig) {
                // Get all of the necessary channel data
                let platforms = this.getSupportedPlatforms();
                let channelPlatforms = this.db.getChannelPlatforms(channelId);
                // Update the channel settings
                channel = {
                    guildId: channelConfig.discord_guild_id,
                    outputChannelId: channelConfig.output_channel_discord_id,
                    nsfw: channelConfig.nsfw,
                    platforms: this.generatePlatformList(await platforms, await channelPlatforms),
                    allowed: channelConfig.allowed,
                }
                // Add to the cache if it was able to retrieve it
                this.guildSettings.set(channelId, channel);
            } else {
                // no channel data in DB --> return undefined
            }
        }
        // Return any found channel data
        return channel;
    }

    // /**
    //  * Checks whether or not a channel is usable.
    //  * @param channelId The Discord id of the channel being checked.
    //  * @return Whether or not a channel can be used.
    //  */
    // private canUseChannel(channelId: string): boolean {
    //     // First check for channel specific settings
    //     let channel = this.channelSettings.get(channelId);

    //     if(channel) {
    //         // If the channel usability depends on the guild, check the guild. Otherwise, it is as it specifies.
    //         if(channel.allowed != null) {
    //             // Return whether or not the channel is white/black listed
    //             return channel.allowed;
    //         }
    //         // Then check for the guild-specific settings
    //         if(channel.guildId) {
    //             let guild = this.channelSettings.get(channel.guildId);
    //             if(guild) {
    //                 // Check the guild to see if there are any whitelisted channels
    //                 return guild.allowed;
    //             }
    //         }
    //     }
    //     // Nothing stopping it from being used
    //     return true;
    // }

    // /**
    //  * Returns the settings for a specific channel. If the channel has no settings, it inherits the settings 
    //  * from the guild. If the channel is a guildless channel, it uses the default settings.
    //  * @param channelId The Discord id of the channel to get the settings for.
    //  * @param guildId The Discord guild id the guild the channel is a part of, or null/undefined if there is none.
    //  * @return The full settings for the channel or undefined if there is none.
    //  */
    // private getSettings(channelId: string, guildId?: string | null): GuildSettings & ChannelSettings | undefined {
    //     // First check for channel specific settings
    //     let channel = this.channelSettings.get(channelId);
    //     let temp: any = {};
    //     if(channel == undefined) {
    //         // No channel found return default settings
    //     }
    //     for(const key: keyof ChannelSettings in channel) {
    //         temp[key] = channel[key] as any;
    //     }
    //     if(channel) {
    //         // If the channel usability depends on the guild, check the guild. Otherwise, it is as it specifies.
    //         if(channel.allowed != null) {
    //             // Return whether or not the channel is white/black listed
    //             return channel.allowed;
    //         }
    //         // Then check for the guild-specific settings
    //         if(channel.guildId) {
    //             let guild = this.channelSettings.get(channel.guildId);
    //             if(guild) {
    //                 // Check the guild to see if there are any whitelisted channels
    //                 return guild.allowed;
    //             }
    //         }
    //     }
    //     // Nothing stopping it from being used
    //     return undefined;
    // }

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
