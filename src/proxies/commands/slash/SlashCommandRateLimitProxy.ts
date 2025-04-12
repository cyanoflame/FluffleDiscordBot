import type { RateLimiterAbstract } from "rate-limiter-flexible";
import { SlashCommand } from "../../../commands/slash/SlashCommand";
import { RateLimitProxy } from "../../RateLimitProxy";

/**
 * This proxy class is used to proxy to a SlashCommand to apply a rate limit to it.
 * The Bridge design pattern has been used to ensure everything is setup well.
 */
export class SlashCommandRateLimitProxy extends SlashCommand, RateLimitProxy {

    protected rateLimiter: RateLimitProxy;

    /**
     * Constructs a rate limit proxy for a Slash Command.
     * @param rateLimiter Either a reference to a rate limiter to use, or an object with the details make a new rate limiter, such that:
     * rateLimitAmount - The amount of requests that can be made within an interval before limiting the rate ; and rateLimitInterval - The 
     * time that a the amount of requests can be made in before triggering a rate limit,
     * @param proxyName The name of the the proxy, used to identify it in logging.
     * @param slashCommand The slash command object that is being rate limited.
     */
    constructor(rateLimiter: {rateLimitAmount: number, rateLimitInterval: number} | RateLimiterAbstract, slashCommand: SlashCommand) {
        // Create the rate limiter
        super();

        // Create the rate limiter for the slash command
        this.slashCommand = slashCommand;
    }
};
