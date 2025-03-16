import { Client, Options, Partials } from "discord.js"
import type { GatewayIntentsString } from "discord.js"

// import the configuration file
import config from '../config/config.json'
import { DiscordBot } from "./models/DiscordBot"
import { EventDataService } from "./services/eventDataService"

console.log("Hello via Bun!")

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
        process.env.BOT_TOKEN ?? "",
        // guildJoinHandler,
        // guildLeaveHandler,
        // commandHandler,
        // buttonHandler,
        // reactionHandler,
        // new JobService(jobs)

        eventDataService // TEMPORARY
    )
    
    // Create any services used by the events/handlers

    // Add any message triggers to the bot
    bot.addMsgTrigger()

}
