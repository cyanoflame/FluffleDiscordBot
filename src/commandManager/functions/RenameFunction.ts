import { CommandManagerFunction } from "../CommandManagerFunction";
import { Logger } from "../../services/logger"
import LogMessageTemplates from "../../../lang/logMessageTemplates.json"
import { REST, Routes, type RESTGetAPIApplicationCommandsResult, type RESTPatchAPIApplicationCommandJSONBody } from "discord.js";

/**
 * This function is used to rename a function previously uploaded to discord for the bot.
 */
export class RenameFunction extends CommandManagerFunction {

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
        super();
        this.oldName = oldName;
        this.newName = newName;
        this.remoteCommands = remoteCommands;
    }

    /**
     * Renames a command used by the bot globally.
     * @param rest The REST object being used to communicate with discord for command interactions.
     * @param botClientId The bot's client id that's needed to interact with discord for command interactions.
     */
    public async executeGlobal(rest: REST, botClientId: string): Promise<void> {
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

    /**
     * Renames a command used by the bot globally for a specific guild.
     * @param rest The REST object being used to communicate with discord for command interactions.
     * @param botClientId The bot's client id that's needed to interact with discord for command interactions.
     * @param commandGuildId The id of the guild in which the commands being accessed/modified.
     */
    public async executeCommandGuild(rest: REST, botClientId: string, commandGuildId: string): Promise<void> {
        // Check to make sure the command being renamed exists
        let remoteCommand = this.remoteCommands.find(remoteCommand => remoteCommand.name == this.oldName);
        if (!remoteCommand) {
            Logger.error(LogMessageTemplates.error.commandGuildActionNotFound
                .replaceAll('{COMMAND_NAME}', this.oldName)
                .replaceAll('{GUILD_ID}', commandGuildId)
            );
            return;
        }

        Logger.info(
            LogMessageTemplates.info.commandGuildActionRenaming
                .replaceAll('{OLD_COMMAND_NAME}', remoteCommand.name)
                .replaceAll('{NEW_COMMAND_NAME}', this.newName)
                .replaceAll('{GUILD_ID}', commandGuildId)
        );

        // Update the command name on discord
        let body: RESTPatchAPIApplicationCommandJSONBody = {
            name: this.newName,
        };
        await rest.patch(Routes.applicationGuildCommand(botClientId, commandGuildId, remoteCommand.id), {
            body,
        });
        
        Logger.info(LogMessageTemplates.info.commandGuildActionRenamed
            .replaceAll('{GUILD_ID}', commandGuildId)
        );
    }
}
