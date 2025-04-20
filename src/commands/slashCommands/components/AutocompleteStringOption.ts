import { AutocompleteInteraction, SlashCommandStringOption, type APIApplicationCommandOptionChoice } from "discord.js";
import type { AutocompleteOption } from "./AutocompleteOption";

/**
 * This class is inteded to be extended when a user needs to create an string option that has autocomplete functionality.
 */
export class AutocompleteStringOption extends SlashCommandStringOption implements AutocompleteOption {
    /** This is the function used to get the choices for the autocomplete if it is set. It will not be used if any hard choices are set. */
    private choiceFunction: ((interaction: AutocompleteInteraction) => Promise<APIApplicationCommandOptionChoice[]>) | undefined;

    /**
     * This creates the autocomplete string option. It automatically sets the autocomplete option to true.
     */
    constructor() {
        super();
        // This autocomplete choices function has not been set
        this.choiceFunction = undefined;
    }

    // /**
    //  * This method is overridden from the parent class to force that either choices are set, or an autocomplete function is set.
    //  * @param choices The choices to set.
    //  * @returns 
    //  */
    // public override setChoices<Input extends APIApplicationCommandOptionChoice<number>>(...choices: RestOrArray<Input>): this {
    //     // if the autocomplete choices function has been specified, delete it
    //     if(this.choiceFunction) {
    //         this.choiceFunction = undefined;
    //     }
    //     // Set the choices via the super command
    //     return super.setChoices(...choices);
    // }

    /**
     * Set the function to get the choices for the autocomplete.
     * @param choiceFunction The function tused to get the autocomplete choices.
     * @returns returns this object to keep it following a builder structure.
     */
    public setAutocompleteChoiceFunction(choiceFunction: ((interaction: AutocompleteInteraction) => Promise<APIApplicationCommandOptionChoice[]>)): this {
        this.choiceFunction = choiceFunction;
        return this;
    }

    /**
     * This is the method returns autocomplete choices for the option.
     * @param interaction The autocomplete interaction to get choices for.
     */
    public async getAutocompleteChoices(interaction: AutocompleteInteraction): Promise<APIApplicationCommandOptionChoice[]> {
        // if(this.choices && this.choices > 0)
        if(this.choiceFunction) {
            return this.choiceFunction(interaction);
        }
        // nothing since the function was not established
        return [];
    }
}

