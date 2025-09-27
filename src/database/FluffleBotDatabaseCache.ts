import type { AllowedPlatform, AllowList, ChannelConfig, Config, FluffleBotDatabase, GuildConfig, Platform } from "./FluffleBotDatabase";

export type FullGuildConfig = GuildConfig & {
    /** A list of the specific platforms allowed/disallowed (by fluffle_id) or null if all are allowed. */
    platforms: string[] | null,
    /** The whitelisted and blacklisted channels for the guild or undefined if there are none. */
    allowList: AllowList | undefined
}

export type FullChannelConfig = ChannelConfig & {
    /** A list of the specific platforms allowed by fluffle_id */
    platforms: string[] | null
}

// TODO: Add periodic checking for new platforms to seamlessly add new ones -- only need to update blacklisted ones
// TODO: Remove channels when they are deleted

/**
 * This class is used by the bot as an intermediary for the database, making use of it to 
 * cache commands
 */
export class FluffleBotDatabaseCache {

    /** The instance used to access the database. */
    private readonly db: FluffleBotDatabase;

    /** This is the default global config, used by default and for channels and guilds when no data stored prior. */
    private static readonly DEFAULT_GLOBAL_CONFIG: Config = {
        outputChannelDiscordId: null,
        nsfw: true
    };

    // Requires: 
    // - O(1) check for whitelist/blacklist, and O(1) access to allowed platforms
    // - Channels without any settings do NOT have an entry in the database

    /** Cached settings stored from the DB */

    /** A list (of fluffle_ids) of all currently supported platforms. Not needed to be converted to strings the only 
     * string lists are those that have specified platforms. */
    private allPlatforms: Platform[] | undefined; 
    /** The settings stored for particular guilds -- null value if is using the default config */
    private guildSettings: Map<string, FullGuildConfig | null>;
    /** The settings stored for particular channels -- null value if using default config */
    private channelSettings: Map<string, FullChannelConfig | null>;

    /**
     * This creates the object with a database instance used to access the database when it needs
     * @param db The database accessor being used by the cache to pull from the database.
     */
    constructor(db: FluffleBotDatabase) {
        // Store the database accessor
        this.db = db;

        // Create the cached variables
        this.allPlatforms = [];
        this.guildSettings = new Map<string, FullGuildConfig | null>();
        this.channelSettings = new Map<string, FullChannelConfig | null>();
    }

    /**
     * Private helper method to get all of the platforms currently supported.
     * @returns List of fluffle_ids for all currently supported platforms.
     */
    private async getSupportedPlatforms(): Promise<Platform[]> {
        // if already made and cached, return the cached one
        if(!this.allPlatforms) {
            // Get the platforms from the DB
            this.allPlatforms = await this.db.getPlatforms();
        }
        // return the cached set of platforms
        return this.allPlatforms;
    }

