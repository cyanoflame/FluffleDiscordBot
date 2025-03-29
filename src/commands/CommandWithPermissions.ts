// commands/Command.ts
import {
    GuildChannel,
    ThreadChannel,
    type CommandInteraction,
    type PermissionsString,
    type RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord.js';

import { EventData } from '../models/eventData';
import type { Command, CommandDeferType } from './Command';

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
     * This is the method used to check whether or not the user has the permissions to run the command or not.
     * @param interaction The command interaction causing the trigger.
     * @return Whether or not the user has permission to run the command or not
     */
    public canUseCommand(interaction: CommandInteraction): boolean {
        if(interaction.channel instanceof GuildChannel || interaction.channel instanceof ThreadChannel) {
            // get user permissions
            let userPermissions = interaction.channel!.permissionsFor(interaction.client.user)
            if(userPermissions && userPermissions.has(this.getRequiredClientPermissions())) {
                // The user has permissions needed
                return true
            }
        }
        return false
    }

    /**
     * This function will execute whenever the command is called.
     * @param interaction The interaction causing the command to be triggered.
     * @param data The data related to the event, passed in from the EventDataService.
     */
    abstract execute(interaction: CommandInteraction, data: EventData): Promise<void>;

}
