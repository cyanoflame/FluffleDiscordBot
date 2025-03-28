import type { CommandManagerFunction } from "../CommandManagerFunction";
import { Logger } from "../../services/logger"
import LogMessageTemplates from "../../../lang/logMessageTemplates.json"
import { Routes, type REST, type RESTGetAPIApplicationCommandsResult } from "discord.js";

/**
 * This function deletes a specific command previously uploaded to the bot.
 */
export class DeleteFunction implements CommandManagerFunction {

    /** The commands that have previously been uploaded to the bot */
    private remoteCommands: RESTGetAPIApplicationCommandsResult

    /** The name of the function being deleted */
    private commandName: string

    /**
     * This creates the command object with everything it needs to run.
     * @param remoteCommands The commands that have previously been uploaded to the bot.
     * @param commandName The name of the command being deleted.
     */
    constructor(remoteCommands: RESTGetAPIApplicationCommandsResult, commandName: string) {
        this.remoteCommands = remoteCommands;
        this.commandName = commandName;
    }

    /**
     * This is what runs when the command is executed.
     * @param rest The REST object being used to communicate with discord for command interactions.
     * @param botClientId The bot's client id that's needed to interact with discord for command interactions.
     */
    public async execute(rest: REST, botClientId: string): Promise<void> {
        // Check to make sure the command being deleted actually existrs forst
        let remoteCommand = this.remoteCommands.find(remoteCommand => remoteCommand.name == this.commandName);
        if (!remoteCommand) {
            Logger.error(
                LogMessageTemplates.error.commandActionNotFound.replaceAll('{COMMAND_NAME}', this.commandName)
            );
            return;
        }

        Logger.info(
            LogMessageTemplates.info.commandActionDeleting.replaceAll('{COMMAND_NAME}', remoteCommand.name)
        );

        // Delete the command on discord
        await rest.delete(Routes.applicationCommand(process.env.BOT_ID!, remoteCommand.id));
        Logger.info(LogMessageTemplates.info.commandActionDeleted);
    }
}
