import type { ApplicationCommandOptionBase, ApplicationCommandOptionChoiceData, AutocompleteInteraction, ChatInputCommandInteraction, Client, InteractionContextType, LocalizationMap, Permissions, RESTPostAPIChatInputApplicationCommandsJSONBody, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder } from "discord.js";
import type { Command } from "../Command";
import type { EventData } from "../../models/eventData";
import type { AutocompleteOption } from "./components/autocomplete/AutocompleteOption";
import type { SubcommandElement } from "./components/SubcommandElement";

/**
 * This is the interface used by all slash commands.
 */
export interface SlashCommand extends Command {
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
     * Whether or not the command handles nsfw things. If this is true, it can only be used in channels/places where nsfw content 
     * has been enabled.
     * @returns whether or not the command handles nsfw things.
     */
    getIsNSFW(): boolean;

    /**
     * 'Arguments' is a superset of 'options' that also includes subcommands as a part of them. This
     * returns a list of options for the command. These options could also be SUBCOMMAND GROUPS and 
     * SUBCOMMANDS, as they are all considered different options in the command.
     * Options can be constructed normally through their builders. If autocomplete is desired for an 
     * option, an Autocomplete option could also be used. Subcommands each have their own isolated 
     * execution in addition to the main command execution to make it easier to split/reference them.
     * @returns list of the options for the command, both autofill and not.
     */
    getArguments(): (ApplicationCommandOptionBase | AutocompleteOption | SlashCommandSubcommandBuilder | SlashCommandSubcommandGroupBuilder | SubcommandElement)[];

    /**
     * Returns autocomplete choice data for the command or undefined if there is none.
     * @param interaction The interaction to get the autocomplete data for.
     * @returns The autocomplete data for the interaction option or undefined if there is none.
     */
    autocomplete(interaction: AutocompleteInteraction): Promise<ApplicationCommandOptionChoiceData[] | undefined>;
}
