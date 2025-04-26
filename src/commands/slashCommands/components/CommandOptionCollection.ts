import { ApplicationCommandOptionBase, SlashCommandAttachmentOption, SlashCommandBooleanOption, SlashCommandBuilder, SlashCommandChannelOption, SlashCommandIntegerOption, SlashCommandMentionableOption, SlashCommandNumberOption, SlashCommandRoleOption, SlashCommandStringOption, SlashCommandSubcommandBuilder, SlashCommandUserOption, type ApplicationCommandOptionChoiceData, type AutocompleteInteraction } from "discord.js";
import type { AutocompleteOption } from "./autocomplete/AutocompleteOption";

/**
 * This class is used to store a collection of command options and deal with them and their autocompletes. It is 
 * primarily implemented by slash commands and subcommands.
 */
export class CommandOptionCollection {

    /** This stores the functions to get the autocomplete options */
    private autocompleteOptions: Map<string, AutocompleteOption>;
    /** This stores all the options kept in the collection -- SWITCH TO ARRAY + SET IF OPTION ORDER BECOMES AN ISSUE */
    private options: Map<string, ApplicationCommandOptionBase>;

    /**
     * This constructor creates everything needed for the collection.
     * @param options The options to add to the collection initially if desired.
     * @throws RangeError if options are added initially, and two or more share the same name.
     */
    constructor(options?: (ApplicationCommandOptionBase | AutocompleteOption)[]) {
        this.autocompleteOptions = new Map<string, AutocompleteOption>();
        this.options = new Map<string, ApplicationCommandOptionBase>;

        // Add options to the collection initially if they're included
        if(options) {
            this.addAmbiguousOptions(options);
        }
    }

    /**
     * This method is used to add many ambiguous options to the collection at one time. If there are any
     * commands sharing the same name, a RangeError will be thrown.
     * @param options The options to add to the collection.
     * @throws RangeError a range error is thrown if any of the commands share the same name.
     */
    public addAmbiguousOptions(options: (ApplicationCommandOptionBase | AutocompleteOption)[]): void {
        options.forEach(option => {
            this.addAmbiguousOption(option);
        });
    }

    /**
     * This is a private helper method used to add an option to the collection, It discerns the option types 
     * and adds them to the proper part of the collection.
     * @param options The options being added to the collection initially
     */
    public addAmbiguousOption(option: (ApplicationCommandOptionBase | AutocompleteOption)): boolean {
        if(typeof (option as any).getAutocompleteChoices == "function") {
            return this.addAutocompleteOption(option as AutocompleteOption);
        } else {
            return this.addOption(option as ApplicationCommandOptionBase);
        }
    }
    
    /**
     * Used to retrieve a list of all the options in the collection.
     * @returns a list of all the options in the collection.
     */
    public getOptions(): ApplicationCommandOptionBase[] {
        let optionsData: ApplicationCommandOptionBase[] = [];
        this.options.forEach(option => {
            optionsData.push(option);
        })
        return optionsData;
    }

    /**
     * This method adds all the options in the collection to the CommandBuilder passed into it.
     * @param optionBase The builder the options are getting added to.
     */
    public appendOptionsData(optionBase: SlashCommandBuilder | SlashCommandSubcommandBuilder): void {
        // for every option in the collection
        for(const option of this.options.values()) {
            // Check against any of the option types and add the option in
            if(option instanceof SlashCommandStringOption) {
                optionBase.addStringOption(option);
            } else
            if(option instanceof SlashCommandIntegerOption) {
                optionBase.addIntegerOption(option);
            } else
            if(option instanceof SlashCommandNumberOption) {
                optionBase.addNumberOption(option);
            } else
            if(option instanceof SlashCommandBooleanOption) {
                optionBase.addBooleanOption(option);
            } else
            if(option instanceof SlashCommandUserOption) {
                optionBase.addUserOption(option);
            } else
            if(option instanceof SlashCommandRoleOption) {
                optionBase.addRoleOption(option);
            } else
            if(option instanceof SlashCommandChannelOption) {
                optionBase.addChannelOption(option);
            } else
            if(option instanceof SlashCommandMentionableOption) {
                optionBase.addMentionableOption(option);
            } 
            if(option instanceof SlashCommandAttachmentOption) {
                optionBase.addAttachmentOption(option);
            } 
        }
    }

    /**
     * Private helper method used to check whether or not an option can be added to the collection.
     * Multiple options in a command cannot have the same option name.
     * @param option The option to potentially add to the collection.
     * @returns Whether or not the new option can be added to the collection.
     */
    private canAddOption(option: ApplicationCommandOptionBase): boolean {
        return !this.options.has(option.name);
    }

    /**
     * This method adds a new autocomplete method to the collection. This method
     * @param option The new autocomplete option to add to the collection.
     */
    public addAutocompleteOption(option: AutocompleteOption): boolean {
        // Add it to the normal list of options if it can
        if(this.addOption(option)) {
            // Add the autocomplete option to the autocomplete parameter map
            this.autocompleteOptions.set(option.name, option);
            return true;
        }
        return false;
    }

    /**
     * This method is used to add a new option to the collection.
     * @param option The option being added to the collection.
     * @returns Whether or not the option was added successfully to the collection.
     */
    public addOption(option: ApplicationCommandOptionBase): boolean {
        // check if it can be added first before adding
        if(this.canAddOption(option)) {
            this.options.set(option.name, option);
            return true;
        }
        return false;
    }

    /**
     * Returns the option at the option name or undefined if the option does not have a name.
     * @param optionName the name of the option to get from the collection.
     * @returns The option from the collection or undefined if it is not in the collection.
     */
    public getOption(optionName: string): ApplicationCommandOptionBase | undefined  {
        return this.options.get(optionName);
    }

    /**
     * Deletes the option from the collection if it exists in it.
     * @param optionName the name of the option to remove from the collection.
     * @returns Whether or not the option was successfully removed from the collection.
     */
    public removeOption(optionName: string): boolean {
        if(this.options.delete(optionName)) {
            // delete it if it's also in the autocomplete options as well
            this.autocompleteOptions.delete(optionName);
            return true;
        }
        return false;
    }

    /**
     * Returns autocomplete choice data for the command or undefined if there is none.
     * @param interaction The interaction to get the autocomplete data for.
     * @returns The autocomplete data for the interaction option or undefined if there is none.
     */
    public async autocomplete(interaction: AutocompleteInteraction): Promise<ApplicationCommandOptionChoiceData[] | undefined> {
        // Get the potential options for a command to be autocompleted
        let option = interaction.options.getFocused(true);
        // Check the map to see if there's an autocomplete for the option
        let autocompleteOption = this.autocompleteOptions.get(option.name);
        // if there is one to be autocomplete
        if(autocompleteOption) {
            // run the method to get the choices
            return autocompleteOption.getAutocompleteChoices(interaction);
        }
        // otherwise no autocomplete data to return
        return undefined;
    }
}
