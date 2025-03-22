import type { CommandManagerFunction } from "../CommandManagerFunction";
import { Logger } from "../../services/logger"
import LogMessageTemplates from "../../../lang/logMessageTemplates.json"
import { FormatCommandList } from "../CommandManagerFunctionWiithOutput";
import type { REST } from "discord.js";

export class RegisterFunction extends FormatCommandList implements CommandManagerFunction {

    /**
     * This is what runs when the command is executed.
     * @param rest The REST object being used to communicate with discord for command interactions.
     * @param botClientId The bot's client id that's needed to interact with discord for command interactions.
     */
    public async execute(rest: REST, botClientId: string): Promise<void> {
        Logger.info(
            LogMessageTemplates.info.commandActionView
                .replaceAll(
                    '{LOCAL_AND_REMOTE_LIST}',
                    super.formatCommandList(localCmdsOnRemote)
                )
                .replaceAll('{LOCAL_ONLY_LIST}', super.formatCommandList(localCmdsOnly))
                .replaceAll('{REMOTE_ONLY_LIST}', super.formatCommandList(remoteCmdsOnly))
        );
    }
}
