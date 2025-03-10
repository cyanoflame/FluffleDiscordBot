import { Message } from 'discord.js'
import { RateLimiter } from 'discord.js-rate-limiter'

import { EventDataService } from '../services/index.js'
import type { Trigger } from '../triggers/trigger.ts'

/**
 * This class is used for handling any triggers that occur.
 */
class TriggerHandler {
    // used to rate limit the use of the trigger
    private rateLimiter: RateLimiter

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
        this.triggers = triggers
        this.eventDataService = eventDataService
        this.rateLimiter = new RateLimiter(
            rateLimitAmount, // Config.rateLimiting.triggers.amount,
            rateLimitInterval, //Config.rateLimiting.triggers.interval * 1000
        )
    }

    public async process(msg: Message): Promise<void> {
        // Check if user is rate limited
        let limited = this.rateLimiter.take(msg.author.id)
        if(limited) {
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
