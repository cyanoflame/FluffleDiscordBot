import { REST, Routes } from "discord.js";
import type { RESTPostAPIChatInputApplicationCommandsJSONBody, RESTGetAPIApplicationCommandsResult, RESTPostAPIContextMenuApplicationCommandsJSONBody, APIApplicationCommand } from "discord.js";
import type { CommandManagerFunction } from "./CommandManagerFunction";
import { Logger } from "../services/logger";
import LogMessageTemplates from "../../lang/logMessageTemplates.json"

export class CommandManager {

    /** This is the REST object used to communicate with discord. */
    private rest: REST

    /** This is the id of the bot */
    private botClientId: string;

    /** This is the bot token used for the bot */
    private botToken: string;

    /** This holds all of the local commands */
    private localCommandsMetadata: (RESTPostAPIChatInputApplicationCommandsJSONBody | RESTPostAPIContextMenuApplicationCommandsJSONBody)[]

    /** These are the remote commands -- they are undefined until they are retrieved */
    private remoteCommands: RESTGetAPIApplicationCommandsResult | undefined

    // /** List of all of the local commands that already have been uploaded to the bot */
    // private localCommandsMetadataOnRemote: (RESTPostAPIChatInputApplicationCommandsJSONBody | RESTPostAPIContextMenuApplicationCommandsJSONBody)[]

    // /** List of all the local commands that do NOT exist/have been uploaded to the bot */
    // private localCommandsMetadataOnly: (RESTPostAPIChatInputApplicationCommandsJSONBody | RESTPostAPIContextMenuApplicationCommandsJSONBody)[]

    // /** List of all the commands that ONLY exist/have been uploaded to the bot */
    // private remoteCommandsOnly: (RESTPostAPIChatInputApplicationCommandsJSONBody | RESTPostAPIContextMenuApplicationCommandsJSONBody)[]

    /**
     * This is used to create Command Manager object to run the commands
     */
    constructor(botToken: string, botClientId: string,
        localCommandsMetadata: (RESTPostAPIChatInputApplicationCommandsJSONBody | RESTPostAPIContextMenuApplicationCommandsJSONBody)[],
    ) {
        this.botToken = botToken;
        this.botClientId = botClientId
        this.rest = new REST({ version: '10' }).setToken(botToken);
        // Sort all command metadata alphabetically by comamnd name
        this.localCommandsMetadata = localCommandsMetadata.sort((a, b) => (a.name > b.name ? 1 : -1));

        // Will need to be found manually later
        this.remoteCommands = undefined;
    }

    /**
     * Returns a list of commands that have previously been uploaded to the bot.
     * @returns a list of commands that have previously been uploaded to the bot.
     */
    public async getRemoteCommands(): Promise<RESTGetAPIApplicationCommandsResult> {
        if (this.remoteCommands == undefined) {
            this.remoteCommands = (await this.rest.get(
                Routes.applicationCommands(this.botClientId)
            )) as RESTGetAPIApplicationCommandsResult;
        }
        return this.remoteCommands
    }

    /**
     * Returns a list of all of the local commands that already have been uploaded to the bot.
     * @returns a list of all of the local commands that already have been uploaded to the bot.
     */
    public async getLocalCommandsOnRemote(): Promise<(RESTPostAPIChatInputApplicationCommandsJSONBody | RESTPostAPIContextMenuApplicationCommandsJSONBody)[]> {
        let retrievedRemoteCommands = (await this.getRemoteCommands())
        return this.localCommandsMetadata.filter(localCommand =>
            retrievedRemoteCommands.some(remoteCommand => remoteCommand.name === localCommand.name)
        );
    }

    /**
     * Returns a list of all the local commands that do NOT exist/have been uploaded to the bot
     * @returns a list of all the local commands that do NOT exist/have been uploaded to the bot
     */
    public async getLocalCommandsOnly(): Promise<(RESTPostAPIChatInputApplicationCommandsJSONBody | RESTPostAPIContextMenuApplicationCommandsJSONBody)[]> {
        let retrievedRemoteCommands = (await this.getRemoteCommands())
        return this.localCommandsMetadata.filter(
            localCommand => !retrievedRemoteCommands.some(remoteCommand => remoteCommand.name === localCommand.name)
        );
    }

    /**
     * Returns a list of all the commands that ONLY exist/have been uploaded to the bot
     * @returns a list of all the commands that ONLY exist/have been uploaded to the bot
     */
    public async getRemoteCommandsOnly(): Promise<APIApplicationCommand[]> {
        return (await this.getRemoteCommands()).filter(
            remoteCommand => !this.localCommandsMetadata.some(localCommand => localCommand.name === remoteCommand.name)
        );
    }

    /**
     * Execute a CommandManagementFunction with the context from the manager.
     */
    public async executeCommand(command: CommandManagerFunction): Promise<void> {
        try {
            // Execute the command
            await command.execute(this.rest, this.botClientId);
        } catch (error) {
            Logger.error(LogMessageTemplates.error.commandAction, error);
        }

        // Wait for any final logs to be written.
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}
