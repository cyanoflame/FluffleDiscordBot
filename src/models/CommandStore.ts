import type { RESTPostAPIApplicationCommandsJSONBody } from "discord.js";
import type { Command } from "../commands/Command";
import { MessageContextMenuCommand } from "../commands/contextMenu/message/MessageContextMenuCommand";
import { UserContextMenuCommand } from "../commands/contextMenu/user/UserContextMenuCommand";
import { SlashCommand } from "../commands/slash/SlashCommand";

/**
 * This class is used as a Facade for dealing with all of the commands used by the bot.
 * All commands must have their OWN UNIQUE NAMES, regardless of command type.
 */
export class CommandStore {
    /** Command names must be unique -- this is used to enforce that */
    private commandNamespace: Set<string>;

    // Commands are separated into different arrays to keep different ones separate.

    /** The collection of slash commands stored */
    private slashCommands: SlashCommand[];

    /** The collection of slash commands stored */
    private messageContextMenuCommands: MessageContextMenuCommand[];

    /** The collection of slash commands stored */
    private userContextMenuCommands: UserContextMenuCommand[];

    /**
     * This constructor creates the command storage. It could be created with an initial set of 
     * commands, or they could be added in later.
     * @param commands A collection of commands to start as part of the storage.
     */
    constructor(commands?: Command[]) {
        // Create the name set
        this.commandNamespace = new Set<string>();

        // Create the empty arrays
        this.slashCommands = [];
        this.messageContextMenuCommands = [];
        this.userContextMenuCommands = [];

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
        if(this.commandNamespace.has(command.getName())) {
            // do not add it
            return false;
        }
        // Check the command type and add it to the proper collection
        if(command instanceof SlashCommand) {
            this.slashCommands.push(command);
        } else
        if(command instanceof MessageContextMenuCommand) {
            this.messageContextMenuCommands.push(command);
        } else
        if(command instanceof UserContextMenuCommand) {
            this.userContextMenuCommands.push(command);
        } else {
            // Unknown command type
            return false;
        }

        // Add the command name to the namespace
        this.commandNamespace.add(command.getName());

        // Added successfully
        return true;
    }

    /**
     * Returns all the metadata of all the commands in the CommandStore.
     * @returns The combined metadata of every command in the CommandStore.
     */
    public getAllCommandMetadata(): RESTPostAPIApplicationCommandsJSONBody[] {
        // Get all the metadata from every command and return it
        return [
            ...this.slashCommands.map(command => command.getMetadata()),
            ...this.messageContextMenuCommands.map(command => command.getMetadata()),
            ...this.userContextMenuCommands.map(command => command.getMetadata()),
        ]
    }

    /**
     * Private helper method used look through a specific set of commands and try and find one that matches.
     * @param commandCollection The collection of the commands to check for the command.
     * @param commandParts The parts of the command to search for.
     * @returns The exact command if one was found, or the closest match to it. It returns undefined if there
     * are no matches.
     */
    private findCommand<T extends Command>(commandCollection: T[], commandParts: string[]): T | undefined {
        // get a duplicating list of commands
        let found = [...commandCollection];
        // the command that would be the closest match
        let closestMatch: Command | undefined = undefined;

        // Checks all of the command parts
        for (let [index, commandPart] of commandParts.entries()) {
            // Remove all of the commands not matching
            // found = found.filter(command => command.getNames()[index] === commandPart);
            found = found.filter(command => command.getName() === commandPart);
            // if there is nothing matching, return the current closest match
            if (found.length == 0) {
                return closestMatch;
            }
            // if there is only 1 option, return that option since it is the closest
            if (found.length == 1) {
                return found[0];
            }
        }
        // return the closest match to a function
        return closestMatch;
    }

    /**
     * Returns the closest matching slash command based on the command parts given to it.
     * @param commandCollection The collection of the commands to check for the command.
     * @param commandParts The parts of the command to search for.
     * @returns The closest matching slash command or undefined if there is none.
     */
    public findSlashCommand(commandParts: string[]): SlashCommand | undefined {
        return this.findCommand<SlashCommand>(this.slashCommands, commandParts);
    }

    /**
     * Returns the closest matching message context menu command based on the command parts given to it.
     * @param commandCollection The collection of the commands to check for the command.
     * @param commandParts The parts of the command to search for.
     * @returns The closest matching slash command or undefined if there is none.
     */
    public findMessageContextMenuCommand(commandParts: string[]): MessageContextMenuCommand | undefined {
        return this.findCommand<MessageContextMenuCommand>(this.messageContextMenuCommands, commandParts);
    }

    /**
     * Returns the closest matching user context menu command based on the command parts given to it.
     * @param commandCollection The collection of the commands to check for the command.
     * @param commandParts The parts of the command to search for.
     * @returns The closest matching slash command or undefined if there is none.
     */
    public findUserContextMenuCommand(commandParts: string[]): UserContextMenuCommand | undefined {
        return this.findCommand<UserContextMenuCommand>(this.userContextMenuCommands, commandParts);
    }

    // There's probably some better way of doing this (below here) than copy/pasting 3 times...
    // Lack of pass by reference makes it janky though

    /**
     * Private helper method used to remove SlashCommands from the collection.
     * @param name The name of the command being removed.
     * @returns Whether or not the command was removed or not
     */
    private removeSlashCommand(name: string): boolean {
        for(let i = 0; i < this.slashCommands.length; i++) {
            if(this.slashCommands[i].getName() == name) {
                this.slashCommands = this.slashCommands.splice(i, 1);
                return true;
            }
        }
        return false;
    }

    /**
     * Private helper method used to remove MessageContextMenuCommands from the collection.
     * @param name The name of the command being removed.
     * @returns Whether or not the command was removed or not
     */
    private removeMessageContextMenuCommand(name: string): boolean {
        for(let i = 0; i < this.messageContextMenuCommands.length; i++) {
            if(this.messageContextMenuCommands[i].getName() == name) {
                this.messageContextMenuCommands = this.messageContextMenuCommands.splice(i, 1);
                return true;
            }
        }
        return false;
    }

    /**
     * Private helper method used to remove UserContextMenuCommands from the collection.
     * @param name The name of the command being removed.
     * @returns Whether or not the command was removed or not
     */
    private removeUserContextMenuCommand(name: string): boolean {
        for(let i = 0; i < this.userContextMenuCommands.length; i++) {
            if(this.userContextMenuCommands[i].getName() == name) {
                this.userContextMenuCommands = this.userContextMenuCommands.splice(i, 1);
                return true;
            }
        }
        return false;
    }

    /**
     * This method is used to remove a Command specified by the command's name. Removing it will make the bot
     * no longer check for/use it.
     * @param name The name of the command being removed from the collection.
     * @returns Whether or not it was removed successfully or not.
     */
    public removeCommandByName(name: string): boolean {
        // There's probably some better way of doing this...
        if(this.commandNamespace.has(name)) {
            // remove the name from the namespace
            this.commandNamespace.delete(name);
            // remove the command from the collection
            if(this.removeSlashCommand(name)) {
                return true;
            } else 
            if(this.removeMessageContextMenuCommand(name)) {
                return true;
            } else {
                return this.removeUserContextMenuCommand(name);
            }
        }
        // nothing to remove
        return false;
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
