import type { APIApplicationCommandOptionChoice, ApplicationCommandOptionBase, AutocompleteInteraction } from "discord.js";

/**
 * This interface contains methods common to Autocomplete commands.
 */
export interface AutocompleteOption extends ApplicationCommandOptionBase {
    /**
     * This is the method used to get the the choices for an autocomplete interaction.
     * @param interaction The autocomplete interaction that choices need to be responded to.
     */
    getAutocompleteChoices(interaction: AutocompleteInteraction): Promise<APIApplicationCommandOptionChoice[]>;
}
