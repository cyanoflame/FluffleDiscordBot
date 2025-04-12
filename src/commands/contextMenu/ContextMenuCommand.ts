import {
    ApplicationCommandType,
    ApplicationIntegrationType,
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    Client,
    ContextMenuCommandBuilder,
    ContextMenuCommandInteraction,
    InteractionContextType,
    type ApplicationCommandOptionChoiceData,
    type LocalizationMap,
    type Permissions,
    type RESTPostAPIContextMenuApplicationCommandsJSONBody,
} from 'discord.js';

import { EventData } from '../../models/eventData';
import type { Command, CommandDeferType } from '../Command';

/**
 * This class defines the structure of a basic message context menu command.These do not have 
 * options or subcommands.
 */
export abstract class ContextMenuCommand implements Command {
    /**
     * Returns the name for the command.
     * @returns the name for the command.
     */
    abstract getName(): string;

    /**
     * Returns the name localizations for different languages, or null if there is none.
     * @returns LocalizationMap for the name localizations or null if there is none.
     */
    abstract getNameLocalizations(): LocalizationMap | null;

    /**
     * Returns the contexts that the command can be run in (servers, dms, group dms).
     * @returns the contexts that the command can be run in.
     */
    abstract getContexts(): InteractionContextType[];

    /**
     * Get the permissions required to be able to run the command.
     * @returns the permissions required to run the command.
     */
    abstract getDefaultMemberPermissions(): Permissions | bigint | number | null | undefined;

    /**
     * Returns the the integration types for the context menu command. This describes where it 
     * can be installed- being available to users or to servers, or both.
     */
    abstract getIntegrationTypes(): ApplicationIntegrationType[];

    /** This is the command's metadata -- it's constructed upon object creation */
    private metadata: RESTPostAPIContextMenuApplicationCommandsJSONBody;

    /**
     * This function creates the map for the autocomplete parameters/commands.
     */
    constructor() {
        // Construct the metadata object upon command creation
        this.metadata = this.buildMetadata().toJSON();
    }

    /**
     * This method is used to get the full metadata for the command.
     * @returns The metadata of the command.
     */
    public getMetadata(): RESTPostAPIContextMenuApplicationCommandsJSONBody {
        return this.metadata;
    }

    /**
     * This method is used to build the metadata for the command, and also establish the different options.
     * @returns The metadata of the command.
     */
    protected buildMetadata(): ContextMenuCommandBuilder {
        // Build the command from each of the defined methods
        let contextMenuCommandData = new ContextMenuCommandBuilder()
            .setName(this.getName())
            .setNameLocalizations(this.getNameLocalizations())
            .setContexts(this.getContexts())
            .setDefaultMemberPermissions(this.getDefaultMemberPermissions())
            .setIntegrationTypes(this.getIntegrationTypes())

        // Return the built command's data
        return contextMenuCommandData;
    }

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
     * This is the method used to check whether or not the command can be run by the user. If the command cannot be 
     * run, a CommandError should be thrown stating the reason it will not run. This error will be returned to 
     * @param interaction The command interaction being run.
     * @throws CommandError if the command is found to be unable to run.
     */
    abstract checkUsability(interaction: ContextMenuCommandInteraction): Promise<void>;

    /**
     * This function will execute whenever the command is called.
     * @param client The Discord client to run any commands to interact with Discord.
     * @param interaction The interaction causing the command to be triggered.
     * @param data The data related to the event, passed in from the EventDataService.
     */
    abstract execute(client: Client, interaction: ContextMenuCommandInteraction, data: EventData): Promise<void>
    
    // /**
    //  * This function will execute whenever the command is called. This uses a chatInputCommandInteraction because the 
    //  * slash command comes from chat.
    //  * @param client The Discord client to run any commands to interact with Discord.
    //  * @param interaction The interaction causing the command to be triggered.
    //  * @param data The data related to the event, passed in from the EventDataService.
    //  */
    // abstract executeContextMenuCommand(client: Client, interaction: ContextMenuCommandInteraction, data: EventData): Promise<void>;

}
