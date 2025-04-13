import { Logger } from "./services/logger"
import LogMessageTemplates from "../lang/logMessageTemplates.json"
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
