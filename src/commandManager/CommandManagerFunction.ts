import type { REST, APIApplicationCommand, RESTPostAPIApplicationCommandsJSONBody, RESTPostAPIApplicationGuildCommandsJSONBody } from "discord.js";

/**
 * This abstract class establishes a base for CommandManager functions. Each function is used to access/manage 
 * commands for the Discord bot that are stored on Discord.
 */
export abstract class CommandManagerFunction {
    /**
     * This is a utility function that takes a list of commands and returns the names of 
     * all of them in a comma separated string. For example: "cmd1, cmd2, cmd3"
     * @param cmds The list of commands to format into a readable string.
     * @returns Comma separated string of all the commands in the input list.
     */
    protected formatCommandList(cmds: RESTPostAPIApplicationCommandsJSONBody[] | RESTPostAPIApplicationGuildCommandsJSONBody[] | APIApplicationCommand[]): string {
        return cmds.length > 0
            ? cmds.map((cmd: { name: string }) => `'${cmd.name}'`).join(', ')
            : 'N/A';
    }
    
    /**
     * This is what runs when the function is executed by the CommandManager. This method should 
     * be designed to apply to GLOBAL commands.
     * @param rest The REST object being used to communicate with discord for command interactions.
     * @param botClientId The bot's client id that's needed to interact with discord for command interactions.
     */
    abstract executeGlobal(rest: REST, botClientId: string): Promise<void>;


    /**
     * This is what runs when the function is executed by the CommandManager. This method should 
     * be designed to apply to GUILD-SPECIFIC commands. (These are often used for testing).
     * @param rest The REST object being used to communicate with discord for command interactions.
     * @param botClientId The bot's client id that's needed to interact with discord for command interactions.
     * @param commandGuildId The id of the guild in which the commands being accessed/modified.
     */
    abstract executeCommandGuild(rest: REST, botClientId: string, commandGuildId: string): Promise<void>;
}
