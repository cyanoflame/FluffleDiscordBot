import { SlashCommandSubcommandGroupBuilder, type ApplicationCommandOptionBase, type ApplicationCommandOptionChoiceData, type AutocompleteInteraction, type ChatInputCommandInteraction, type Client, type LocalizationMap, type SlashCommandBuilder } from "discord.js";
import type { Subcommand } from "./Subcommand";
import type { SubcommandElement } from "./SubcommandElement";
import type { EventData } from "../../../models/eventData";

/**
 * This class defines the structure of a slash command subcommand group. This class is 
 * intended to be extended for the creation of any new subcommand group. There are a few 
 * fields that must be overridden, while others only have to be overridden if something 
 * other than the default is desired.
 * 
 * Subcommand groups are collections of subcommands that a slash command could branch 
 * off to. Each subcommand group MUST have at least 1 subcommand. Each slash command 
 * can have both subcommands and subcommand groups.
 */
export abstract class SubcommandGroup implements SubcommandElement {

    /** This stores all the options used for the command. */
    private subcommands: Map<string, Subcommand>;

    /**
     * Construct the object and set it up internally
     * @param subcommands The list of subcommands kept by the group. It requires at least 1.
     * @throws Error if the group contains no subcommands.
     */
    constructor(subcommands: Subcommand[]) {
        // Create the options collection and initialize it
        this.subcommands = new Map<string, Subcommand>();

        // Construct the map of subcommands
        if(subcommands.length == 0) {
            throw new Error("Subcommand group requires at least 1 subcommand.");
        }

        // Add the subcommands to the collection
        subcommands.forEach(subcommand => {
            this.subcommands.set(subcommand.getName(), subcommand);
        })
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
    public appendMetadata(optionBase: (SlashCommandBuilder)): void {
        // default result if not overridden
        let metadata: SlashCommandSubcommandGroupBuilder = new SlashCommandSubcommandGroupBuilder();
        metadata.setName(this.getName());
        metadata.setNameLocalizations(this.getNameLocalizations());
        metadata.setDescription(this.getDescription());
        metadata.setDescriptionLocalizations(this.getDescriptionLocalizations());
        // Add the metadata for all the subcommands
        this.subcommands.values().forEach(subcommand => {
            subcommand.appendMetadata(metadata);
        })
        // Add the data back to the options base
        optionBase.addSubcommandGroup(metadata);
    }

    /**
     * Returns autocomplete choice data for the subcommand element or undefined if there is none.
     * @param interaction The interaction to get the autocomplete data for.
     * @returns The autocomplete data for the interaction option or undefined if there is none.
     */
    public async autocomplete(interaction: AutocompleteInteraction): Promise<ApplicationCommandOptionChoiceData[] | undefined> {
        // Return the autocomplete from the proper subcommand
        let subcommand = this.subcommands.get(interaction.options.getSubcommand());
        if(subcommand) {
            return subcommand.autocomplete(interaction);
        }
        // if there is no subcommand found, return undefined
        return undefined;
    }

    /**
     * This function will execute whatever the subcommand element does when it is called.
     * @param client The Discord client to run any commands to interact with Discord.
     * @param interaction The interaction causing the command to be triggered.
     * @param data The data related to the event, passed in from the EventDataService.
     */
    public async execute(client: Client, interaction: ChatInputCommandInteraction, data: EventData): Promise<void> {
        // Run the execution from the proper subcommand
        let subcommand = this.subcommands.get(interaction.options.getSubcommand());
        if(subcommand) {
            return subcommand.execute(client, interaction, data);
        }
    }
}