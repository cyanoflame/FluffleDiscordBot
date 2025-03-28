import type { CommandManagerFunction } from "../CommandManagerFunction";
import { Logger } from "../../services/logger"
import LogMessageTemplates from "../../../lang/logMessageTemplates.json"
import { FormatCommandList } from "../CommandManagerFunctionWiithOutput";
import { REST, Routes, type RESTGetAPIApplicationCommandsResult } from "discord.js";

/**
 * This function clears all of the commands uploaded to the bot.
 */
export class ClearFunction extends FormatCommandList implements CommandManagerFunction {

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
     * This is what runs when the command is executed.
     * @param rest The REST object being used to communicate with discord for command interactions.
     * @param botClientId The bot's client id that's needed to interact with discord for command interactions.
     */
    public async execute(rest: REST, botClientId: string): Promise<void> {
        Logger.info(
            LogMessageTemplates.info.commandActionClearing.replaceAll(
                '{COMMAND_LIST}',
                super.formatCommandList(this.remoteCommands)
            )
        );
        await rest.put(Routes.applicationCommands(botClientId), { body: [] });
        Logger.info(LogMessageTemplates.info.commandActionCleared);
    }
}
