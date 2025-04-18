import { CommandManagerFunction } from "../CommandManagerFunction";
import { Logger } from "../../services/logger"
import LogMessageTemplates from "../../../lang/logMessageTemplates.json"
import { Routes, type REST, type RESTGetAPIApplicationCommandsResult } from "discord.js";

/**
 * This function deletes a specific command previously uploaded to the bot.
 */
export class DeleteFunction extends CommandManagerFunction {

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
        super();
        this.remoteCommands = remoteCommands;
        this.commandName = commandName;
    }

    /**
     * Deletes a command used by the bot globally.
     * @param rest The REST object being used to communicate with discord for command interactions.
     * @param botClientId The bot's client id that's needed to interact with discord for command interactions.
     */
    public async executeGlobal(rest: REST, botClientId: string): Promise<void> {
        // Check to make sure the command being deleted actually existrs forst
        let remoteCommand = this.remoteCommands.find(remoteCommand => remoteCommand.name == this.commandName);
        if (!remoteCommand) {
            Logger.error(LogMessageTemplates.error.commandActionNotFound
                .replaceAll('{COMMAND_NAME}', this.commandName)
            );
            return;
        }

        Logger.info(
            LogMessageTemplates.info.commandActionDeleting.replaceAll('{COMMAND_NAME}', remoteCommand.name)
        );

        // Delete the command on discord
        await rest.delete(Routes.applicationCommand(botClientId, remoteCommand.id));
        Logger.info(LogMessageTemplates.info.commandActionDeleted);
    }

    /**
     * Deletes a command used by the bot in a specific guild.
     * @param rest The REST object being used to communicate with discord for command interactions.
     * @param botClientId The bot's client id that's needed to interact with discord for command interactions.
     * @param commandGuildId The id of the guild in which the commands being accessed/modified.
     */
    public async executeCommandGuild(rest: REST, botClientId: string, commandGuildId: string): Promise<void> {
        // Check to make sure the command being deleted actually existrs forst
        let remoteCommand = this.remoteCommands.find(remoteCommand => remoteCommand.name == this.commandName);
        if (!remoteCommand) {
            Logger.error(LogMessageTemplates.error.commandGuildActionNotFound
                .replaceAll('{COMMAND_NAME}', this.commandName)
                .replaceAll('{GUILD_ID}', commandGuildId)
            );
            return;
        }

        Logger.info(
            LogMessageTemplates.info.commandGuildActionDeleting
            .replaceAll('{COMMAND_NAME}', remoteCommand.name)
            .replaceAll('{GUILD_ID}', commandGuildId)
        );

        // Delete the command on discord
        await rest.delete(Routes.applicationGuildCommand(botClientId, commandGuildId, remoteCommand.id));
        Logger.info(LogMessageTemplates.info.commandGuildActionDeleted
            .replaceAll('{GUILD_ID}', commandGuildId)
        );
    }
}
