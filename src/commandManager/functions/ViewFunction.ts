import { CommandManagerFunction } from "../CommandManagerFunction";
import { Logger } from "../../services/logger"
import LogMessageTemplates from "../../../lang/logMessageTemplates.json"
import type { APIApplicationCommand, REST, RESTPostAPIApplicationCommandsJSONBody } from "discord.js";

/**
 * This function is used to view which commands are synced with the discord bot, which ones are currently just local, 
 * and which ones are currently just a part of the bot on discord.
 */
export class ViewFunction extends CommandManagerFunction {

    /** List of all of the local commands that already have been uploaded to the bot */
    private localCommandsOnRemote: RESTPostAPIApplicationCommandsJSONBody[]

    /** List of all the local commands that do NOT exist/have been uploaded to the bot */
    private localCommandsOnly: RESTPostAPIApplicationCommandsJSONBody[]

    /** List of all the commands that ONLY exist/have been uploaded to the bot */
    private remoteCommandsOnly: APIApplicationCommand[]
    
    /**
     * This creates the command object with everything it needs to run.
     * @param localCommandsOnRemote List of all of the local commands that already have been uploaded to the bot.
     * @param localCommandsOnly List of all the local commands that do NOT exist/have been uploaded to the bot.
     * @param remoteCommandsOnly List of all the commands that ONLY exist/have been uploaded to the bot.
     */
    constructor(localCommandsOnRemote: RESTPostAPIApplicationCommandsJSONBody[],
        localCommandsOnly: RESTPostAPIApplicationCommandsJSONBody[],
        remoteCommandsOnly: APIApplicationCommand[]
    ) {
        super();
        this.localCommandsOnRemote = localCommandsOnRemote;
        this.localCommandsOnly = localCommandsOnly;
        this.remoteCommandsOnly = remoteCommandsOnly
    }

    /**
     * Displays a list of commands currently used by the bot globally,
     * @param rest The REST object being used to communicate with discord for command interactions.
     * @param botClientId The bot's client id that's needed to interact with discord for command interactions.
     */
    public async executeGlobal(rest: REST, botClientId: string): Promise<void> {
        Logger.info(
            LogMessageTemplates.info.commandActionView
                .replaceAll(
                    '{LOCAL_AND_REMOTE_LIST}',
                    super.formatCommandList(this.localCommandsOnRemote)
                )
                .replaceAll('{LOCAL_ONLY_LIST}', super.formatCommandList(this.localCommandsOnly))
                .replaceAll('{REMOTE_ONLY_LIST}', super.formatCommandList(this.remoteCommandsOnly))
        );
    }

    /**
     * Displays a list of commands currently used by the bot globally,
     * @param rest The REST object being used to communicate with discord for command interactions.
     * @param botClientId The bot's client id that's needed to interact with discord for command interactions.
     * @param commandGuildId The id of the guild in which the commands being accessed/modified.
     */
    public async executeCommandGuild(rest: REST, botClientId: string, commandGuildId: string): Promise<void> {
        Logger.info(LogMessageTemplates.info.commandGuildActionView
            .replaceAll('{GUILD_ID}', commandGuildId)
            .replaceAll('{LOCAL_AND_REMOTE_LIST}', super.formatCommandList(this.localCommandsOnRemote))
            .replaceAll('{LOCAL_ONLY_LIST}', super.formatCommandList(this.localCommandsOnly))
            .replaceAll('{REMOTE_ONLY_LIST}', super.formatCommandList(this.remoteCommandsOnly))
        );
    }
}
