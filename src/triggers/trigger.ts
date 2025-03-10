import { Message } from 'discord.js'

import { EventData } from '../models/eventData.ts'

/**
 * A Trigger is executed whenever conditions with a specific message are met.
 */
export interface Trigger {

    /** Whether or not a the guild the message originates from is necessary or not */
    requireGuild: boolean;
    
    /**
     * This is the method used to check the conditions for whether or not the trigger will be executed.
     * @param msg The message causing the trigger.
     */
    triggered(msg: Message): boolean;
    
    /**
     * When the trigger conditions are met, this function will be executed.
     * @param msg The message casuing the trigger.
     * @param data The data related to the event, passed in from the EventDataService.
     */
    execute(msg: Message, data: EventData): Promise<void>;
}
