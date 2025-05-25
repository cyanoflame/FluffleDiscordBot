import { REST, Routes } from "discord.js";
import type { RESTGetAPIApplicationCommandsResult, APIApplicationCommand, RESTPostAPIApplicationCommandsJSONBody, RESTGetAPIApplicationGuildCommandsResult, RESTPostAPIApplicationGuildCommandsJSONBody } from "discord.js";
import type { CommandManagerFunction } from "./CommandManagerFunction";
import { Logger } from "../services/logger";
import LogMessageTemplates from "../../lang/logMessageTemplates.json"

/**
 * This stores many methods and information for the command management functions to use. This also supports adding commands to a single 
 * server, if the user wishes by constructing it with a server id included. This is useful for testing before deploying commands globally.
 */
export class CommandManager {

    /** This is the REST object used to communicate with discord. */
    private rest: REST

    /** This is the id of the bot */
    private botClientId: string;

    /** The server id for the server if the commands will be deployed to a server. */
    private commandsDeployGuild: string | undefined;

    /** This holds all of the local commands */
    private localCommandsMetadata: (RESTPostAPIApplicationCommandsJSONBody | RESTPostAPIApplicationGuildCommandsJSONBody)[]

    /** These are the remote commands -- they are undefined until they are retrieved */
    private remoteCommands: RESTGetAPIApplicationCommandsResult | RESTGetAPIApplicationGuildCommandsResult | undefined

    /**
     * This is used to create Command Manager object to run the commands
     * @param localCommandsMetadata The command metadata for the commands to be processed.
     * @param botToken The token for the bot to connect to Discord.
     * @param botClientId The client ID of the bot itself.
     * @param commandsDeployGuild If the commands are being deployed to a speecific guild only, that guild's ID (useful for 
     * development/testing). Otherwise, it will handle everything globally for the bot.
     */
    constructor(localCommandsMetadata: (RESTPostAPIApplicationCommandsJSONBody | RESTPostAPIApplicationGuildCommandsJSONBody)[],
        botToken: string, 
        botClientId: string,
        commandsDeployGuild?: string
    ) {
        // Store the bot client id
        this.botClientId = botClientId

        // create the REST object to communicate with Discord
        this.rest = new REST({ version: '10' }).setToken(botToken);

        // Sort all command metadata alphabetically by comamnd name
        this.localCommandsMetadata = localCommandsMetadata.sort((a, b) => (a.name > b.name ? 1 : -1));

        // Will need to be found manually later
        this.remoteCommands = undefined;

        // save the command deploy server if one was included
        this.commandsDeployGuild = commandsDeployGuild;
    }

    /**
     * Private helper method used to check whether or not the command manager 
     * is using commands based around a guild (true) or globally (false).
     * @returns Whether or not the command manager is using commands based around 
     * a guild (true) or globally (false).
     */
    private isUsingGuildDeployment(): boolean {
        return this.commandsDeployGuild != undefined
    }

    /**
     * Returns a list of commands that have previously been uploaded to the bot.
     * @returns a list of commands that have previously been uploaded to the bot.
     */
    public async getRemoteCommands(): Promise<RESTGetAPIApplicationCommandsResult | RESTGetAPIApplicationGuildCommandsResult> {
        if (this.remoteCommands == undefined) {
            // if retrieving commands for a server/guild
            if(this.isUsingGuildDeployment()) {
                this.remoteCommands = (await this.rest.get(
                    Routes.applicationGuildCommands(this.botClientId, this.commandsDeployGuild!) 
                )) as RESTGetAPIApplicationGuildCommandsResult;
            } else {
                // otherwise retrieve global commands
                this.remoteCommands = (await this.rest.get(
                    Routes.applicationCommands(this.botClientId)
                )) as RESTGetAPIApplicationCommandsResult;
            }
        }
        return this.remoteCommands;
    }

    /**
     * Returns a list of all of the local commands that already have been uploaded to the bot.
     * @returns a list of all of the local commands that already have been uploaded to the bot.
     */
    public async getLocalCommandsOnRemote(): Promise<(RESTPostAPIApplicationCommandsJSONBody | RESTPostAPIApplicationGuildCommandsJSONBody)[]> {
        let retrievedRemoteCommands = (await this.getRemoteCommands())
        // check the list of local commands
        return this.localCommandsMetadata.filter(
            // Check all the remote commands -- remove all local commands without a matching remote command
            localCommand => retrievedRemoteCommands.some(remoteCommand => remoteCommand.name === localCommand.name)
        );
    }

    /**
     * Returns a list of all the local commands that do NOT exist/have been uploaded to the bot
     * @returns a list of all the local commands that do NOT exist/have been uploaded to the bot
     */
    public async getLocalCommandsOnly(): Promise<(RESTPostAPIApplicationCommandsJSONBody | RESTPostAPIApplicationGuildCommandsJSONBody)[]> {
        let retrievedRemoteCommands = (await this.getRemoteCommands())
        // Check the list of local commands
        return this.localCommandsMetadata.filter(
            // check all the remote commands -- remove any local command with a matching remote command
            localCommand => !retrievedRemoteCommands.some(
                remoteCommand => remoteCommand.name === localCommand.name
            )
        );
    }

    /**
     * Returns a list of all the commands that ONLY exist/have been uploaded to the bot
     * @returns a list of all the commands that ONLY exist/have been uploaded to the bot
     */
    public async getRemoteCommandsOnly(): Promise<APIApplicationCommand[]> {
        // Get all the remote commands
        let remoteCommands = await this.getRemoteCommands();
        // Uncomment below to view the remote command data
        // remoteCommands.forEach(cmd => console.log("Remote Command:", cmd)); 
        return (remoteCommands).filter(
            // check against all local commands -- remove all commands with a matching local command
            remoteCommand => !this.localCommandsMetadata.some(
                localCommand => localCommand.name === remoteCommand.name
            )
        );
    }

    /**
     * Execute a CommandManagementFunction with the context from the manager.
     */
    public async executeCommand(command: CommandManagerFunction): Promise<void> {
        try {
            // Execute the command for a guild
            if(this.isUsingGuildDeployment()) {
                // run guild-specific function
                await command.executeCommandGuild(this.rest, this.botClientId, this.commandsDeployGuild!);
            } else {
                // Run global function
                await command.executeGlobal(this.rest, this.botClientId);
            }
        } catch (error) {
            Logger.error(LogMessageTemplates.error.commandAction, error);
        }

        // Wait for any final logs to be written.
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}
