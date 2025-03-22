import type { CommandManagerFunction } from "../CommandManagerFunction";
import { Logger } from "../../services/logger"
import LogMessageTemplates from "../../../lang/logMessageTemplates.json"
import { FormatCommandList } from "../CommandManagerFunctionWiithOutput";
import { REST, Routes, type RESTPostAPIChatInputApplicationCommandsJSONBody, type RESTPostAPIContextMenuApplicationCommandsJSONBody } from "discord.js";

export class RegisterFunction extends FormatCommandList implements CommandManagerFunction {

    private localCommandsOnly: (RESTPostAPIChatInputApplicationCommandsJSONBody | RESTPostAPIContextMenuApplicationCommandsJSONBody)[]
    
    constructor(localCommandsOnly: (RESTPostAPIChatInputApplicationCommandsJSONBody | RESTPostAPIContextMenuApplicationCommandsJSONBody)[]) {
        super();
        this.localCommandsOnly = localCommandsOnly;
    }

    /**
     * This is what runs when the command is executed.
     * @param rest The REST object being used to communicate with discord for command interactions.
     * @param botClientId The bot's client id that's needed to interact with discord for command interactions.
     */
    public async execute(rest: REST, botClientId: string): Promise<void> {
        if (this.localCommandsOnly.length > 0) {
            Logger.info(
                LogMessageTemplates.info.commandActionCreating.replaceAll(
                    '{COMMAND_LIST}',
                    super.formatCommandList(this.localCommandsOnly)
                )
            );
            for (let localCmd of this.localCommandsOnly) {
                await rest.post(Routes.applicationCommands(process.env.BOT_ID!), {
                    body: localCmd,
                });
            }
            Logger.info(LogMessageTemplates.info.commandActionCreated);
        }

        if (localCmdsOnRemote.length > 0) {
            Logger.info(
                LogMessageTemplates.info.commandActionUpdating.replaceAll(
                    '{COMMAND_LIST}',
                    super.formatCommandList(localCmdsOnRemote)
                )
            );
            for (let localCmd of localCmdsOnRemote) {
                await rest.post(Routes.applicationCommands(process.env.BOT_ID!), {
                    body: localCmd,
                });
            }
            Logger.info(LogMessageTemplates.info.commandActionUpdated);
        }
    }
}
