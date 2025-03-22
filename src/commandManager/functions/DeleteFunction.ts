import type { CommandManagerFunction } from "../CommandManagerFunction";
import { Logger } from "../../services/logger"
import LogMessageTemplates from "../../../lang/logMessageTemplates.json"
import { Routes, type REST, type RESTGetAPIApplicationCommandsResult } from "discord.js";

/**
 * This command deletes a specific command previously uploaded to the bot.
 */
export class DeleteFunction implements CommandManagerFunction {

    private remoteCommands: RESTGetAPIApplicationCommandsResult

    private newName: string

    /**
     * This creates the command object with everything it needs to run.
     * @param remoteCommands The commands that have previously been uploaded to the bot.
     * @param newName The new
     */
    constructor(remoteCommands: RESTGetAPIApplicationCommandsResult, newName: string) {
        this.remoteCommands = remoteCommands;
        this.newName = newName;
    }

    /**
     * This is what runs when the command is executed.
     * @param rest The REST object being used to communicate with discord for command interactions.
     * @param botClientId The bot's client id that's needed to interact with discord for command interactions.
     */
    public async execute(rest: REST, botClientId: string): Promise<void> {
        let name = this.newName;
        if (!name) {
            Logger.error(LogMessageTemplates.error.commandActionDeleteMissingArg);
            return;
        }

        let remoteCmd = remoteCmds.find(remoteCmd => remoteCmd.name == name);
        if (!remoteCmd) {
            Logger.error(
                LogMessageTemplates.error.commandActionNotFound.replaceAll('{COMMAND_NAME}', name)
            );
            return;
        }

        Logger.info(
            LogMessageTemplates.info.commandActionDeleting.replaceAll('{COMMAND_NAME}', remoteCmd.name)
        );
        await rest.delete(Routes.applicationCommand(process.env.BOT_ID!, remoteCmd.id));
        Logger.info(LogMessageTemplates.info.commandActionDeleted);
    }
}
