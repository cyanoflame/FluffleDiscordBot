import { RateLimiter } from 'discord.js-rate-limiter'
import type { MsgTrigger } from '../msgTriggers/MsgTrigger'
import type { Client, Message } from 'discord.js'
import type { EventData } from '../models/eventData'
import { Logger } from '../services/logger'

import LogMessageTemplates from "../../lang/logMessageTemplates.json"

/**
 * This class is used to add a rate limiter to a message trigger as a proxy. This keeps the implementation 
 * abstracted from the MsgTrigger object itself while also making it easy to apply.
 */
class MsgTriggerRateLimitProxy implements MsgTrigger {

    /** The rate limiter used for whatever event handler is making use of it */
    private rateLimiter: RateLimiter

    /** The reference to the proxied object */
    private msgTrigger: MsgTrigger

    /** Whether or not the proxied MsgTrigger requires a guild to use or not */
    public requireGuild: boolean

    /** The name of the proxy - used to identify it the proxy in logs */
    private proxyName: string

    /**
     * Constructs the proxy.
     * @param rateLimiter Either a reference to a rate limiter to use, or an object with the details make a new rate limiter, such that:
     * rateLimitAmount - The amount of requests that can be made within an interval before limiting the rate ; and rateLimitInterval - The 
     * time that a the amount of requests can be made in before triggering a rate limit,
     * @param proxyName The name of the the proxy, used to identify it in logging.
     * @param msgTrigger The msgTrigger object that is being proxied.
     */
    constructor(rateLimiter: {rateLimitAmount: number, rateLimitInterval: number} | RateLimiter, proxyName: string, msgTrigger: MsgTrigger) {
        // if the ratelimiter is predefined, then set that. Otherwise, make a new one
        if(rateLimiter instanceof RateLimiter) {
            // set the rate limiter reference
            this.rateLimiter = rateLimiter
        } else {
            // Create the rate limiter object
            this.rateLimiter = new RateLimiter(
                rateLimiter.rateLimitAmount, 
                rateLimiter.rateLimitInterval, 
            )
        }

        // Store the reference to the proxied object
        this.msgTrigger = msgTrigger

        // Store the reference to the proxied object's attributes
        this.requireGuild = this.msgTrigger.requireGuild
        // Store the name of the proxy - used for logging
        this.proxyName = proxyName
    }

    /**
     * Checks whether or not the user is rate limited.
     * @param userId The user id being checked for being rate limited.
     * @returns whether or not the user is currently rate limited.
     */
    public isRateLimited(userId: string): boolean {
        return this.rateLimiter.take(userId)
    }

    /**
     * Used to change the amount of requests that can be made before limiting the rate.
     * @param amount The amount of requests that can be made within an interval before limiting the rate.
     */
    public setRateLimitAmount(amount: number): void {
        this.rateLimiter.amount = amount
    }

    /**
     * Used to change the amount of time between requests made.
     * @param interval The time that a the amount of requests can be made in before triggering a rate limit,
     */
    public setRateLimitInterval(interval: number): void {
        this.rateLimiter.interval = interval
    }

    /**
     * This method will perform the check for the rate limit. If it succeeds, then it will
     * @param msg The message causing the trigger.
     */
    public triggered(msg: Message): boolean {
        // Check if the trigger condition has been met FIRST, before checking the rate limit
        // that way, the rate limit is NOT hit by random messages
        let isTriggered = this.msgTrigger.triggered(msg)
        if(isTriggered) {
            // if the trigger is valid, then check for the rate limit
            if(this.isRateLimited(msg.author.id)) {
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
     * Execuite the concrete object like normal. Nothing to do here since rate limiting involved the checks.
     * @param msg The message casuing the trigger.
     * @param data The data related to the event, passed in from the EventDataService.
     */
    public async execute(client: Client, msg: Message, data: EventData): Promise<void> {
        await this.msgTrigger.execute(client, msg, data)
    }

}

export {
    MsgTriggerRateLimitProxy
}
