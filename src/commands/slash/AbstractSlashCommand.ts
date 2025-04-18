import {
    ApplicationCommandOptionBase,
    ApplicationCommandOptionWithAutocompleteMixin,
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    Client,
    InteractionContextType,
    SlashCommandAttachmentOption,
    SlashCommandBooleanOption,
    SlashCommandBuilder,
    SlashCommandChannelOption,
    SlashCommandIntegerOption,
    SlashCommandMentionableOption,
    SlashCommandNumberOption,
    SlashCommandRoleOption,
    SlashCommandStringOption,
    SlashCommandUserOption,
    type ApplicationCommandOptionChoiceData,
    type LocalizationMap,
    type Permissions,
    type RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord.js';

import { EventData } from '../../models/eventData';
import type { Command, CommandDeferType } from '../Command';
import { AutocompletableOption } from './AutocompletableOption';
import type { SlashCommand } from './SlashCommand';
import type { SubcommandElement } from './SubcommandElement';

/**
 * This class defines the structure of a basic slash command. Compared to other commands, 
 * slash commands also have an AutoComplete part.
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
    abstract getNameLocalizations(): LocalizationMap | null;

    /**
     * Returns the description of the command.
     * @returns the description of the command.
     */
    abstract getDescription(): string;

    /**
     * Returns the description localizations for different languages, or null if there is none.
     * @returns LocalizationMap for the description localizations or null if there is none.
     */
    abstract getDescriptionLocalizations(): LocalizationMap | null;

    /**
     * Return the contexts that the command can be run in (servers, dms, group dms).
     * @returns the contexts that the command can be run in.
     */
    abstract getContexts(): InteractionContextType[];

    /**
     * Get the permissions required to be able to run the command.
     * @returns the permissions required to run the command.
     */
    abstract getDefaultMemberPermissions(): Permissions | bigint | number | null | undefined;

    /**
     * Whether or not the command handles nsfw things. If this is true, it can only be used in channels/places where nsfw content 
     * has been enabled.
     * @returns whether or not the command handles nsfw things.
     */
    abstract getIsNSFW(): boolean;

    /**
     * Returns a list of options for the command. If the options are autocomplete options, they should be added 
     * here as well.
     * @returns list of the options for the command, both autofill and not.
     */
    abstract getOptions(): (ApplicationCommandOptionBase | AutocompletableOption<ApplicationCommandOptionBase>)[];

    /** This map stores all of the subcommand features used by the slash command */
    private subcommandElements: Map<string, SubcommandElement>;

    /** This stores the functions to get the autocomplete options */
    private autocompleteParameterMap: Map<string, AutocompletableOption<ApplicationCommandOptionBase>>;

    /** This is the command's metadata -- it's constructed upon object creation */
    private metadata: RESTPostAPIChatInputApplicationCommandsJSONBody;

    /**
     * This function creates the map for the autocomplete parameters/commands.
     */
    constructor() {
        // Create the subcommand elements map
        this.subcommandElements = new Map<string, SubcommandElement>();

        // Create the map
        this.autocompleteParameterMap = new Map<string, AutocompletableOption<ApplicationCommandOptionBase>>();

        // Construct the metadata object upon command creation
        this.metadata = this.buildMetadata();
    }

    /**
     * This method is used to get the full metadata for the command.
     * @returns The metadata of the command.
     */
    public getMetadata(): RESTPostAPIChatInputApplicationCommandsJSONBody {
        return this.metadata;
    }

    /**
     * This method is used to build the metadata for the command, and also establish the different options.
     * @returns The metadata of the command.
     */
    private buildMetadata(): RESTPostAPIChatInputApplicationCommandsJSONBody {
        // Build the command from each of the defined methods
        let slashCommandData = new SlashCommandBuilder()
            .setName(this.getName())
            .setNameLocalizations(this.getNameLocalizations())
            .setDescription(this.getDescription())
            .setDescriptionLocalizations(this.getDescriptionLocalizations())
            .setContexts(this.getContexts())
            .setDefaultMemberPermissions(this.getDefaultMemberPermissions())
            .setNSFW(this.getIsNSFW())

        // Add custom string options
        for(const option of this.getOptions()) {
            let checkOption = option;
            if(option instanceof AutocompletableOption) {
                // Set the checkOption to the object with the data
                checkOption = option.getOptionData();
                // option.getOptionData()

                // Used to automatically set the command option to autocomplete (allows developer to disable if they want to as well)
                if(checkOption instanceof ApplicationCommandOptionWithAutocompleteMixin) {
                    checkOption.setAutocomplete(true);
                }

                // Add the autocomplete option to the autocomplete parameter map
                this.autocompleteParameterMap.set(option.getOptionData().name, option);
            }
            // Check against any of the option types and add the option in normally
            if (checkOption instanceof SlashCommandBooleanOption) {
                slashCommandData.addBooleanOption(checkOption);
            } else
            if(checkOption instanceof SlashCommandUserOption) {
                slashCommandData.addUserOption(checkOption);
            } else
            if(checkOption instanceof SlashCommandChannelOption) {
                slashCommandData.addChannelOption(checkOption);
            } else
            if(checkOption instanceof SlashCommandRoleOption) {
                slashCommandData.addRoleOption(checkOption);
            } else
            if(checkOption instanceof SlashCommandAttachmentOption) {
                slashCommandData.addAttachmentOption(checkOption);
            } else
            if(checkOption instanceof SlashCommandMentionableOption) {
                slashCommandData.addMentionableOption(checkOption);
            } else
            if(checkOption instanceof SlashCommandStringOption) {
                slashCommandData.addStringOption(checkOption);
            } else
            if(checkOption instanceof SlashCommandIntegerOption) {
                slashCommandData.addIntegerOption(checkOption);
            } else
            if(checkOption instanceof SlashCommandNumberOption) {
                slashCommandData.addNumberOption(checkOption);
            } 
        }
        // Return the build data
        return slashCommandData.toJSON();
    }

    /**
     * Returns autocomplete choice data for the command or undefined if there is none.
     * @param interaction The interaction to get the autocomplete data for.
     * @returns The autocomplete data for the interaction option or undefined if there is none.
     */
    public async autocomplete(interaction: AutocompleteInteraction): Promise<ApplicationCommandOptionChoiceData[] | undefined> {
        // if the command has sub commands, check the sub commands for their autocomplete
        if (this.subcommandElements.size > 0) {
            // if the interaction is part of a subcommand group
            let subcommandElementName: string | null = interaction.options.getSubcommandGroup();
            // if it's not partof a command group, then it must be part of a subcommand
            if(!subcommandElementName) {
                subcommandElementName = interaction.options.getSubcommand();
            }
            // The the subcommadn element and propagate the autocomplete
            let subcommandElement = this.subcommandElements.get(subcommandElementName);
            // Propagate the interaction
            if (subcommandElement) {
                return subcommandElement.autocomplete(interaction);
            } 
            // else {
            //     // Throw an error for when there is no subcommand found
            //     throw new RangeError("No subcommand element matches with the subcommand/subcommandgroup"); // TODO: Language support for this
            // }
        }
        // Otherwise, run the autocomplete for THIS command
        // Get the potential options for a command to be autocompleted
        let option = interaction.options.getFocused(true);
        // Check the map to see if there's an autocomplete command for the
        let autocompleteOption = this.autocompleteParameterMap.get(option.name);
        // if there is one to be autocomplete
        if(autocompleteOption) {
            // run the method to get the choices
            return autocompleteOption.getChoices(interaction);
        }
        // otherwise no autocomplete data to return
        return undefined;
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
            //     throw new RangeError("No subcommand element matches with the subcommand/subcommandgroup"); // TODO: Language support for this
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
        await this.executeSubcommand(client, interaction, data);
        // Run the child command's execution
        return this.executeCommand(client, interaction, data);
    }

}
