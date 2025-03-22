import type {
    ApplicationCommandOptionChoiceData,
    AutocompleteFocusedOption,
    AutocompleteInteraction,
    CommandInteraction,
    PermissionsString,
} from 'discord.js';

import { RateLimiter } from 'discord.js-rate-limiter';

import { EventData } from '../models/internal-models.js';

/**
 * This class defines the structure of a basic slash command.
 */
export interface Command {
    names: string[];

    deferType: CommandDeferType;

    requireClientPerms: PermissionsString[];

    autocomplete?(
        intr: AutocompleteInteraction,
        option: AutocompleteFocusedOption
    ): Promise<ApplicationCommandOptionChoiceData[]>;

    execute(intr: CommandInteraction, data: EventData): Promise<void>;
}

export enum CommandDeferType {
    PUBLIC = 'PUBLIC',
    HIDDEN = 'HIDDEN',
    NONE = 'NONE',
}
