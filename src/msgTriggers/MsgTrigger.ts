import { Client, Message } from 'discord.js'


import { EventData } from '../models/eventData.ts'

/**
 * A Trigger is executed whenever conditions with a specific message are met.
 */
interface MsgTrigger {

    /** Whether or not a the guild the message originates from is necessary or not */
    requireGuild: boolean;
    
    /**
     * This is the method used to check the conditions for whether or not the trigger will be executed.
     * @param msg The message causing the trigger.
     */
    triggered(msg: Message): boolean;
    
    /**
     * When the trigger conditions are met, this function will be executed.
     * @param client The Discord client to run any commands to interact with Discord.
     * @param msg The message casuing the trigger.
     * @param data The data related to the event, passed in from the EventDataService.
     */
    execute(client: Client, msg: Message, data: EventData): Promise<void>;
}

export type {
    MsgTrigger
}