    /**
     * Private helper method used to create a list of platform strings (of fluffle_ids) allowed to be 
     * used from a list of allowedPlatforms. If there are any whitelisted, it will return the whitelisted 
     * channels. If there are any blacklisted, it will not return those.
     * @param allowedPlatforms The list of allowed platforms to check.
     * @return List of fluffle ids for all the allowed platforms found.
     */
    private static generatePlatformList(allPlatforms: Platform[], allowedPlatforms: AllowedPlatform[]): string[] | null {
        // if nothing is in allowedPlatforms, it uses all by default
        if(allowedPlatforms.length == 0) {
            return null;
        }
        // Track all of the allowed platform strings
        let allowedPlatformStrings: string[] = [];
        // Get just a list of either whitelisted or blacklisted platforms
        let currentPlatforms: AllowedPlatform[] = [allowedPlatforms[0]];
        for(let i = 1; i < allowedPlatforms.length; i++) {
            // Record whether there is only whitelisted or blacklisted platforms, because there cannot be both
            if(allowedPlatforms[0].allowed) {
                if(allowedPlatforms[i].allowed) {
                    // // if it's a whitelisted set of platforms, then use only whitelisted platforms
                    // currentPlatforms.push(allowedPlatforms[i]);
                    // add to the list of returned strings
                    allowedPlatformStrings.push(allowedPlatforms[i].fluffle_id);
                }
            } else {
                if (allowedPlatforms[i].allowed) {
                    // Clear the blacklisted platforms for only whitelisted ones
                    currentPlatforms = [allowedPlatforms[i]];
                    // add to the list of returned strings
                    allowedPlatformStrings.push(allowedPlatforms[i].fluffle_id);
                } else {
                    // Add to the list of blacklisted platforms
                    currentPlatforms.push(allowedPlatforms[i]);
                }
            }
        }
        // Return just the whitelisted ones if there were any
        if(allowedPlatforms[0].allowed) {
            return allowedPlatformStrings;
        }
        // Otherwise, return all of the non-blacklisted platforms
        for(let i = 0; i < allPlatforms.length; i++) {
            // Find the index of the platform in the blacklisted platforms
            let blacklistedIndex = currentPlatforms.findIndex((platform) => {
                return platform.fluffle_id === currentPlatforms[i].fluffle_id;
            });
            if(blacklistedIndex != -1) {
                // Remove it from the blacklisted platforms list to improve searching (needs testing)
                currentPlatforms.splice(blacklistedIndex, 1);
            } else {
                // Add it to the allowed platforms string
                allowedPlatformStrings.push(allPlatforms[i].fluffle_id);
            }
        }
        // Return the remaining allowed platforms
        return allowedPlatformStrings;
    }

    /**
     * Private method used to get the default guild config.
     * @returns The default configuration for a guild.
     */
    private static getDefaultGuildConfig(guildId: string): FullGuildConfig {
        return {
            guildDiscordId: guildId,
            platforms: null,
            allowList: undefined,
            ...FluffleBotDatabaseCache.DEFAULT_GLOBAL_CONFIG
        }
    }

    /**
     * Private helper method used to get the guild from the cache, and if it's not in the cache,
     * retrieve it from the databse.
     * @param guildId The Discord id of the guild to retrieve. If null, then it will return the gloabl default.
     * @return The data for the guild or the default config it it's not found if not found. 
     */
    private async getGuild(guildId: string): Promise<FullGuildConfig> {
        // First check check the cache
        let guild = this.guildSettings.get(guildId);
        
        // If the default config is to be used
        switch(guild) {
            case null: {
                // if null is the value, then guild has been cached using defaults
                guild = FluffleBotDatabaseCache.getDefaultGuildConfig(guildId);
                break;
            }
            case undefined: {
                // If the guild is not in the cache, attempt to retrieve the guild settings from the db
                let guildConfig = await this.db.getGuildConfig(guildId);
                // if it found the guild, retrieve the whitelisted channels/platforms
                if(guildConfig) {
                    // Get all of the necessary guild data
                    let allPlatforms = this.getSupportedPlatforms();
                    let guildPlatforms = this.db.getGuildPlatforms(guildId);
                    let guildAllowlist = this.db.getGuildChannelAllowList(guildId);
                    // Update the guild settings
                    guild = {
                        guildDiscordId: guildId,
                        outputChannelDiscordId: guildConfig.outputChannelDiscordId,
                        nsfw: guildConfig.nsfw,
                        platforms: FluffleBotDatabaseCache.generatePlatformList(await allPlatforms, await guildPlatforms),
                        allowList: await guildAllowlist
                    };
                    // Add to the cache if it was able to retrieve it
                    this.guildSettings.set(guildId, guild);
                } else {
                    // no guild data in DB -- start with default settings
                    // save null to cache for default settings
                    this.guildSettings.set(guildId, null);
                    // set the guild data to default data
                    guild = FluffleBotDatabaseCache.getDefaultGuildConfig(guildId);
                }
                break;
            }
            // Otherwise the guild was found
        };
        
        // Return retrieved guild data
        return guild;
    }

