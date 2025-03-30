// commands/Command.ts
import {
    Client,
    GuildChannel,
    ThreadChannel,
    type CommandInteraction,
    type PermissionsString,
    type RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord.js';

import { EventData } from '../models/eventData';
import type { Command, CommandDeferType } from './Command';
import { CommandError } from './CommandError';

/**
 * This class serves as a base for a simple command that only checks against permissions to see if it 
 * can run. The permissions should be established in the getRequiredClientPermissions() in the child class.
 */
export abstract class CommandWithPermissions implements Command {
    
    /**
     * Returns the permissions required to use the command.
     * @returns the permissions required to use the command.
     */
    abstract getRequiredClientPermissions(): PermissionsString[];

    /**
     * Returns the names that define the command.
     * @returns the names that define the command.
     */
    abstract getNames(): string[];

    /** 
     * Discord requires a response from a command in 3 seconds or become invalid. If a 
     * response will take longer than that, the response will need to be deferred, sending a 
     * message "<app/bot> is thinking..." as a first response. This gives the response a 15
     * minute window to actually respond.
     * See https://discordjs.guide/slash-commands/response-methods.html#deferred-responses
     * 
     * @returns If the command needs to be deferred, then should return a CommandDeferType. If not, it should return undefined.
     */
    abstract getDeferType(): CommandDeferType | undefined;
    
    /**
     * This method is used to get the metadata for the command.
     * @returns The metadata of the command.
     */
    abstract getMetadata(): RESTPostAPIChatInputApplicationCommandsJSONBody;

    /**
     * This is the method used to check whether or not the user has the permissions to run the command or not. If the command cannot be 
     * run, a CommandError should be thrown stating the reason it will not run. This error will be returned to 
     * @param interaction The command interaction being run.
     * @throws CommandError with the permissions not met by the user running the command.
     */
    public checkUsability(interaction: CommandInteraction) {
        if(interaction.channel instanceof GuildChannel || interaction.channel instanceof ThreadChannel) {
            // get user permissions
            let userPermissions = interaction.channel!.permissionsFor(interaction.client.user)
            if(!(userPermissions && userPermissions.has(this.getRequiredClientPermissions()))) {
                // Stop execution because permissions are good
                return 
            } else {
                // Throw an error because the user permissions didn't match
                throw new CommandError(
                    this.getRequiredClientPermissions()
                    .map(permission => `**${permission}**`) // TODO: Language support for this (instead of using enum map to function)
                    .join(', ')
                )
            }
        } else {
            // Throw an error because invalid channel type to run commands in
            throw new CommandError("Command cannot be run in channel type") // TODO: Language support for this
        }
    }

    /**
     * This function will execute whenever the command is called.
     * @param client The Discord client to run any commands to interact with Discord.
     * @param interaction The interaction causing the command to be triggered.
     * @param data The data related to the event, passed in from the EventDataService.
     */
    abstract execute(client: Client, interaction: CommandInteraction, data: EventData): Promise<void>;

}
