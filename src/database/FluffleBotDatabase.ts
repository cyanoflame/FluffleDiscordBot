/** This represents the data in the platform table in the DB. */
export type Platform = {
    fluffle_id: string,
    name: string
}

/** This represents am anstract data type for allowed. */
export type AllowedPlatform = Platform & {
    // // True = whitelisted -- False = blacklisted -- null = neither (allowed if no whitelist, disallowed if specifically blacklisted)
    // allowed: boolean | null // problem: if the main list is updated, then they will never receive an update
    // True = whitelisted -- False = blacklisted -- not present = neither (allowed if no whitelist, disallowed if specifically blacklisted)
    allowed: boolean
}

/** These are configurable settings, stored in the databse. */
export type Config = {
    /** The id of the channel to send the output, or null if none */
    outputChannelDiscordId: string | null,
    /** Whether or not to use NSFW sources */
    nsfw: boolean
}

// Guild settings > Channel Settings
// Guild settings take precedence over channel settings.

/** Settings specifically associated with a guild */
export type GuildConfig = Config & {
    /** The discord id of the guild */
    guildDiscordId: string
};

/** Settings specifically associated with a channel. */
export type ChannelConfig = Config & {
    /** The discord id of the guild the channel is associated with, or null if there is none. */
    guildDiscordId: string | null,
    /** The discord id of the channel or null if it doesn't have one. */
    channelDiscordId: string
};

/** The channel whitelist and blacklist for a guild. */
export type AllowList = {
    /** What channels are allowed for the guild. */
    whitelist: Set<string>,
    /** What channels are not allowed for the guild. */
    blacklist: Set<string>
};

/**
 * This interface is used to establish all of the common database methods used by the FluffleDiscordBot.
 * The database will be bot-implementation-specific, as this on is to the FluffleDiscordBot.
 */
export interface FluffleBotDatabase {

    ///// C /////

    // createGuildConfig(config: GuildConfig): Promise<void>;

    ///// R /////
    
    /**
     * Returns all the currently supported platforms.
     * @return List of all supported platforms for the service.
     */
    getPlatforms(): Promise<Platform[]>;

    /**
     * Retrieve the guild configuration info from the database for the guild if able.
     * @param channelguildId The Discord id of the guild to retrieve.
     * @return The config data of the guild or undefined if it could not find it.
     */
    getGuildConfig(guildId: string): Promise<GuildConfig | undefined>;

    /**
     * Returns configured list of platform for a guild. Only includes whitelisted and 
     * blacklisted platforms. All other platforms depend on those.
     * @param guildId The Discord id of the guild.
     * @return List of specific platform configurations for a guild.
     */
    getGuildPlatforms(guildId: string): Promise<AllowedPlatform[]>;

    /**
     * Retrieve the channel configuration info from the database for the channel if able.
     * @param channelId The Discord id of the channel to retrieve.
     * @return The config data of the channel or undefined if it could not find it.
     */
    getChannelConfig(channelId: string): Promise<ChannelConfig | undefined>;

    /**
     * Returns configured list of platforms for a channel. Only includes whitelisted and 
     * blacklisted platforms. All other platforms depend on those.
     * @param channelId The Discord id of the channel.
     * @return List of specific platform configurations for a channel.
     */
    getChannelPlatforms(channelId: string): Promise<AllowedPlatform[]>;

    /**
     * Returns a list of whitelisted and blacklisted channels for a guild. Returns undefined if 
     * there are no whitelisted or blacklisted channels.
     * @param guildId The Discord id of the guild.
     * @return The list of whitelisted Discord ids of channels whitelisted for a server.
     */
    getGuildChannelAllowList(guildId: string): Promise<AllowList | undefined>;

    ///// U /////

    ///// D /////

}
