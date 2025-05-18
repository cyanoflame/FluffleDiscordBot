import SqliteDb from "./sqlite/SqliteDb";

type GuildData = {
    channelWhitelist: Set<number>,
    channelBlacklist: Set<number>
}

/**
 * This class access the database when needed. It lazily loads/caches data used in a hash map.
 */
class DbAccessor {
    /** The database accessed by the object */
    private readonly db: SqliteDb;

    /** This is the cached data, so that the DB doesn't need to be accessed all the time.
     * guild_id -> set of channel_ids
     */
    private cachedData: Map<number, GuildData>

    constructor() {
        // Create the connection to the DB
        this.db = SqliteDb.getInstance();
        // Create the cached data object
        this.cachedData = new Map<number, GuildData>;
    }

    public isChannelWhitelisted(guildId: number, channelId: number) {
        let guildData = this.cachedData.get(guildId);
        if(guildData) {
            // The data is cached --> get it from the cache
            return guildData.channelWhitelist.has(channelId);
        } else {
            // Otherwise check the database to load the data into the cache
            if()
        }
    }
}