    /**
     * Private method used to get the default channel config. Attempts to get parent guild's
     * config first, if there is one and it is able
     * @returns The default configuration for a channel.
     */
    private async getDefaultChannelConfig(guildId: string | null, channelId: string): Promise<FullChannelConfig> {
        if(guildId == null) {
            // Default if no guild
            return {
                guildDiscordId: guildId,
                channelDiscordId: channelId,
                outputChannelDiscordId: FluffleBotDatabaseCache.DEFAULT_GLOBAL_CONFIG.outputChannelDiscordId,
                nsfw: FluffleBotDatabaseCache.DEFAULT_GLOBAL_CONFIG.nsfw,
                platforms: null
            };
        } else {
            // Get the settings for the guild
            let guildSettings = await this.getGuild(guildId);
            return {
                channelDiscordId: channelId,
                guildDiscordId: guildId,
                outputChannelDiscordId: guildSettings.outputChannelDiscordId,
                nsfw: guildSettings.nsfw,
                platforms: guildSettings.platforms
            };
        }
    }

    /**
     * Private helper method used to get the channel from the cache, and if it's not in the cache,
     * retrieve it from the databse. If it's not in the databse, it will return undefined.
     * @param channelId The Discord id of the channel to retrieve.
     * @return The data for the channel or undefined if not found. 
     */
    private async getChannel(guildId: string | null, channelId: string): Promise<FullChannelConfig> {
        // First check check the cache
        let channel = this.channelSettings.get(channelId);
        
        // If the default config is to be used
        switch(channel) {
            case null: {
                // if null is the value, then the channel has been cached using defaults for its guild
                channel = await this.getDefaultChannelConfig(guildId, channelId);
                break;
            }
            case undefined: {
                // If the guild is not in the cache, attempt to retrieve the guild settings from the db
                let channelConfig = await this.db.getChannelConfig(channelId);
                // if it found the guild, retrieve the whitelisted channels/platforms
                if(channelConfig) {
                    // Get all of the necessary guild data
                    let allPlatforms = this.getSupportedPlatforms();
                    let channelPlatforms = this.db.getChannelPlatforms(channelId);
                    // Update the guild settings
                    channel = {
                        guildDiscordId: guildId,
                        channelDiscordId: channelId,
                        outputChannelDiscordId: channelConfig.outputChannelDiscordId,
                        nsfw: channelConfig.nsfw,
                        platforms: FluffleBotDatabaseCache.generatePlatformList(await allPlatforms, await channelPlatforms)
                    };
                    // Add to the cache if it was able to retrieve it
                    this.channelSettings.set(channelId, channel);
                } else {
                    // no guild data in DB -- start with default settings
                    // save null to cache for default settings
                    this.guildSettings.set(channelId, null);
                    // set the guild data to default data
                    channel = await this.getDefaultChannelConfig(guildId, channelId);
                }
                break;
            }
            // Otherwise the channel was found
        };
        
        // Return retrieved channel data
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

        // /**
        //  * Create the guild entry in the database and returns the created instance
        //  * @param guildId 
        //  * @param config 
        //  */
        // public async createGuildSettings(guildId: string, config: Partial<GuildSettings>): Promise<GuildSettings> {
        //     // Create it in the DB
        //     this.db.createGuildConfig({
        //         discord_guild_id: guildId,
        //         output_channel_discord_id: config.outputChannelId ?? null,
        //         nsfw: config.nsfw ?? null,
        //     });

        //     // Create the guild settings
        //     let newSettings: GuildSettings = {
        //         outputChannelId: config.outputChannelId ?? null,
        //         nsfw: null,
        //         platforms: null,
        //         allowed: null,
        //     }

        //     // Add it to the cache
        //     this.guildSettings.set(guildId, )
        // }
        // public createChannelSettings();

    ///// R /////


        // public async getGuildSettings(guildId: string | null) {
        //     // Return the default settings if no guild id is specified
        //     if(!guildId) {
        //         return this.DEFAULT_GLOBAL_GUILD_CONFIG;
        //     }

        //     // First check check the cache
        //     let guild = this.guildSettings.get(guildId);
        //     // If the guild is not in the cache, go retrieve the guild settings from the DB
        //     if(!guild) {
        //         // Attempt to get guild settings from database
        //         let guildConfig = await this.db.getGuildConfig(guildId);
        //         // If it found a guild, check it for any whitelisted channels.
        //         if(guildConfig) {
        //             // Get all of the necessary guild data
        //             let allPlatforms = this.getSupportedPlatforms();
        //             let guildPlatforms = this.db.getGuildPlatforms(guildId);
        //             let guildWhitelist = this.db.getGuildWhitelist(guildId);
        //             // Update the guild settings
        //             guild = {
        //                 outputChannelId: guildConfig.output_channel_discord_id,
        //                 nsfw: guildConfig.nsfw,
        //                 platforms: this.generatePlatformList(await allPlatforms, await guildPlatforms),
        //                 allowed: (await guildWhitelist).length > 0,
        //             }
        //             // Add to the cache if it was able to retrieve it
        //             this.guildSettings.set(guildId, guild);
        //         } else {
        //             // no guild data in DB --> return undefined
        //             return undefined;
        //         }
        //     }
        //     // Return any found guild data
        //     return guild;
        // }

        // /**
        //  * Returns the settings for a specific channel. If the channel has no settings, it inherits the settings 
        //  * from the guild. If the channel is a guildless channel, it uses the default settings.
        //  * @param channelId The Discord id of the channel to get the settings for.
        //  * @param guildId The Discord guild id the guild the channel is a part of, or null/undefined if there is none.
        //  * @return The full settings for the channel or the default settings if there are none
        //  */
        // public getChannelSettings(channelId: string, guildId?: string | null): ChannelSettings {
        //     // First check for channel specific settings
        //     let channel = this.channelSettings.has(channelId);
        //     // Get the channel
        //     // If no channel
        //     //      get guild
        //     //          if no guild,
        //     //              get guild from db
        //     //              if not in db, create entry
        //     //          
        // }

    // /**
    //  * This is used to get the whitelisted channels for a guild.
    //  * @param guildId the id of the discord guild to get the whitelisted channels for.
    //  * @throws ReferenceError if the DB is not initialized yet.
    //  */
    // public getGuildWhitelist(guildId: string): {channelId: string}[] {
    //     let settings = this.guildSettings.get(guildId);
    //     if(!settings || !settings.whitelistedChannels) {
    //         // If the whitelisted settings haven't been retrieved yet, get them and add them to the cache
    //         let whitelist = new Set<string>();
    //         // Cache the channels for the guild
    //         this.db.getGuildWhitelist(guildId).forEach(channel => {
    //             whitelist.add(channel.channelId);
    //         });
    //         if(!settings) {
    //             // insert a new guild entry
    //             this.guildSettings.set(guildId, {
    //                 whitelistedChannels: whitelist
    //             });
    //         } else {
    //             // insert just the list to the entry
    //             settings.whitelistedChannels = whitelist;
    //         }
    //     }

    //     return Array.from(settings!.whitelistedChannels!.values());
    // }

    // /**
    //  * This is used to get the blacklisted channels for a guild.
    //  * @param guildId the id of the discord guild to get the blacklisted channels for.
    //  * @throws ReferenceError if the DB is not initialized yet.
    //  */
    // public getGuildBlacklist(guildId: string): {channelId: string}[] {
    //     //
    // }

    ///// U /////

    // None - since it's either there or not for the current whitelist/blacklist setup //

    ///// D /////

    // /**
    //  * This is used to remove a whitelisted channel from a guild.
    //  * @param channelId the discord id of the channel being removed from the whitelist.
    //  * @throws ReferenceError if the DB is not initialized yet.
    //  */
    // public removeFromGuildWhitelist(channelId: string): void {
    //     //
    // }

    // /**
    //  * This is used to remove a blacklisted channel from a guild.
    //  * @param channelId the discord id of the channel being removed from the blacklist.
    //  * @throws ReferenceError if the DB is not initialized yet.
    //  */
    // public removeFromGuildBlacklist(channelId: string): void {
    //     //
    // }
}
