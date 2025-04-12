import type {
    InteractionContextType,
    LocalizationMap,
    Permissions,
    RESTPostAPIApplicationCommandsJSONBody,
} from 'discord.js';
import type { SlashCommand } from './slash/SlashCommand';
import type { ContextMenuCommand } from './contextMenu/ContextMenuCommand';

/**
 * A command is one of these types
 */
export type Command = SlashCommand | ContextMenuCommand;

/**
 * This class defines the structure used by all commands and command types.
 * Command metadata is also stored with the command objects themselves.
 */
export interface CommonCommandData {
    
    /**
     * Returns the name for the command.
     * @returns the name for the command.
     */
    getName(): string;

    /**
     * Returns the name localizations for different languages, or null if there is none.
     * @returns LocalizationMap for the name localizations or null if there is none.
     */
    getNameLocalizations(): LocalizationMap | null;

    /**
     * Return the contexts that the command can be run in (servers, dms, group dms).
     * @returns the contexts that the command can be run in.
     */
    getContexts(): InteractionContextType[];

    /**
     * Get the permissions required to be able to run the command.
     * @returns the permissions required to run the command.
     */
    getDefaultMemberPermissions(): Permissions | bigint | number | null | undefined;

    /**
     * This method is used to get the metadata for the command.
     * @returns The metadata of the command.
     */
    getMetadata(): RESTPostAPIApplicationCommandsJSONBody;

    /** 
     * Discord requires a response from a command in 3 seconds or become invalid. If a 
     * response will take longer than that, the response will need to be deferred, sending a 
     * message "<app/bot> is thinking..." as a first response. This gives the response a 15
     * minute window to actually respond.
     * See https://discordjs.guide/slash-commands/response-methods.html#deferred-responses
     * 
     * @returns If the command needs to be deferred, then should return a CommandDeferType. If not, it should return undefined.
     */
    getDeferType(): CommandDeferType | undefined;

    // REMOVED SINCE DIFFERENT COMMANDS EXPECT DIFFERNT INTERATION TYPES
    // /**
    //  * This is the method used to check whether or not the command can be run by the user. If the command cannot be 
    //  * run, a CommandError should be thrown stating the reason it will not run. This error will be returned to 
    //  * @param interaction The command interaction being run.
    //  * @throws CommandError if the command is found to be unable to run.
    //  */
    // checkUsability(interaction: CommandInteraction): Promise<void>;

    // /**
    //  * This function will execute whenever the command is called.
    //  * @param client The Discord client to run any commands to interact with Discord.
    //  * @param interaction The interaction causing the command to be triggered.
    //  * @param data The data related to the event, passed in from the EventDataService.
    //  */
    // execute(client: Client, interaction: CommandInteraction, data: EventData): Promise<void>;
}

/**
 * Once the command is executed and the response takes longer than 3 seconds, the response will need to be defferred.
 * The bot will defer the interaction such that it will show a message like '<bot> is thinking...' similar to '<user> is typing...'
 * PUBLIC: For this option, anyone can see whether or not the bot is thinking.
 * HIDDEN: For this option, only the command user can see whether or not the bot is thinking.
 */
export enum CommandDeferType {
    PUBLIC = 'PUBLIC',
    HIDDEN = 'HIDDEN'
}
