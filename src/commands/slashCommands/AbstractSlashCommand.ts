import {
    ApplicationCommandOptionBase,
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    Client,
    InteractionContextType,
    Locale,
    SlashCommandBuilder,
    SlashCommandSubcommandBuilder,
    SlashCommandSubcommandGroupBuilder,
    type ApplicationCommandOptionChoiceData,
    type LocalizationMap,
    type Permissions,
    type RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord.js';

import { EventData } from '../../models/eventData';
import { CommandDeferType } from '../Command';
import type { SlashCommand } from './SlashCommand';
import type { SubcommandElement } from './components/SubcommandElement';
import { Subcommand } from './components/Subcommand';
import { CommandOptionCollection } from './components/CommandOptionCollection';
import type { AutocompleteOption } from './components/autocomplete/AutocompleteOption';
import { SubcommandGroup } from './components/SubcommandGroup';

/**
 * This class defines the structure of a basic slash command. This class is intended to be 
 * extended for the creation of any new slash command. There are a few fields that must be 
 * overridden, while others only have to be overridden if something other than the default
 * is desired.
 */
export abstract class AbstractSlashCommand implements SlashCommand {
    /**
     * Returns the name for the command.
     * @returns the name for the command.
     */
    abstract getName(): string;

    /**
     * Returns the name localizations for different languages, or null if there is none.
     * @returns LocalizationMap for the name localizations or null if there is none.
     */
    public getNameLocalizations(): LocalizationMap | null {
        // default result if not overridden
        return null;
    }

    /**
     * Returns the description of the command.
     * @returns the description of the command.
     */
    public getDescription(): string {
        // default result if not overridden
        return "";
    }

    /**
     * Returns the description localizations for different languages, or null if there is none.
     * @returns LocalizationMap for the description localizations or null if there is none.
     */
    public getDescriptionLocalizations(): LocalizationMap | null {
        // default result if not overridden
        return null;
    }

    /**
     * Return the contexts that the command can be run in (servers, dms, group dms).
     * @returns the contexts that the command can be run in.
     */
    public getContexts(): InteractionContextType[] {
        // default result if not overridden
        return [
            InteractionContextType.BotDM,
            InteractionContextType.Guild,
            InteractionContextType.PrivateChannel
        ];
    }

    /**
     * Get the permissions required to be able to run the command.
     * @returns the permissions required to run the command.
     */
    public getDefaultMemberPermissions(): Permissions | bigint | number | null | undefined {
        // default result if not overridden
        return undefined;
    }

    /**
     * Whether or not the command handles nsfw things. If this is true, it can only be used in channels/places where nsfw content 
     * has been enabled.
     * @returns whether or not the command handles nsfw things.
     */
    public getIsNSFW(): boolean {
        // default result if not overridden
        return false;
    }

    /**
     * 'Arguments' is a superset of 'options' that also includes subcommands as a part of them. This
     * returns a list of options for the command. These options could also be SUBCOMMAND GROUPS and 
     * SUBCOMMANDS, as they are all considered different options in the command.
     * Options can be constructed normally through their builders. If autocomplete is desired for an 
     * option, an Autocomplete option could also be used. Subcommands each have their own isolated 
     * execution in addition to the main command execution to make it easier to split/reference them.
     * @returns list of the options for the command, both autofill and not.
     */
    public getArguments(): (ApplicationCommandOptionBase | AutocompleteOption | SlashCommandSubcommandBuilder | SlashCommandSubcommandGroupBuilder | SubcommandElement)[] {
        // default result if not overridden
        return [];
    }

    /**
     * Private helper method used to retrieve the non-subcommand options from a command.
     * Not recommended to be used to get options for a command (use the option name instead if possible).
     * @returns The non-cubcommand options of a command.
     */
    protected getOptions(): (ApplicationCommandOptionBase | AutocompleteOption)[] {
        return this.getArguments().filter(option => {
            if(option instanceof SlashCommandSubcommandBuilder 
                || option instanceof SlashCommandSubcommandGroupBuilder
                || option instanceof Subcommand
                || option instanceof SubcommandGroup
            ) {
                return false;
            }
            return true;
        }) as (ApplicationCommandOptionBase | AutocompleteOption) [];
    }

    /**
     * This is used to get the name of an option at the option index. Option indicies are not affected by 
     * the
     * Not recommended to be used to get options for a command (use the option name instead if possible).
     * @param index 
     * @returns 
     */
    protected getOptionNameAtOptionIndex(index: number): string | undefined {
        return this.options.getOptionNameAtOptionIndex(index);
    }

    /**
     * Returns just the subcommand elements of a slash command.
     * @returns just the subcommand elements of a slash command.
     */
    protected getSubcommandElements(): (SlashCommandSubcommandBuilder | SlashCommandSubcommandGroupBuilder | SubcommandElement)[] {
        return this.getArguments().filter(option => {
            if(option instanceof SlashCommandSubcommandBuilder 
                || option instanceof SlashCommandSubcommandGroupBuilder
                || option instanceof Subcommand
                || option instanceof SubcommandGroup
            ) {
                return true;
            }
            return false;
        }) as (SlashCommandSubcommandBuilder | SlashCommandSubcommandGroupBuilder | SubcommandElement)[];
    }

    /** This map stores all of the subcommand features used by the slash command */
    private subcommandElements: Map<string, SubcommandElement>;

    /** This stores all the options used for the command. */
    private options: CommandOptionCollection;

    /**
     * This function creates the map for the autocomplete parameters/commands.
     */
    constructor() {
        // Create the subcommand elements map
        this.subcommandElements = new Map<string, SubcommandElement>();

        // Create the options collection and initialize it
        this.options = new CommandOptionCollection(this.getOptions());

        // Insert all of the subcommand elements to the collection
        this.getSubcommandElements().forEach(subcommandElement => {
            if(subcommandElement instanceof Subcommand || subcommandElement instanceof SubcommandGroup) {
                this.subcommandElements.set(subcommandElement.getName(), subcommandElement);
            }
        });
    }

    // /**
    //  * Used to get the longest string value in a localization map. Used in the calculation of the 
    //  * metadata character limit.
    //  * @param localizationMap The localization map of strings to get the longest value from.
    //  * @returns the length of the longest localization in the map.
    //  */
    // private static getLongestLocalizationValue(localizationMap: Partial<Record<Locale, string | null>>): number {
    //     // Track the longest found
    //     let longest = 0;
    //     // Get the longest localization name
    //     for(const localization in localizationMap) {
    //         // get the localization value
    //         let localizationValue = localizationMap[localization as Locale]
    //         // Check if it exists, and if it's the longest
    //         if(localizationValue && localizationValue.length > longest) {
    //             longest = localizationValue.length;
    //         }
    //     }
    //     // Return the longest found
    //     return longest;
    // }

    // /**
    //  * This function is used to test whether or the metadata of a command is less than the character limit. 
    //  * See https://discord.com/developers/docs/interactions/application-commands#slash-commands for more info.
    //  * If the command metadata is longer than the metadata character limit, it will not upload to Discord.
    //  * @param metadata The metadata which to check against the character limit.
    //  * @param characterLimit The number of characters which size of the metadata must be under.
    //  * @returns whether or not the metadata falls under the specified character limit.
    //  */
    // public static checkMetadataCharacterLimit(metadata: SlashCommandBuilder, characterLimit: number): boolean {
    //     // Track the character count here
    //     let count = 0;

    //     // Add the name length
    //     let longest = metadata.name.length;
    //     if(metadata.name_localizations) {
    //         let longestLocalization = AbstractSlashCommand.getLongestLocalizationValue(metadata.name_localizations);
    //         // Check if the longest localization is greater than the default
    //         if(longestLocalization > longest) {
    //             longest = longestLocalization;
    //         }
    //     }
    //     // Add the longest to the total
    //     count += longest;

    //     // Add the description length
    //     longest = metadata.description.length;
    //     if(metadata.description_localizations) {
    //         let longestLocalization = AbstractSlashCommand.getLongestLocalizationValue(metadata.description_localizations);
    //         // Check if the longest localization is greater than the default
    //         if(longestLocalization > longest) {
    //             longest = longestLocalization;
    //         }
    //     }
    //     // Add the longest to the total
    //     count += longest;

    //     // Add the values length
    //     metadata
    //     longest = metadata.description.length;
    //     if(metadata.description_localizations) {
    //         let longestLocalization = AbstractSlashCommand.getLongestLocalizationValue(metadata.description_localizations);
    //         // Check if the longest localization is greater than the default
    //         if(longestLocalization > longest) {
    //             longest = longestLocalization;
    //         }
    //     }
    //     // Add the longest to the total
    //     count += longest;

    //     return false
    // }

    /**
     * This method is used to get the full metadata for the command. Note: there is a character 
     * limit to the amount of things that can be used: 
     * https://discord.com/developers/docs/interactions/application-commands#slash-commands
     * @returns The metadata of the command.
     */
    public getMetadata(): RESTPostAPIChatInputApplicationCommandsJSONBody {
        // Build the command from each of the defined methods
        let slashCommandData = new SlashCommandBuilder()
        .setName(this.getName())
        .setNameLocalizations(this.getNameLocalizations())
        .setDescription(this.getDescription())
        .setDescriptionLocalizations(this.getDescriptionLocalizations())
        .setContexts(this.getContexts())
        .setDefaultMemberPermissions(this.getDefaultMemberPermissions())
        .setNSFW(this.getIsNSFW())

        // Add Subcommands/SubcommandGroups to metadata
        for(const subcommandElement of this.getSubcommandElements()) {
            // Add any normal SlashCommandSubcommandBuilders
            if(subcommandElement instanceof Subcommand) {
                subcommandElement.appendMetadata(slashCommandData);
            } else
            // Add any normal SlashCommandSubcommandGroupBuilder
            if(subcommandElement instanceof SubcommandGroup) {
                subcommandElement.appendMetadata(slashCommandData);
            }
        }

        // Add the options data
        this.options.appendOptionsData(slashCommandData);
        
        // Check the metadata's size -- must not be over 8000 chars
        // TODO: finish this later. Some abiguities in what's being counted

        // Return the built command data
        return slashCommandData.toJSON();
    }

    /**
     * Returns autocomplete choice data for the command or undefined if there is none.
     * @param interaction The interaction to get the autocomplete data for.
     * @returns The autocomplete data for the interaction option or undefined if there is none.
     */
    public async autocomplete(interaction: AutocompleteInteraction): Promise<ApplicationCommandOptionChoiceData[] | undefined> {
        // if the command has sub commands, check the sub commands for their autocomplete
        if(this.subcommandElements.size > 0) {
            // if the interaction is part of a subcommand group
            let subcommandElementName: string | null = interaction.options.getSubcommandGroup();
            // if it's not partof a command group, then it must be part of a subcommand
            if(!subcommandElementName) {
                subcommandElementName = interaction.options.getSubcommand();
            }
            // Get the subcommand element and propagate the autocomplete
            let subcommandElement = this.subcommandElements.get(subcommandElementName);
            // Propagate the interaction
            if (subcommandElement) {
                return subcommandElement.autocomplete(interaction);
            } 
            // else {
            //     // Throw an error for when there is no subcommand found
            //     throw new Error("No subcommand element matches with the subcommand/subcommandgroup"); // TODO: Language support for this
            // }
        }
        // Return the autocomplete from the options collection
        return this.options.autocomplete(interaction);
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
    public getDeferType(): CommandDeferType | undefined {
        // default result if not overridden
        return CommandDeferType.PUBLIC;
    }

    /**
     * This is the method used to check whether or not the command can be run by the user. If the command cannot be 
     * run, a CommandError should be thrown stating the reason it will not run. This error will be returned to 
     * @param interaction The command interaction being run.
     * @throws CommandError if the command is found to be unable to run.
     */
    abstract checkUsability(interaction: ChatInputCommandInteraction): Promise<void>;

    /**
     * This is a protected helper method used to execute everything from a subcommand used by the function.
     * @param client The Discord client to run any commands to interact with Discord.
     * @param interaction The interaction causing the command to be triggered.
     * @param data The data related to the event, passed in from the EventDataService.
     */
    protected async executeSubcommand(client: Client, interaction: ChatInputCommandInteraction, data: EventData): Promise<void> {
        // if the command has sub commands, check the sub commands for their execution
        if (this.subcommandElements.size > 0) {
            // if the interaction is part of a subcommand group
            let subcommandElementName: string | null = interaction.options.getSubcommandGroup();
            // if it's not partof a command group, then it must be part of a subcommand
            if(!subcommandElementName) {
                subcommandElementName = interaction.options.getSubcommand();
            }
            // The the subcommadn element and propagate the execution
            let subcommandElement = this.subcommandElements.get(subcommandElementName);
            // Propagate the interaction
            if (subcommandElement) {
                return subcommandElement.execute(client, interaction, data);
            } 
            // else {
            //     // Throw an error for when there is no subcommand found
            //     throw new Error("No subcommand element matches with the subcommand/subcommandgroup"); // TODO: Language support for this
            // }
        }
    }

    /**
     * This function will execute whenever the command itself is run. If subcommands are used, then this will 
     * run after the subcommand executes.
     * @param client The Discord client to run any commands to interact with Discord.
     * @param interaction The interaction causing the command to be triggered.
     * @param data The data related to the event, passed in from the EventDataService.
     */
    abstract executeCommand(client: Client, interaction: ChatInputCommandInteraction, data: EventData): Promise<void>;

    /**
     * This function will execute whenever the command is called.
     * @param client The Discord client to run any commands to interact with Discord.
     * @param interaction The interaction causing the command to be triggered.
     * @param data The data related to the event, passed in from the EventDataService.
     */
    public async execute(client: Client, interaction: ChatInputCommandInteraction, data: EventData): Promise<void> {
        // Run anything from the subcommand begin run
        if (this.subcommandElements.size > 0) {
            return this.executeSubcommand(client, interaction, data);
        }
        // Run the child command's execute
        return this.executeCommand(client, interaction, data);
    }

}
