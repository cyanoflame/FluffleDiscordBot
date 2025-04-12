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
import { CommandRateLimitProxy } from "./proxies/commands/CommandRateLimitProxy"
import { CommandPermissionProxy } from "./proxies/commands/CommandPermissionProxy"
import { DevCommand } from "./commands/slash/DevCommand/DevCommand"
import { defineBot } from "./define-bot"

console.log("Starting Bot Instance")

/**
 * This is the main file that actuallt starts a bot instance.
 */
async function start(): Promise<void> {
    // Create the bot
    let bot = await defineBot();

    // Start the bot
    await bot.start()
}

// Handles any unhandled rejections from running the bot - recording them to the log
process.on('unhandledRejection', (reason, _promise) => {
    Logger.error(LogMessageTemplates.error.unhandledRejection, reason);
});

// Starts the bot program
start().catch(error => {
    Logger.error(LogMessageTemplates.error.unspecified, error);
})
