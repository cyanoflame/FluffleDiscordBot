import type { ApplicationCommandOptionBase, ApplicationCommandOptionChoiceData, AutocompleteInteraction, ChatInputCommandInteraction, Client, InteractionContextType, LocalizationMap, Permissions, RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord.js";
import type { Command, CommandDeferType } from "../Command";
import type { EventData } from "../../models/eventData";
import type { AutocompleteOption } from "./components/AutocompleteOption";

/**
 * This is the interface used by all slash commands.
 */
export interface SlashCommand extends Command {
    /**
     * Returns the name for the command.
     * @returns the name for the command.
     */
    getName(): string;

    /**
     * Returns the name localizations for different languages, or null if there is none.
     * @returns LocalizationMap for the name localizations or null if there is none.
     */
    getNameLocalizations(): LocalizationMap | null;

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
     * Return the contexts that the command can be run in (servers, dms, group dms).
     * @returns the contexts that the command can be run in.
     */
    getContexts(): InteractionContextType[];

    /**
     * Get the permissions required to be able to run the command.
     * @returns the permissions required to run the command.
     */
    getDefaultMemberPermissions(): Permissions | bigint | number | null | undefined;

    /**
     * Whether or not the command handles nsfw things. If this is true, it can only be used in channels/places where nsfw content 
     * has been enabled.
     * @returns whether or not the command handles nsfw things.
     */
    getIsNSFW(): boolean;

    /**
     * Returns a list of options for the command. If the options are autocomplete options, they should be added 
     * here as well.
     * @returns list of the options for the command, both autofill and not.
     */
    getOptions(): (ApplicationCommandOptionBase | AutocompleteOption)[];

    /**
     * This method is used to get the full metadata for the command.
     * @returns The metadata of the command.
     */
    getMetadata(): RESTPostAPIChatInputApplicationCommandsJSONBody;

    /**
     * Returns autocomplete choice data for the command or undefined if there is none.
     * @param interaction The interaction to get the autocomplete data for.
     * @returns The autocomplete data for the interaction option or undefined if there is none.
     */
    autocomplete(interaction: AutocompleteInteraction): Promise<ApplicationCommandOptionChoiceData[] | undefined>;

    /** 
     * Discord requires a response from a command in 3 seconds or become invalid. If a 
     * response will take longer than that, the response will need to be deferred, sending a 
     * message "<app/bot> is thinking..." as a first response. This gives the response a 15
     * minute window to actually respond.
     * See https://discordjs.guide/slash-commands/response-methods.html#deferred-responses
     * 
     * @returns If the command needs to be deferred, then should return a CommandDeferType. If not, it should return undefined.
     */
    getDeferType(): CommandDeferType | undefined;

    /**
     * This is the method used to check whether or not the command can be run by the user. If the command cannot be 
     * run, a CommandError should be thrown stating the reason it will not run. This error will be returned to 
     * @param interaction The command interaction being run.
     * @throws CommandError if the command is found to be unable to run.
     */
    checkUsability(interaction: ChatInputCommandInteraction): Promise<void>;

    /**
     * This function will execute whenever the command is called.
     * @param client The Discord client to run any commands to interact with Discord.
     * @param interaction The interaction causing the command to be triggered.
     * @param data The data related to the event, passed in from the EventDataService.
     */
    execute(client: Client, interaction: ChatInputCommandInteraction, data: EventData): Promise<void>
}
