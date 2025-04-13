import type { MessageTrigger } from '../../messageTriggers/MessageTrigger'
import type { Client, Message } from 'discord.js'
import type { EventData } from '../../models/eventData'
import { Logger } from '../../services/logger'
import { RateLimiterAbstract } from 'rate-limiter-flexible'

import LogMessageTemplates from "../../../lang/logMessageTemplates.json"
import { RateLimiter } from '../../utils/RateLimiter'

/**
 * This class is used to add a rate limiter to a message trigger as a proxy. This keeps the implementation 
 * abstracted from the MessageTrigger object itself while also making it easy to apply.
 */
export class MessageTriggerRateLimitProxy implements MessageTrigger {
    
    /** The rate limiter used for the class */
    private rateLimiter: RateLimiter;

    /** The reference to the proxied object */
    private messageTrigger: MessageTrigger

    /** The name of the proxy - used to identify it the proxy in logs */
    private proxyName: string

    /**
     * Constructs the proxy for a MessageTrigger.
     * @param rateLimiter Either a reference to a rate limiter to use, or an object with the details make a new rate limiter, such that:
     * rateLimitAmount - The amount of requests that can be made within an interval before limiting the rate ;
     * rateLimitInterval - The time (in seconds) that a the amount of requests can be made in before triggering a rate limit.
     * @param proxyName The name of the the proxy, used to identify it in logging.
     * @param messageTrigger The messageTrigger object that is being rate limited.
     */
    constructor(rateLimiter: {rateLimitAmount: number, rateLimitInterval: number} | RateLimiterAbstract, proxyName: string, messageTrigger: MessageTrigger) {
        // Create the rate limiter
        this.rateLimiter = new RateLimiter(rateLimiter);

        // Store the reference to the proxied object
        this.messageTrigger = messageTrigger;

        // Store the name of the proxy - used for logging
        this.proxyName = proxyName;
    }

    /**
     * Returns the proxied message trigger's isGuildRequired result.
     * @returns the proxied message trigger's isGuildRequired result.
     */
    public isGuildRequired(): boolean {
        return this.messageTrigger.isGuildRequired()
    }

    /**
     * This method will perform the check for the rate limit on the user sending the message. If it succeeds, 
     * the user is not rate limited, and it will return true. If not, it will return false to rate limit the 
     * user sending the message. It checks AFTER other checks are made for the command so it only rate limits 
     * users if they CAN use it.
     * @param msg The message causing the trigger.
     */
    public async triggered(msg: Message):Promise<boolean> {
        // Check if the trigger condition has been met FIRST, before checking the rate limit
        // that way, the rate limit is NOT hit by random messages
        let isTriggered = await this.messageTrigger.triggered(msg)
        if(isTriggered) {
            // if the trigger is valid, then check for the rate limit
            if(await this.rateLimiter.incrementAndCheckRateLimit(msg.author.id)) {
                // log the rate limit hit
                Logger.error(LogMessageTemplates.error.userMessageRateLimit
                    .replaceAll('{USER_TAG}', msg.author.tag)
                    .replaceAll('{USER_ID}', msg.author.id)
                    .replaceAll('{TRIGGER_NAME}', this.proxyName)
                )
                // if the user is rate limited, do NOT execute the trigger
                return false
            }
        }

        // Return whether it's triggered or not
        return isTriggered
    }
    
    /**
     * Execute the proxied message trigger's function.
     * @param msg The message casuing the trigger.
     * @param data The data related to the event, passed in from the EventDataService.
     */
    public async execute(client: Client, msg: Message, data: EventData): Promise<void> {
        return this.messageTrigger.execute(client, msg, data)
    }

}
