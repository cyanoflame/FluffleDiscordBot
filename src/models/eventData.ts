import { Locale } from 'discord.js'

/**
 * Whenever an event happens, data gets stored data gets passed along through this object.
 * The Data should be set from an EventDataService object.
 */
export class EventData {
    // TODO: Add any data you want to store

    /** Event language */
    public lang: Locale

    /** Guild language */
    public langGuild: Locale

    /**
     * This creates the event, storing the event data to the object.
     * @param lang The language of the event.
     * @param langGuild The language of the guild.
     */
    constructor(lang: Locale, langGuild: Locale) {
        this.lang = lang
        this.langGuild = langGuild
    }
}
