import { RateLimiter } from 'discord.js-rate-limiter'

/**
 * This class is used to 
 */
export class RateLimitedHandler {

    /** The rate limiter used for whatever event handler is making use of it. */
    private rateLimiter: RateLimiter

    /**
     * Constructs the rate limiter handler
     * @param rateLimitAmount The amount of requests that can be made within an interval before limiting the rate.
     * @param rateLimitInterval The time that a the amount of requests can be made in before triggering a rate limit,
     */
    constructor(rateLimitAmount: number, rateLimitInterval: number) {
        this.rateLimiter = new RateLimiter(
            rateLimitAmount, // Config.rateLimiting.triggers.amount,
            rateLimitInterval, //Config.rateLimiting.triggers.interval * 1000
        )
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

}
