import type { APIApplicationCommand, RESTPostAPIApplicationCommandsJSONBody } from "discord.js";

/**
 * This class holds a method that could be by commands when extended.
 * Maybe there's a better way of doing this? idk.
 */
export abstract class FormatCommandList {

    /**
     * This takes a list of commands and returns the names of all of them in a comma separated string.
     * For example: "cmd1, cmd2, cmd3"
     * @param cmds The list of commands to format into a readable string.
     * @returns Comma separated string of all the commands in the input list.
     */
    public formatCommandList(cmds: RESTPostAPIApplicationCommandsJSONBody[] | APIApplicationCommand[]): string {
        return cmds.length > 0
            ? cmds.map((cmd: { name: string }) => `'${cmd.name}'`).join(', ')
            : 'N/A';
    }

}
