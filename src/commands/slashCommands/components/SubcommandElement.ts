import type { ApplicationCommandOptionChoiceData, AutocompleteInteraction, ChatInputCommandInteraction, Client, LocalizationMap } from "discord.js";
import type { EventData } from "../../../models/eventData";

/**
 * This class is used to abstract Subcommands and SubcommandGroups so that they can fit in the same collection.
 * A Subcommand will have something to execute these options, and a SubcommandGroup will always have at least 
 * one Subcommand as a part of its collection which it can propagate the functionality to.
 */
export interface SubcommandElement {
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
     * Returns the description of the command.
     * @returns the description of the command.
     */
    getDescription(): string;

    /**
     * Returns the description localizations for different languages, or null if there is none.
     * @returns LocalizationMap for the description localizations or null if there is none.
     */
    getDescriptionLocalizations(): LocalizationMap | null;

    /**
     * Returns autocomplete choice data for the subcommand element or undefined if there is none.
     * @param interaction The interaction to get the autocomplete data for.
     * @returns The autocomplete data for the interaction option or undefined if there is none.
     */
    autocomplete(interaction: AutocompleteInteraction): Promise<ApplicationCommandOptionChoiceData[] | undefined>;

    /**
     * This function will execute whatever the subcommadn element does when it is called.
     * @param client The Discord client to run any commands to interact with Discord.
     * @param interaction The interaction causing the command to be triggered.
     * @param data The data related to the event, passed in from the EventDataService.
     */
    execute(client: Client, interaction: ChatInputCommandInteraction, data: EventData): Promise<void>;
}
