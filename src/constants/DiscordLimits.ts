/**
 * This class contains static variabls that are the limit for what 
 * Discord allows for different things.
 */
export class DiscordLimits {
    /** Discord bots must shard when dealing with > this many servers at once. */
    public static readonly GUILDS_PER_SHARD = 2500;
    /** Discord guilds/servers can have up to this many channels. */
    public static readonly CHANNELS_PER_GUILD = 500;
    /** Discord guilds/servers can have up to this many roles. */
    public static readonly ROLES_PER_GUILD = 250;
    /** Discord guilds/servers can have up to this many pinned messages in a single channel. */
    public static readonly PINS_PER_CHANNEL = 50;
    /** Discord guilds/servers can have up to this many currently active threads. */
    public static readonly ACTIVE_THREADS_PER_GUILD = 1000;
    /** Discord messages can have up to this many embeds in a single message. */
    public static readonly EMBEDS_PER_MESSAGE = 10;
    /** Discord message embeds can have up to this many fields. */
    public static readonly FIELDS_PER_EMBED = 25;
    /** Discord slash commands can send up to this many autocomplete suggestions returned/displayed at one time. */
    public static readonly CHOICES_PER_AUTOCOMPLETE = 25;
    /** Discord embeds can have at most this many characters total (sum of ALL characters across ALL embed structures). */
    public static readonly EMBED_COMBINED_LENGTH = 6000;
    /** Discord embeds can have a title that is at most this many characters long. */
    public static readonly EMBED_TITLE_LENGTH = 256;
    /** Discord embeds can have a description that is at most this many characters long. */
    public static readonly EMBED_DESCRIPTION_LENGTH = 4096;
    /** Discord embeds can have a fields whose names are at most this many characters long. */
    public static readonly EMBED_FIELD_NAME_LENGTH = 256;
    /** Discord embeds can have a footers that are at most this many characters long. */
    public static readonly EMBED_FOOTER_LENGTH = 2048;
}
