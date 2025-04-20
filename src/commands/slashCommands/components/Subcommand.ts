import type { SubcommandElement } from "./SubcommandElement";
import type { ApplicationCommandOptionBase, ApplicationCommandOptionChoiceData, AutocompleteInteraction, ChatInputCommandInteraction, Client, LocalizationMap } from "discord.js";
import type { EventData } from "../../../models/eventData";

export abstract class Subcommand implements SubcommandElement {

    constructor() {
        //
    }

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
     * Returns autocomplete choice data for the subcommand element or undefined if there is none.
     * @param interaction The interaction to get the autocomplete data for.
     * @returns The autocomplete data for the interaction option or undefined if there is none.
     */
    abstract autocomplete(interaction: AutocompleteInteraction): Promise<ApplicationCommandOptionChoiceData[] | undefined>;

    /**
     * This function will execute whatever the subcommadn element does when it is called.
     * @param client The Discord client to run any commands to interact with Discord.
     * @param interaction The interaction causing the command to be triggered.
     * @param data The data related to the event, passed in from the EventDataService.
     */
    abstract execute(client: Client, interaction: ChatInputCommandInteraction, data: EventData): Promise<void>;

    // /**
    //  * Returns a list of options for the subcommand. If the options are autocomplete options, they should be added 
    //  * here as well.
    //  * @returns list of the options for the command, both autofill and not.
    //  */
    // abstract getOptions(): (ApplicationCommandOptionBase | AutocompletableOption<ApplicationCommandOptionBase>)[];
}
