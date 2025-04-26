import type { APIApplicationCommandOptionChoice, AutocompleteInteraction } from "discord.js";
import { AutocompleteStringOption } from "../../../components/autocomplete/AutocompleteStringOption";
import { DevInfoChoice } from "../DevChoicesEnum";

/**
 * This is the method used to get the the choices for an autocomplete interaction.
 * @param interaction The autocomplete interaction that choices need to be responded to.
 */
// public async getChoices(interaction: AutocompleteInteraction): Promise<APIApplicationCommandOptionChoice[]> {
async function infoTypeAutocompleteFunction(interaction: AutocompleteInteraction): Promise<APIApplicationCommandOptionChoice<DevInfoChoice>[]> {
    const focusedOption = interaction.options.getFocused(true);
    let choices = [
        {name: "all", value: DevInfoChoice.ALL},
        {name: "system", value: DevInfoChoice.SYSTEM},
        {name: "environment", value: DevInfoChoice.ENVIRONMENT},
        {name: "bot", value: DevInfoChoice.BOT}
    ];
    // Get the ones that are closest to what's typed already
    return choices.filter(choice => choice.value.startsWith(focusedOption.value));
}

/**
 * This is the infotype option used in the dev command. It is used to select different types
 * of options to get.
 */
export const infotypeOption = new AutocompleteStringOption()
    .setName("infotype")
    .setDescription("Get the specific type of information")
    .setRequired(true)
    .setAutocompleteChoiceFunction(infoTypeAutocompleteFunction)
