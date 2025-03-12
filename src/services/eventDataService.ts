import {
    CommandInteractionOptionResolver,
    Guild,
    User,
} from 'discord.js'

import type {
    Channel,
    PartialDMChannel
} from 'discord.js'

import { Language } from '../models/enum-helpers/language.ts'
import { EventData } from '../models/eventData.ts' 

/**
 * This class is used to retrieve and pass any extra data into an event when it happens
 */
export class EventDataService {

    /**
     * This method creates the event data
     * @param options Any options passed in from the event that may be required to get anything else related to the event.
     * @returns A promise with the extra data added on to go with the event.
     */
    public async create(
        options: {
            user?: User
            channel?: Channel | PartialDMChannel
            guild?: Guild
            args?: Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>
        } = {}
    ): Promise<EventData> {
        // TODO: Retrieve any data you want to pass along in events

        // Event language
        let lang =
            options.guild?.preferredLocale &&
            Language.Enabled.includes(options.guild.preferredLocale)
                ? options.guild.preferredLocale
                : Language.Default

        // Guild language
        let langGuild =
            options.guild?.preferredLocale &&
            Language.Enabled.includes(options.guild.preferredLocale)
                ? options.guild.preferredLocale
                : Language.Default

        return new EventData(lang, langGuild)
    }
}
