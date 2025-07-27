/** This represents the data in the channel_config table in the DB */
export type ChannelConfig = {
    discord_channel_id: string,
    discord_guild_id: string | null,
    allowed: boolean,
    output_channel_discord_id: string | null,
    nsfw: boolean,
}
/** This represents the data in the guild_config table in the DB. */
export type GuildConfig = {
    discord_guild_id: string | null,
    output_channel_discord_id: string | null,
    nsfw: boolean,
}
/** This represents the data in the platform table in the DB. */
export type Platform = {
    fluffle_id: string,
    name: string,
}
/** This represents am anstract data type for allowedD*/
export type AllowedPlatform = Platform & {
    allowed: boolean
}
/** This represents the data in the guild_platform table in the DB. */
export type GuildPlatform = AllowedPlatform & {
    guildId: string,
}
/** This represents the data in the channel_platform table in the DB. */
export type ChannelPlatform = AllowedPlatform & {
    channelId: string,
}

/**
 * This interface is used to establish all of the common database methods used by the FluffleDiscordBot.
 * The database will be bot-implementation-specific, as this on is to the FluffleDiscordBot.
 */
export interface FluffleBotDatabase {

    ///// C /////

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
     * Returns a list of whitelisted channels for a guild. If there are none, it will return empty.
     * @param guildId The Discord id of the guild.
     * @return The list of whitelisted Discord ids of channels whitelisted for a server.
     */
    getGuildWhitelist(guildId: string): Promise<string[]>;

    /**
     * Returns configured list of platform for a guild.
     * @param guildId The Discord id of the guild.
     * @return List of specific platform configurations for a guild.
     */
    getGuildPlatforms(guildId: string): Promise<GuildPlatform[]>;

    /**
     * Retrieve the channel configuration info from the database for the channel if able.
     * @param channelId The Discord id of the channel to retrieve.
     * @return The config data of the channel or undefined if it could not find it.
     */
    getChannelConfig(channelId: string): Promise<ChannelConfig | undefined>;

    /**
     * Returns configured list of platforms for a channel.
     * @param guildId The Discord id of the channel.
     * @return List of specific platform configurations for a channel.
     */
    getChannelPlatforms(guildId: string): Promise<ChannelPlatform[]>;

    ///// U /////

    ///// D /////

}
