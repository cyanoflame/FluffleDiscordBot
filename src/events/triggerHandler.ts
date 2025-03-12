import { Message } from 'discord.js'

import type { Trigger } from '../triggers/trigger.ts'
import { RateLimitedHandler } from './rateLimitedHandler.ts'
import type { EventHandler } from './eventHandler.ts'

/**
 * This class is used for handling any triggers that occur.
 */
class TriggerHandler extends RateLimitedHandler implements EventHandler {

    // the list of triggers that are chedked to be executed
    private triggers: Trigger[]

    // universal data store for access by an event
    private eventDataService: EventDataService

    constructor(
        triggers: Trigger[],
        eventDataService: EventDataService,
        rateLimitAmount: number, 
        rateLimitInterval: number
    ) {
        // Create the rate limiter
        super(rateLimitAmount, rateLimitInterval)

        // Set the triggers
        this.triggers = triggers

        // Set the event data service for the object
        this.eventDataService = eventDataService
    }

    public async process(msg: Message): Promise<void> {
        // Check for any rate limiting and 
        if(this.isRateLimited(msg.author.id)) {
            return
        }

        // Find triggers caused by this message
        let triggers = this.triggers.filter(trigger => {
            if(trigger.requireGuild && !msg.guild) {
                return false
            }

            if(!trigger.triggered(msg)) {
                return false
            }

            return true
        })

        // If this message causes no triggers then return
        if(triggers.length === 0) {
            return
        }

        // Get data from database
        let data = await this.eventDataService.create({
            user: msg.author,
            channel: msg.channel,
            guild: msg.guild,
        })

        // Execute triggers
        for (let trigger of triggers) {
            await trigger.execute(msg, data)
        }
    }
}
