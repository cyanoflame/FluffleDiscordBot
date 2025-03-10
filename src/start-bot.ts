import { Client, Options, Partials } from "discord.js"
import type { GatewayIntentsString } from "discord.js"

// import the configuration file
import config from '../config/config.json'

console.log("Hello via Bun!")

/**
 * This is the main file that runs the a bot.
 */
async function start(): Promise<void> {
    // Client
    let client = new Client({
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
    })

    // Event handlers -- there are listeners made for these in the bot
    let guildJoinHandler = new GuildJoinHandler(eventDataService)
    let guildLeaveHandler = new GuildLeaveHandler()
    let commandHandler = new CommandHandler(commands, eventDataService)
    let buttonHandler = new ButtonHandler(buttons, eventDataService)
    let triggerHandler = new TriggerHandler(triggers, eventDataService)
    let messageHandler = new MessageHandler(triggerHandler)
    let reactionHandler = new ReactionHandler(reactions, eventDataService)

    // Bot
    let bot = new Bot(
        process.env.BOT_TOKEN,
        client,
        guildJoinHandler,
        guildLeaveHandler,
        messageHandler,
        commandHandler,
        buttonHandler,
        reactionHandler,
        // new JobService(jobs)
    )

}
