import { Options, Partials } from "discord.js"
import type { GatewayIntentsString } from "discord.js"

// import the configuration file
import config from '../config/config.json'
import { DiscordBot } from "./models/DiscordBot"
import { EventDataService } from "./services/eventDataService"
import { OnImageMessageTrigger } from "./messageTriggers/OnImageMessageTrigger"
import { MessageTriggerRateLimitProxy } from "./proxies/messageTriggers/MessageTriggerRateLimitProxy"
import { DevCommand } from "./commands/slash/DevCommand/DevCommand"
import { SlashCommandRateLimitProxy } from "./proxies/commands/slash/SlashCommandRateLimitProxy"

/**
 * This is the function used to define/create the discord bot used by the program.
 * Everything the bot uses- commands, interanctions, etc- should be setup here.
 */
export async function defineBot(): Promise<DiscordBot> {
    // TEMPORARY
    let eventDataService = new EventDataService();

    // Event handlers -- there are listeners made for these in the bot
    // let guildJoinHandler = new GuildJoinHandler(eventDataService)
    // let guildLeaveHandler = new GuildLeaveHandler()
    // let buttonHandler = new ButtonHandler(buttons, eventDataService)
    // let reactionHandler = new ReactionHandler(reactions, eventDataService)

    // console.log("TEST:", (config.client.partials as string[]).map(partial => Partials[partial as keyof typeof Partials]), (config.client.partials as string[]).map(partial => Partials[partial]))
    
    // Create the discord bot
    let bot = new DiscordBot(
        {
            intents: config.client.intents as GatewayIntentsString[],
            partials: (config.client.partials as string[]).map(partial => Partials[partial as keyof typeof Partials]),
            makeCache: Options.cacheWithLimits({
                // Use default caching behavior
                ...Options.DefaultMakeCacheSettings,
                // Add caching options from config file
                ...config.client.caches
            }),
            // Used to remove old items from a cache
            sweepers: undefined
        },
        process.env.BOT_TOKEN!,
        // guildJoinHandler,
        // guildLeaveHandler,
        // commandHandler,
        // buttonHandler,
        // reactionHandler,
        // new JobService(jobs)

        eventDataService // TEMPORARY
    )
    
    // Create any services used by the events/handlers

    // Add any message triggers / MessageTriggers to the bot
    // bot.addMessageTrigger(new OnImageMessageTrigger(bot.getClient())) // No RateLimit proxy
    bot.addMessageTrigger(new MessageTriggerRateLimitProxy(
        {
            rateLimitAmount: config.rateLimiting.triggers.amount, 
            rateLimitInterval: config.rateLimiting.triggers.interval * 1000
        }, 
        "OnImageMessageTrigger", 
        new OnImageMessageTrigger()
    )); // With RateLimit Proxy

    // Create any commands used by the bot
    bot.addCommand(
        // PROBLEM: Since this is proxied, casting this to a SlashCommand doesn't work
        // new CommandRateLimitProxy(
        //     {
        //         rateLimitAmount: 3,
        //         rateLimitInterval: 5
        //     },
        //     "DevCommandRateLimit",
        //     new CommandPermissionProxy(
        //         [],
        //         new DevCommand([
        //             process.env.DEV_USER_ID ?? "undefined"
        //         ])
        //     )
        // )

        new SlashCommandRateLimitProxy(
            {
                rateLimitAmount: 3,
                rateLimitInterval: 5
            },
        //     new SlashCommandPermissionProxy(
                // [],
                new DevCommand([
                    process.env.DEV_USER_ID ?? "undefined"
                ])
            // )
        )
    );

    return bot;
}
