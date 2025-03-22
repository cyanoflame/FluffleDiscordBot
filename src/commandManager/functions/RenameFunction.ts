import type { CommandManagerFunction } from "../CommandManagerFunction";
import { Logger } from "../../services/logger"
import LogMessageTemplates from "../../../lang/logMessageTemplates.json"
import { REST, Routes, type RESTGetAPIApplicationCommandsResult, type RESTPatchAPIApplicationCommandJSONBody } from "discord.js";

/**
 * This function is used to rename a function previously uploaded to discord for the bot.
 */
export class RenameFunction implements CommandManagerFunction {

    /** The name of the function being renamed */
    private oldName: string;

    /** The new name for the function */
    private newName: string;

    /** The commands that have previously been uploaded to the bot */
    private remoteCommands: RESTGetAPIApplicationCommandsResult

    /**
     * This creates the command object with everything it needs to run.
     * @param oldName The name of the function being renamed.
     * @param newName The new name for the function.
     */
    constructor(remoteCommands: RESTGetAPIApplicationCommandsResult, oldName: string, newName: string) {
        this.oldName = oldName;
        this.newName = newName;
        this.remoteCommands = remoteCommands;
    }

    /**
     * This is what runs when the command is executed.
     * @param rest The REST object being used to communicate with discord for command interactions.
     * @param botClientId The bot's client id that's needed to interact with discord for command interactions.
     * @param remoteCommands The commands that have previously been uploaded to the bot.
     */
    public async execute(rest: REST, botClientId: string): Promise<void> {
        // Check to make sure the command being renamed exists
        let remoteCommand = this.remoteCommands.find(remoteCommand => remoteCommand.name == this.oldName);
        if (!remoteCommand) {
            Logger.error(
                LogMessageTemplates.error.commandActionNotFound.replaceAll('{COMMAND_NAME}', this.oldName)
            );
            return;
        }

        Logger.info(
            LogMessageTemplates.info.commandActionRenaming
                .replaceAll('{OLD_COMMAND_NAME}', remoteCommand.name)
                .replaceAll('{NEW_COMMAND_NAME}', this.newName)
        );

        // Update the command name on discord
        let body: RESTPatchAPIApplicationCommandJSONBody = {
            name: this.newName,
        };
        await rest.patch(Routes.applicationCommand(botClientId, remoteCommand.id), {
            body,
        });
        
        Logger.info(LogMessageTemplates.info.commandActionRenamed);
    }
}
