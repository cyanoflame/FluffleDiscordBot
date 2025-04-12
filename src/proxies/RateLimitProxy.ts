import { RateLimiterAbstract, RateLimiterMemory } from 'rate-limiter-flexible'

/**
 * This class is a abstract class providing rate limiting methods/implementation for any proxies 
 * that want to make use of a rate limiter.
 */
export abstract class RateLimitProxy {

    /** The rate limiter used for whatever event handler is making use of it */
    private rateLimiter: RateLimiterAbstract;

    /**
     * Constructs the proxy.
     * @param rateLimiter Either a reference to a rate limiter to use, or an object with the details make a new rate limiter, such that:
     * rateLimitAmount - The amount of requests that can be made within an interval before limiting the rate ;
     * rateLimitInterval - The time (in seconds) that a the amount of requests can be made in before triggering a rate limit.
     * @param proxyName The name of the the proxy, used to identify it in logging.
     */
    constructor(rateLimiter: {rateLimitAmount: number, rateLimitInterval: number} | RateLimiterAbstract) {
        // if the ratelimiter is predefined, then set that. Otherwise, make a new one
        if(rateLimiter instanceof RateLimiterAbstract) {
            // set the rate limiter reference
            this.rateLimiter = rateLimiter
        } else {
            // Create the rate limiter object in memory
            this.rateLimiter = new RateLimiterMemory({
                points: rateLimiter.rateLimitAmount, 
                duration: rateLimiter.rateLimitInterval
            })
        }
    }

    // /**
    //  * Checks whether or not the user is rate limited. Haven't tested/used it yet though.
    //  * @param userId The user id being checked for being rate limited.
    //  * @returns whether or not the user is currently rate limited.
    //  */
    // public async isRateLimited(userId: string): Promise<boolean> {
    //     return this.rateLimiter.get(userId).then(rateLimitRes => {
    //         // User token is not in the list -- is not rate limtied
    //         if(rateLimitRes == null) {
    //             return false;
    //         }
    //         return rateLimitRes.remainingPoints == 0 && rateLimitRes.msBeforeNext != 0
    //     })
    // }

    /**
     * Increments the rate limit count for the user and returns whether or not a user is rate limited.
     * @param userId The user id being checked for being rate limited.
     * @returns whether or not the user is currently rate limited.
     */
    public async incrementAndCheckRateLimit(userId: string): Promise<boolean> {
        let result = this.rateLimiter.consume(userId)
        // is not rate limited
        .then((rateLimiterRes) => {return false})
        // is rate limited
        .catch((rateLimiterRes) => {return true});
        return result
    }

    /**
     * Used to change the amount of requests that can be made before limiting the rate.
     * @param amount The amount of requests that can be made within an interval before limiting the rate.
     */
    public setRateLimitAmount(amount: number): void {
        this.rateLimiter.points = amount
    }

    /**
     * Used to change the amount of time for timeouts
     * @param interval The time that a the amount of requests can be made in before triggering a rate limit,
     */
    public setRateLimitInterval(interval: number): void {
        this.rateLimiter.duration = interval;
    }

}
