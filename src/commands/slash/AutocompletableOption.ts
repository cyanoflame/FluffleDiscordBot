import { ApplicationCommandOptionBase, type APIApplicationCommandOptionChoice, type AutocompleteInteraction } from "discord.js";

/**
 * This class is used to establish an basis for a class with an autocomplete command. This is used to 
 * link the autocomplete function/results with the function so that it can fill them in. Outside of autocomplete,
 * this class should not be used for specific commands.
 * 
 * Note: ALL autocompletes MUST finish/respond within 3 SECONDS. They are not deferrable. If you are struggling for this,
 * perhaps utilizing a local cache would help.
 */
export abstract class AutocompletableOption<T extends ApplicationCommandOptionBase> {
    /**
     * This is used to the option data for the option itself. Note: `.setAutocomplete()` does not need to 
     * be specified here. If it's not specified, it will set it to when creating the command metadata. It can 
     * be set here if wanted, or set to false if the autocomplete is desired to not be run.
     */
    abstract getOptionData(): T;
    /**
     * This is the method used to get the the choices for an autocomplete interaction.
     * @param interaction The autocomplete interaction that choices need to be responded to.
     */
    abstract getChoices(interaction: AutocompleteInteraction): Promise<APIApplicationCommandOptionChoice[]>;
}
