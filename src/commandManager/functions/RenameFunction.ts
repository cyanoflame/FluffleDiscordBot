import type { CommandManagerFunction } from "../CommandManagerFunction";
import { Logger } from "../../services/logger"
import LogMessageTemplates from "../../../lang/logMessageTemplates.json"
import { REST, Routes, type RESTPatchAPIApplicationCommandJSONBody } from "discord.js";

export class RegisterFunction implements CommandManagerFunction {

    /** The name of the function being renamed */
    private oldName: string;
    /** The new name for the function */
    private newName: string;

    /**
     * 
     * @param oldName 
     * @param newName 
     */
    constructor(oldName: string, newName: string) {
        this.oldName = oldName;
        this.newName = newName;
    }

    /**
     * This is what runs when the command is executed.
     * @param rest The REST object being used to communicate with discord for command interactions.
     * @param botClientId The bot's client id that's needed to interact with discord for command interactions.
     */
    public async execute(rest: REST, botClientId: string): Promise<void> {
        // if (!(oldName && newName)) {
        //     Logger.error(LogMessageTemplates.error.commandActionRenameMissingArg);
        //     return;
        // }

        let remoteCmd = remoteCmds.find(remoteCmd => remoteCmd.name == this.oldName);
        if (!remoteCmd) {
            Logger.error(
                LogMessageTemplates.error.commandActionNotFound.replaceAll('{COMMAND_NAME}', this.oldName)
            );
            return;
        }

        Logger.info(
            LogMessageTemplates.info.commandActionRenaming
                .replaceAll('{OLD_COMMAND_NAME}', remoteCmd.name)
                .replaceAll('{NEW_COMMAND_NAME}', this.newName)
        );
        let body: RESTPatchAPIApplicationCommandJSONBody = {
            name: this.newName,
        };
        await rest.patch(Routes.applicationCommand(botId, remoteCmd.id), {
            body,
        });
        Logger.info(LogMessageTemplates.info.commandActionRenamed);
    }
}
