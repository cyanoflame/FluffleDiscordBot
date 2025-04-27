import { Client, CommandInteraction, InteractionCallbackResponse, InteractionContextType, InteractionResponse, Message, MessagePayload, type BooleanCache, type InteractionReplyOptions, type LocalizationMap, type Permissions, type RESTPostAPIApplicationCommandsJSONBody } from "discord.js";
import { type Command } from "./Command";
import { CommandDeferType } from "./CommandDeferType";
import type { EventData } from "../models/eventData";

/**
 * This is the abstract class that holds basic command functionality across all commands/command types.
 * It should only be extended for a new command TYPE. New commands should extend an abstract version of 
 * their respective types.
 */
export abstract class AbstractCommand implements Command {
    /**
     * Returns the name for the command.
     * @returns the name for the command.
     */
    abstract getName(): string;

    /**
     * Returns the name localizations for different languages, or null if there is none.
     * @returns LocalizationMap for the name localizations or null if there is none.
     */
    public getNameLocalizations(): LocalizationMap | null {
        // default result if not overridden
        return null;
    }

    /**
     * Returns the description of the command.
     * @returns the description of the command.
     */
    public getDescription(): string {
        // default result if not overridden
        return "";
    }

    /**
     * Returns the description localizations for different languages, or null if there is none.
     * @returns LocalizationMap for the description localizations or null if there is none.
     */
    public getDescriptionLocalizations(): LocalizationMap | null {
        // default result if not overridden
        return null;
    }

    /**
     * Return the contexts that the command can be run in (servers, dms, group dms).
     * @returns the contexts that the command can be run in.
     */
    public getContexts(): InteractionContextType[] {
        // default result if not overridden
        return [
            InteractionContextType.BotDM,
            InteractionContextType.Guild,
            InteractionContextType.PrivateChannel
        ];
    }

    /**
     * Get the permissions required to be able to run the command.
     * @returns the permissions required to run the command.
     */
    public getDefaultMemberPermissions(): Permissions | bigint | number | null | undefined {
        // default result if not overridden
        return undefined;
    }

    /**
     * This method is used to get the full metadata for the command. Note: there is a character 
     * limit to the amount of things that can be used: 
     * https://discord.com/developers/docs/interactions/application-commands#slash-commands
     * @returns The metadata of the command.
     */
    abstract getMetadata(): RESTPostAPIApplicationCommandsJSONBody;

    /** 
     * Discord requires a response from a command in 3 seconds or become invalid. If a 
     * response will take longer than that, the response will need to be deferred, sending a 
     * message "<app/bot> is thinking..." as a first response. This gives the response a 15
     * minute window to actually respond.
     * 
     * If using HIDDEN or PUBLIC, the interaction must be responded to with interaction.followUp()
     * If using NONE, the interaction must be responded to with interaction.followUp()
     * 
     * See https://discordjs.guide/slash-commands/response-methods.html#deferred-responses
     * 
     * @returns If the command needs to be deferred, then should return a CommandDeferType.
     */
    public getDeferType(): CommandDeferType {
        // defaults to NONE if not overridden
        return CommandDeferType.NONE;
    }

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
    abstract execute(client: Client, interaction: CommandInteraction, data: EventData): Promise<void>;

    // The commandwas decided to be unused because subcommands dont have access. The best place implement this would 
    // be as part of CommandInteraction / Interaction class, which would be annoying to extend all the different
    // variations of just to include the command. So, I'm leaving it up to the dev to make sure they use 
    // interaction.followUp() vs interaction.reply() properly.
    // /**
    //  * This is a helper method used to send replies and follow-ups back regardless of a response's defer state.
    //  * @param interaction The interaction the message is being sent to.
    //  * @param options The data being sent/replied with. 
    //  * @retun The response from the follow up.
    //  */
    // protected sendResponse(interaction: CommandInteraction, 
    //     options: string | MessagePayload | InteractionReplyOptions 
    //     | InteractionReplyOptions & { withResponse: true } 
    //     | InteractionReplyOptions & { fetchReply: true }): 
    //     Promise<InteractionResponse> | Promise<InteractionCallbackResponse> | Promise<Message>
    // {
    //     if(!interaction.deferred && !interaction.replied) {
    //         return interaction.reply(options);
    //     } else {
    //         return interaction.followUp(options);
    //     }
    // }
}
