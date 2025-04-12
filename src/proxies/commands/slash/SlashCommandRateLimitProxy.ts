import type { RateLimiterAbstract } from "rate-limiter-flexible";
import { CommandRateLimitProxy } from "../CommandRateLimitProxy";
import type { SlashCommand } from "../../../commands/slash/SlashCommand";

/**
 * This proxy class is used to proxy to a SlashCommand to apply a rate limit to it.
 */
export class SlashCommandRateLimitProxy extends CommandRateLimitProxy {
    /**
     * Constructs a rate limit proxy for a Slash Command.
     * @param rateLimiter Either a reference to a rate limiter to use, or an object with the details make a new rate limiter, such that:
     * rateLimitAmount - The amount of requests that can be made within an interval before limiting the rate ; and rateLimitInterval - The 
     * time that a the amount of requests can be made in before triggering a rate limit,
     * @param proxyName The name of the the proxy, used to identify it in logging.
     * @param slashCommand The slash command object that is being rate limited.
     */
    constructor(rateLimiter: {rateLimitAmount: number, rateLimitInterval: number} | RateLimiterAbstract, proxyName: string, command: SlashCommand) {
        super(rateLimiter, proxyName, command);
    }
};
