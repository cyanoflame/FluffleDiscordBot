import { REST, Routes } from "discord.js";
import type { RESTPostAPIChatInputApplicationCommandsJSONBody, RESTGetAPIApplicationCommandsResult, RESTPostAPIContextMenuApplicationCommandsJSONBody } from "discord.js";
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
    private localCommands: {[command: string]: RESTPostAPIChatInputApplicationCommandsJSONBody | RESTPostAPIContextMenuApplicationCommandsJSONBody}[]

    /**
     * This is used to create Command Manager object to run the commands
     */
    constructor(botToken: string, botClientId: string) {
        this.botToken = botToken;
        this.botClientId = botClientId
        this.rest = new REST({ version: '10' }).setToken(botToken);
        this.localCommands = [];
    }

    /**
     * Returns a list of commands that have previously been uploaded to the bot.
     * @returns a list of commands that have previously been uploaded to the bot.
     */
    public async getRemoteCommands(): Promise<RESTGetAPIApplicationCommandsResult> {
        return (await this.rest.get(
            Routes.applicationCommands(process.env.CLIENT_ID!)
        )) as RESTGetAPIApplicationCommandsResult;
    }

    /**
     * This adds a command
     */
    public addLocalCommand(){
        //
    }

    /**
     * Execute a command function
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
