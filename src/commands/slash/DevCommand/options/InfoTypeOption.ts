import { AutocompleteInteraction, SlashCommandStringOption, type APIApplicationCommandOptionChoice } from "discord.js";
import { AutocompletableOption } from "../../AutocompletableOption";

/**
 * This enum establishes a common set of values that could be returned from the choices
 */
export enum DevInfoChoices {
    ALL = "all",
    SYSTEM = "system",
    ENVIRONMENT = "environment",
    BOT = "bot"
};

/**
 * This class is used as an option class for the
 */
export class InfoTypeOption extends AutocompletableOption<SlashCommandStringOption> {
    /**
     * This is used to the option data for the option itself. Note: `.setAutocomplete()` does not need to 
     * be specified here. If it's not specified, it will set it to when creating the command metadata. It can 
     * be set here if wanted, or set to false if the autocomplete is desired to not be run.
     */
    public getOptionData(): SlashCommandStringOption {
        let optionData = new SlashCommandStringOption()
            // Note: name MUST be all lowercase letters
            .setName("infotype") //Lang.getRef('arguments.command', Language.Default)
            // .setName_localizations() //Lang.getRefLocalizationMap('arguments.command')
            .setDescription("Get the specific type of information") //Lang.getRef('argDescs.devCommand', Language.Default)
            // .setDescriptionLocalizations() // Lang.getRefLocalizationMap('argDescs.devCommand')
            .setRequired(true) // whether or not it's required
            .setAutocomplete(true)
        return optionData
    }
    /**
     * This is the method used to get the the choices for an autocomplete interaction.
     * @param interaction The autocomplete interaction that choices need to be responded to.
     */
    // public async getChoices(interaction: AutocompleteInteraction): Promise<APIApplicationCommandOptionChoice[]> {
    public async getChoices(interaction: AutocompleteInteraction): Promise<APIApplicationCommandOptionChoice<DevInfoChoices>[]> {
        const focusedOption = interaction.options.getFocused(true);
       let choices = [
            {name: "All", value: DevInfoChoices.ALL},
            {name: "System", value: DevInfoChoices.SYSTEM},
            {name: "Environment", value: DevInfoChoices.ENVIRONMENT},
            {name: "Bot", value: DevInfoChoices.BOT}
        ];
        // Get the ones that are closest to what's typed already
        return choices.filter(choice => choice.value.startsWith(focusedOption.value));
    }
};
