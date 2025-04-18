import { CommandManagerFunction } from "../CommandManagerFunction";
import { Logger } from "../../services/logger"
import LogMessageTemplates from "../../../lang/logMessageTemplates.json"
import { REST, Routes, type RESTPostAPIApplicationCommandsJSONBody } from "discord.js";

/**
 * This function is used to register new functions/upload them to discord for the bot.
 */
export class RegisterFunction extends CommandManagerFunction {

    /** List of all of the local commands that already have been uploaded to the bot */
    private localCommandsOnRemote: RESTPostAPIApplicationCommandsJSONBody[]

    /** List of all the local commands that do NOT exist/have been uploaded to the bot */
    private localCommandsOnly: RESTPostAPIApplicationCommandsJSONBody[]
    
    /**
     * This creates the command object with everything it needs to run.
     * @param localCommandsOnRemote List of all of the local commands that already have been uploaded to the bot.
     * @param localCommandsOnly List of all the local commands that do NOT exist/have been uploaded to the bot.
     */
    constructor(localCommandsOnRemote: RESTPostAPIApplicationCommandsJSONBody[],
        localCommandsOnly: RESTPostAPIApplicationCommandsJSONBody[]
    ) {
        super();
        this.localCommandsOnRemote = localCommandsOnRemote;
        this.localCommandsOnly = localCommandsOnly;
    }

    /**
     * Registers/updates a set of commands used by the bot globally.
     * @param rest The REST object being used to communicate with discord for command interactions.
     * @param botClientId The bot's client id that's needed to interact with discord for command interactions.
     */
    public async executeGlobal(rest: REST, botClientId: string): Promise<void> {
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
                await rest.put(Routes.applicationCommands(botClientId), {
                    body: localCmd,
                });
            }
            Logger.info(LogMessageTemplates.info.commandActionUpdated);
        }
    }

    /**
     * Registers/updates a set of commands used by the bot for a specific guild.
     * @param rest The REST object being used to communicate with discord for command interactions.
     * @param botClientId The bot's client id that's needed to interact with discord for command interactions.
     * @param commandGuildId The id of the guild in which the commands being accessed/modified.
     */
    public async executeCommandGuild(rest: REST, botClientId: string, commandGuildId: string): Promise<void> {
        // Check if there are any new commands that need to be uploaded to discord
        if (this.localCommandsOnly.length > 0) {
            Logger.info(
                LogMessageTemplates.info.commandGuildActionCreating
                .replaceAll('{COMMAND_LIST}', super.formatCommandList(this.localCommandsOnly))
                .replaceAll('{GUILD_ID}', commandGuildId)
            );
            // Upload the new commands to discord
            for (let localCmd of this.localCommandsOnly) {
                await rest.post(Routes.applicationGuildCommands(botClientId, commandGuildId), {
                    body: localCmd,
                });
            }
            Logger.info(LogMessageTemplates.info.commandGuildActionCreated
                .replaceAll('{GUILD_ID}', commandGuildId)
            );
        }

        // Check if there are any commands that need to be updated on discord for the bot
        if (this.localCommandsOnRemote.length > 0) {
            Logger.info(
                LogMessageTemplates.info.commandGuildActionUpdating
                .replaceAll('{COMMAND_LIST}', super.formatCommandList(this.localCommandsOnRemote))
                .replaceAll('{GUILD_ID}', commandGuildId)
            );

            // Update all of the commands already uploaded to discord
            for (let localCmd of this.localCommandsOnRemote) {
                await rest.put(Routes.applicationGuildCommands(botClientId, commandGuildId), {
                    body: localCmd,
                });
            }
            Logger.info(LogMessageTemplates.info.commandGuildActionUpdated
                .replaceAll('{GUILD_ID}', commandGuildId)
            );
        }
    }
}
