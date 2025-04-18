import { CommandManagerFunction } from "../CommandManagerFunction";
import { Logger } from "../../services/logger"
import LogMessageTemplates from "../../../lang/logMessageTemplates.json"
import { REST, Routes, type RESTGetAPIApplicationCommandsResult } from "discord.js";

/**
 * This function clears all of the commands uploaded to the bot.
 */
export class ClearFunction extends CommandManagerFunction  {

    private remoteCommands: RESTGetAPIApplicationCommandsResult;

    /**
     * This creates the command object with everything it needs to run.
     * @param remoteCommands The commands that have previously been uploaded to the bot.
     */
    constructor(remoteCommands: RESTGetAPIApplicationCommandsResult) {
        super();
        this.remoteCommands = remoteCommands;
    }

    /**
     * Clears all of the commands used globally by the bot.
     * @param rest The REST object being used to communicate with discord for command interactions.
     * @param botClientId The bot's client id that's needed to interact with discord for command interactions.
     */
    public async executeGlobal(rest: REST, botClientId: string): Promise<void> {
        Logger.info(
            LogMessageTemplates.info.commandActionClearing
            .replaceAll(
                '{COMMAND_LIST}',
                super.formatCommandList(this.remoteCommands)
            )
        );
        await rest.put(Routes.applicationCommands(botClientId), { body: [] });
        Logger.info(LogMessageTemplates.info.commandActionCleared);
    }

    /**
     * Clears all of the commands used by the bot in a specific guild.
     * @param rest The REST object being used to communicate with discord for command interactions.
     * @param botClientId The bot's client id that's needed to interact with discord for command interactions.
     * @param commandGuildId The id of the guild in which the commands being accessed/modified.
     */
    public async executeCommandGuild(rest: REST, botClientId: string, commandGuildId: string): Promise<void> {
        Logger.info(
            LogMessageTemplates.info.commandGuildActionClearing
            .replaceAll('{COMMAND_LIST}', super.formatCommandList(this.remoteCommands))
            .replaceAll('{GUILD_ID}', commandGuildId)
        );
        await rest.put(Routes.applicationGuildCommands(botClientId, commandGuildId), { body: [] });
        Logger.info(LogMessageTemplates.info.commandGuildActionCleared
            .replaceAll('{GUILD_ID}', commandGuildId)
        );
    }
}
