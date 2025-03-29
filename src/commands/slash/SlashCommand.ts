// commands/Command.ts
import type {
    ApplicationCommandOptionChoiceData,
    AutocompleteFocusedOption,
    AutocompleteInteraction,
} from 'discord.js';

import type { Command } from '../Command';

/**
 * This class defines the structure of a basic slash command. Compared to other commands, 
 * slash commands also have an AutoComplete part.
 */
export interface SlashCommand extends Command {

    /**
     * Returns autocomplete choice data for the command or undefined if there is none.
     * @param interaction The interaction to get the autocomplete data for.
     * @param option The option for the interaction to get the autocomplete data for.
     * @returns The autocomplete data for the interaction option or undefined if there is none.
     */
    autocomplete(interaction: AutocompleteInteraction, 
        option: AutocompleteFocusedOption
    ): Promise<ApplicationCommandOptionChoiceData[] | undefined>;

}
