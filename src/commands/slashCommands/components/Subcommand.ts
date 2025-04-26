import type { SubcommandElement } from "./SubcommandElement";
import { SlashCommandSubcommandBuilder, type ApplicationCommandOptionBase, type ApplicationCommandOptionChoiceData, type AutocompleteInteraction, type ChatInputCommandInteraction, type Client, type LocalizationMap, type SlashCommandBuilder, type SlashCommandSubcommandGroupBuilder } from "discord.js";
import type { EventData } from "../../../models/eventData";
import { CommandOptionCollection } from "./CommandOptionCollection";
import type { AutocompleteOption } from "./AutocompleteOption";

/**
 * The purpose of this class is to be extended when a user wants to make a new subcommand.
 * This is the base class for a subcommand. Subcommands have their own execution method and autocomplete structure 
 * associated with them. They are run instead of the main execute command for the slash command.
 */
export abstract class Subcommand implements SubcommandElement {

    /** This stores all the options used for the command. */
    private options: CommandOptionCollection;

    /**
     * This creates
     */
    constructor() {
        // Create the options collection and initialize it
        this.options = new CommandOptionCollection(this.getOptions());
    }

    /**
     * Returns the name for the subcommand.
     * @returns the name for the subcommand.
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
     * Returns the description of the subcommand.
     * @returns the description of the subcommand.
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
     * Returns a list of options for the command. If the options are autocomplete options, they should be added 
     * here as well.
     * @returns list of the options for the command, both autofill and not.
     */
    public getOptions(): (ApplicationCommandOptionBase | AutocompleteOption)[] {
        // default result if not overridden
        return [];
    }

    /**
     * Returns a list of options for the command. If the options are autocomplete options, they should be added 
     * here as well.
     * @returns list of the options for the command, both autofill and not.
     */
    public appendMetadata(optionBase: (SlashCommandBuilder | SlashCommandSubcommandGroupBuilder)): void {
        let metadata: SlashCommandSubcommandBuilder = new SlashCommandSubcommandBuilder();
        metadata.setName(this.getName());
        metadata.setNameLocalizations(this.getNameLocalizations());
        metadata.setDescription(this.getDescription());
        metadata.setDescriptionLocalizations(this.getDescriptionLocalizations());
        this.options.appendOptionsData(metadata);
        // Add the metadata to the base set of options
        optionBase.addSubcommand(metadata);
    }

    /**
     * Returns autocomplete choice data for the subcommand element or undefined if there is none.
     * @param interaction The interaction to get the autocomplete data for.
     * @returns The autocomplete data for the interaction option or undefined if there is none.
     */
    public autocomplete(interaction: AutocompleteInteraction): Promise<ApplicationCommandOptionChoiceData[] | undefined> {
        // Return the autocomplete from the options collection
        return this.options.autocomplete(interaction);
    }

    /**
     * This function will execute whatever the subcommand element does when it is called.
     * @param client The Discord client to run any commands to interact with Discord.
     * @param interaction The interaction causing the command to be triggered.
     * @param data The data related to the event, passed in from the EventDataService.
     */
    abstract execute(client: Client, interaction: ChatInputCommandInteraction, data: EventData): Promise<void>;
}
