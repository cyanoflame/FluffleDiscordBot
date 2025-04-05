import { Client, Options, Partials } from "discord.js"
import type { GatewayIntentsString } from "discord.js"

// import the configuration file
import config from '../config/config.json'
import { DiscordBot } from "./models/DiscordBot"
import { EventDataService } from "./services/eventDataService"
import { OnImageMessageTrigger } from "./messageTriggers/OnImageMessageTrigger"
import { MessageTriggerRateLimitProxy } from "./proxies/MessageTriggerRateLimitProxy"
import { Logger } from "./services/logger"
import LogMessageTemplates from "../lang/logMessageTemplates.json"

console.log("Starting Bot Instance")

/**
 * This is the main file that runs the a bot.
 */
async function start(): Promise<void> {
    // TEMPORARY
    let eventDataService = new EventDataService();

    // Event handlers -- there are listeners made for these in the bot
    // let guildJoinHandler = new GuildJoinHandler(eventDataService)
    // let guildLeaveHandler = new GuildLeaveHandler()
    // let commandHandler = new CommandHandler(commands, eventDataService)
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
    )) // With RateLimit Proxy

    // Start the bot
    await bot.start()
}

process.on('unhandledRejection', (reason, _promise) => {
    Logger.error(LogMessageTemplates.error.unhandledRejection, reason);
});


start().catch(error => {
    Logger.error(LogMessageTemplates.error.unspecified, error);
})
