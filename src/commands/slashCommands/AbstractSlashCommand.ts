import {
    ApplicationCommandOptionBase,
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    Client,
    InteractionContextType,
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
import type { AutocompleteOption } from './components/AutocompleteOption';

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
     * Returns a list of options for the command. If the options are autocomplete options, they should be added 
     * here as well.
     * @returns list of the options for the command, both autofill and not.
     */
    public getOptions(): (ApplicationCommandOptionBase | AutocompleteOption)[] {
        // default result if not overridden
        return [];
    }

    /**
     * Returns the collection of subcommands and subcommand groups used by the slash command.
     * @returns the collection of subcommands and subcommand groups used by the slash command.
     */
    public getSubcommandElements(): (SlashCommandSubcommandBuilder | SlashCommandSubcommandGroupBuilder | SubcommandElement)[] {
        // default result if not overridden
        return [];
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
    }

    /**
     * This method is used to get the full metadata for the command.
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

        // Add custom subcommands
        for(const subcommandElement of this.getSubcommandElements()) {
            // Add any normal SlashCommandSubcommandBuilders
            if(subcommandElement instanceof SlashCommandSubcommandBuilder) {
                slashCommandData.addSubcommand(subcommandElement);
            } else
            // Add any normal SlashCommandSubcommandGroupBuilder
            if(subcommandElement instanceof SlashCommandSubcommandGroupBuilder) {
                slashCommandData.addSubcommandGroup(subcommandElement);
            } else {
                // Determine whether the command added is a subcommand or a subcommand group
                if(subcommandElement instanceof Subcommand) {
                    slashCommandData.addSubcommand(subcommand => 
                        subcommand
                            // .add
                    )
                } // else
                // if(subcommandElement instanceof SubcommandGroup) {
                //     //
                // }

                // Add the subcommand element to the map
                this.subcommandElements.set(subcommandElement.getName(), subcommandElement);
            }
        }

        // Add the options data
        this.options.appendOptionsData(slashCommandData);
        
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
