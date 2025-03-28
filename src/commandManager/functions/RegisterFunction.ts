import type { CommandManagerFunction } from "../CommandManagerFunction";
import { Logger } from "../../services/logger"
import LogMessageTemplates from "../../../lang/logMessageTemplates.json"
import { FormatCommandList } from "../CommandManagerFunctionWiithOutput";
import { REST, Routes, type RESTPostAPIChatInputApplicationCommandsJSONBody, type RESTPostAPIContextMenuApplicationCommandsJSONBody } from "discord.js";

/**
 * This function is used to register new functions/upload them to discord for the bot.
 */
export class RegisterFunction extends FormatCommandList implements CommandManagerFunction {

    /** List of all of the local commands that already have been uploaded to the bot */
    private localCommandsOnRemote: (RESTPostAPIChatInputApplicationCommandsJSONBody | RESTPostAPIContextMenuApplicationCommandsJSONBody)[]

    /** List of all the local commands that do NOT exist/have been uploaded to the bot */
    private localCommandsOnly: (RESTPostAPIChatInputApplicationCommandsJSONBody | RESTPostAPIContextMenuApplicationCommandsJSONBody)[]
    
    /**
     * This creates the command object with everything it needs to run.
     * @param localCommandsOnRemote List of all of the local commands that already have been uploaded to the bot.
     * @param localCommandsOnly List of all the local commands that do NOT exist/have been uploaded to the bot.
     */
    constructor(localCommandsOnRemote: (RESTPostAPIChatInputApplicationCommandsJSONBody | RESTPostAPIContextMenuApplicationCommandsJSONBody)[],
        localCommandsOnly: (RESTPostAPIChatInputApplicationCommandsJSONBody | RESTPostAPIContextMenuApplicationCommandsJSONBody)[]
    ) {
        super();
        this.localCommandsOnRemote = localCommandsOnRemote;
        this.localCommandsOnly = localCommandsOnly;
    }

    /**
     * This is what runs when the command is executed.
     * @param rest The REST object being used to communicate with discord for command interactions.
     * @param botClientId The bot's client id that's needed to interact with discord for command interactions.
     */
    public async execute(rest: REST, botClientId: string): Promise<void> {
        // Check if there are any new commands that need to be uploaded to discord
        if (this.localCommandsOnly.length > 0) {
            Logger.info(
                LogMessageTemplates.info.commandActionCreating.replaceAll(
                    '{COMMAND_LIST}',
                    super.formatCommandList(this.localCommandsOnly)
                )
            );
            // Upload the new commands to discord
            for (let localCmd of this.localCommandsOnly) {
                await rest.post(Routes.applicationCommands(process.env.BOT_ID!), {
                    body: localCmd,
                });
            }
            Logger.info(LogMessageTemplates.info.commandActionCreated);
        }

        // Check if there are any commands that need to be updated on discord for the bot
        if (this.localCommandsOnRemote.length > 0) {
            Logger.info(
                LogMessageTemplates.info.commandActionUpdating.replaceAll(
                    '{COMMAND_LIST}',
                    super.formatCommandList(this.localCommandsOnRemote)
                )
            );

            // Update all of the commands already uplaoded to discord
            for (let localCmd of this.localCommandsOnRemote) {
                await rest.post(Routes.applicationCommands(process.env.BOT_ID!), {
                    body: localCmd,
                });
            }
            Logger.info(LogMessageTemplates.info.commandActionUpdated);
        }
    }
}
