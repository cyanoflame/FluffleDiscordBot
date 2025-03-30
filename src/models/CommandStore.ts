import type { Command } from "../commands/Command";

/**
 * This class deals with storing and accessing commands.
 */
export class CommandStore {
    /** The collection of commands stored */
    private commands: Command[]

    /**
     * This constructor creates the command storage. It could be created with an initial set of 
     * commands, or they could be added in later.
     * @param commands A collection of commands to start as part of the storage.
     */
    constructor(commands?: Command[]) {
        // Start the command store with some commands initially
        if (commands) {
            this.commands = commands;
        } else {
            this.commands = [];
        }
    }

    /**
     * Returns the closest matching command based on the command parts given to it.
     * @param commandParts The parts of the command to search for.
     * @returns The exact command if one was found, or the closest match to it. It returns undefined if there
     * are no matches.
     */
    public findCommand(commandParts: string[]): Command | undefined {
        // get a duplicating list of commands
        let found = [...this.commands];
        // the command that would be the closest match
        let closestMatch: Command | undefined = undefined;

        // Checks all of the command parts
        for (let [index, commandPart] of commandParts.entries()) {
            // Remove all of the commands not matching
            found = found.filter(command => command.getNames()[index] === commandPart);
            // if there is nothing matching, return the current closest match
            if (found.length == 0) {
                return closestMatch;
            }
            // if there is only 1 option, return that option since it is the closest
            if (found.length == 1) {
                return found[0];
            }
            // attempt to find an exact match if there is one
            let exactMatch = found.find(command => command.getNames().length === index + 1);
            // if an exact match is found, set the closest match to it
            if (exactMatch) {
                closestMatch = exactMatch;
            }
        }
        // return the closest match to a function
        return closestMatch;
    }

    /**
     * This method is used to add a Command to the bot for it to use.
     * @param command The command that will be added to the bot to be used.
     * @returns The index of the command in the command collection, which could be used to remove it.
     */
    public addCommand(command: Command): number {
        // Add to the array
        this.commands.push(command);
        // Return the index it was inserted at
        return this.commands.length - 1;
    }

    /**
     * This method is used to remove a Command specified by its index in the array. Removing it will make the bot
     * no longer check for/use it.
     * @param index The index of the command being removed from the command collection storing them. This was returned when 
     * it was added. Otherwise, you can remove it by referencing the object itself.
     * @returns Whether or not it was removed successfully or not. It will return false if the index is out of bounds.
     */
    public removeCommandIndex(index: number): boolean {
        if(this.commands[index] != undefined) {
            this.commands = this.commands.splice(index, 1);
            return true;
        }
        return false
    }

    /**
     * This method is used to remove a Command specified by the object itself. Removing it will make the bot
     * no longer check for/use it.
     * @param command The command object itself that's being removed from the array storing them.
     * @returns @returns Whether or not it was removed successfully or not. It will return false if it did not exist in the array.
     */
    public removeCommand(command: Command): boolean {
        // Get the index of it
        let index = this.commands.indexOf(command);
        return this.removeCommandIndex(index);
    }
    
}
