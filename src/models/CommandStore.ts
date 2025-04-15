import type { RESTPostAPIApplicationCommandsJSONBody } from "discord.js";
import type { Command } from "../commands/Command";

/**
 * This class is used as a Facade for dealing with all of the commands used by the bot.
 * All commands must have their OWN UNIQUE NAMES, regardless of command type.
 */
export class CommandStore {

    /** The collection of commands stored */
    private commands: Map<string, Command>;

    /**
     * This constructor creates the command storage. It could be created with an initial set of 
     * commands, or they could be added in later.
     * @param commands A collection of commands to start as part of the storage.
     */
    constructor(commands?: Command[]) {

        // Create the empty arrays
        // this.slashCommands = [];
        this.commands = new Map<string, Command>();

        // Add all of the commands from the array.
        if(commands) {
            commands.forEach(command => {
                this.addCommand(command);
            })
        }
    }

    /**
     * Attemtps to stores the command for reference. If added successfully, it will return true. If not, 
     * it will return false. It will fail if there already exists a command with the same name.
     * @param command The command to add to the collection.
     * @returns Whether or not the command was added successfully.
     */
    public addCommand(command: Command): boolean {
        // if there already exists a command with the same name
        if(this.commands.has(command.getName())) {
            // do not add it
            return false;
        }
        
        // Add to the command collection
        this.commands.set(command.getName(), command);

        // Added successfully
        return true;
    }

    /**
     * Returns all the metadata of all the commands in the CommandStore.
     * @returns The combined metadata of every command in the CommandStore.
     */
    public getAllCommandMetadata(): RESTPostAPIApplicationCommandsJSONBody[] {
        // Get all the metadata from every command and return it
        let commandMetadataList: RESTPostAPIApplicationCommandsJSONBody[] = [];
        this.commands.forEach(command => {
            commandMetadataList.push(command.getMetadata());
        });
        return commandMetadataList;
    }

    /**
     * Private helper method used look through a specific set of commands and try and find one that matches.
     * @param commandCollection The collection of the commands to check for the command.
     * @param commandParts The parts of the command to search for.
     * @returns The exact command if one was found, or the closest match to it. It returns undefined if there
     * are no matches.
     */
    public findCommand(commandName: string): Command | undefined {
        return this.commands.get(commandName);
    }

    // There's probably some better way of doing this (below here) than copy/pasting 3 times...
    // Lack of pass by reference makes it janky though

    /**
     * This method is used to remove a Command specified by the command's name. Removing it will make the bot
     * no longer check for/use it.
     * @param name The name of the command being removed from the collection.
     * @returns Whether or not it was removed successfully or not.
     */
    public removeCommandByName(name: string): boolean {
        return this.commands.delete(name);
    }

    /**
     * This method is used to remove a Command by referencing the command itself. Removing it will make the bot
     * no longer check for/use it.
     * @param command The command that's being removed from the collection.
     * @returns @returns Whether or not it was removed successfully or not.
     */
    public removeCommand(command: Command): boolean {
        // Get the command name to remove it
        return this.removeCommandByName(command.getName());
    }
    
}
