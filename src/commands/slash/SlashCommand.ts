import {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    Client,
    type ApplicationCommandOptionChoiceData,
    type AutocompleteFocusedOption,
    type CommandInteraction,
    type RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord.js';

import { EventData } from '../../models/eventData';
import type { Command, CommandDeferType } from '../Command';

/**
 * This class defines the structure of a basic slash command. Compared to other commands, 
 * slash commands also have an AutoComplete part.
 */
export abstract class SlashCommand implements Command {
    /**
     * Returns autocomplete choice data for the command or undefined if there is none.
     * @param interaction The interaction to get the autocomplete data for.
     * @param option The option for the interaction to get the autocomplete data for.
     * @returns The autocomplete data for the interaction option or undefined if there is none.
     */
    abstract autocomplete(interaction: AutocompleteInteraction, option: AutocompleteFocusedOption): Promise<ApplicationCommandOptionChoiceData[] | undefined>;

    /**
     * Returns the names that define the command.
     * @returns the names that define the command.
     */
    abstract getNames(): string[];

    /** 
     * Discord requires a response from a command in 3 seconds or become invalid. If a 
     * response will take longer than that, the response will need to be deferred, sending a 
     * message "<app/bot> is thinking..." as a first response. This gives the response a 15
     * minute window to actually respond.
     * See https://discordjs.guide/slash-commands/response-methods.html#deferred-responses
     * 
     * @returns If the command needs to be deferred, then should return a CommandDeferType. If not, it should return undefined.
     */
    abstract getDeferType(): CommandDeferType | undefined;
    
    /**
     * This method is used to get the metadata for the command.
     * @returns The metadata of the command.
     */
    abstract getMetadata(): RESTPostAPIChatInputApplicationCommandsJSONBody;

    /**
     * This is the method used to check whether or not the command can be run by the user. If the command cannot be 
     * run, a CommandError should be thrown stating the reason it will not run. This error will be returned to 
     * @param interaction The command interaction being run.
     * @throws CommandError if the command is found to be unable to run.
     */
    abstract checkUsability(interaction: CommandInteraction): Promise<void>;

    /**
     * This function will execute whenever the command is called.
     * @param client The Discord client to run any commands to interact with Discord.
     * @param interaction The interaction causing the command to be triggered.
     * @param data The data related to the event, passed in from the EventDataService.
     */
    public async execute(client: Client, interaction: CommandInteraction, data: EventData): Promise<void> {
        await this.executeSlashCommand(client, interaction as ChatInputCommandInteraction, data);
    }

    /**
     * This function will execute whenever the command is called. This uses a chatInputCommandInteraction because the 
     * slash command comes from chat.
     * @param client The Discord client to run any commands to interact with Discord.
     * @param interaction The interaction causing the command to be triggered.
     * @param data The data related to the event, passed in from the EventDataService.
     */
    abstract executeSlashCommand(client: Client, interaction: ChatInputCommandInteraction, data: EventData): Promise<void>;

}
