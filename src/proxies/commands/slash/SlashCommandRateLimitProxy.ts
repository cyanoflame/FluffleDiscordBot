import type { RateLimiterMemory } from "rate-limiter-flexible";
import { SlashCommand } from "../../../commands/slash/SlashCommand";
import { CommandRateLimitProxy } from "../CommandRateLimitProxy";
import type { ApplicationCommandOptionBase, ChatInputCommandInteraction, Client, CommandInteraction, InteractionContextType, LocalizationMap, Permissions, RESTPostAPIApplicationCommandsJSONBody, RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord.js";
import type { CommandDeferType } from "../../../commands/Command";
import type { EventData } from "../../../models/eventData";
import type { AutocompletableOption } from "../../../commands/slash/AutocompletableOption";

/**
 * This proxy class is used to proxy to a SlashCommand to apply a rate limit to it.
 * The Bridge design pattern has been employed for this setup.
 */
export class SlashCommandRateLimitProxy extends SlashCommand {

    /** This is the object used for proxying the command  */
    private commandRateLimitProxy: CommandRateLimitProxy;

    /** The slash command being proxied */
    private commandRef: SlashCommand;

    /**
     * Constructs a rate limit proxy for a Slash Command.
     * @param rateLimiter Either a reference to a rate limiter to use, or an object with the details make a new rate limiter, such that:
     * rateLimitAmount - The amount of requests that can be made within an interval before limiting the rate ; and rateLimitInterval - The 
     * time that a the amount of requests can be made in before triggering a rate limit,
     * @param proxyName The name of the the proxy, used to identify it in logging.
     * @param slashCommand The slash command object that is being rate limited.
     */
    constructor(rateLimiter: {rateLimitAmount: number, rateLimitInterval: number} | RateLimiterMemory, slashCommand: SlashCommand) {
        // Create the SlashCommand object
        super();

        // Store the command
        this.commandRef = slashCommand;

        // Create the rate limiter for the slash command
        this.commandRateLimitProxy = new CommandRateLimitProxy(rateLimiter, slashCommand);
    }

    // Methods common with commands

    /**
     * Returns the name for the command.
     * @returns the name for the command.
     */
    public getName(): string {
        return this.commandRateLimitProxy.getName();
    }

    /**
     * Returns the name localizations for different languages, or null if there is none.
     * @returns LocalizationMap for the name localizations or null if there is none.
     */
    public getNameLocalizations(): LocalizationMap | null {
        return this.commandRateLimitProxy.getNameLocalizations();
    }

    /**
     * Return the contexts that the command can be run in (servers, dms, group dms).
     * @returns the contexts that the command can be run in.
     */
    public getContexts(): InteractionContextType[] {
        return this.commandRateLimitProxy.getContexts();
    }

    /**
     * Get the permissions required to be able to run the command.
     * @returns the permissions required to run the command.
     */
    public getDefaultMemberPermissions(): Permissions | bigint | number | null | undefined {
        return this.commandRateLimitProxy.getDefaultMemberPermissions();
    }

    /**
     * This method is used to get the metadata for the command.
     * @returns The metadata of the command.
     */
    public getMetadata(): RESTPostAPIChatInputApplicationCommandsJSONBody {
        return this.commandRateLimitProxy.getMetadata() as RESTPostAPIChatInputApplicationCommandsJSONBody;
    }

    /** 
     * Discord requires a response from a command in 3 seconds or become invalid. If a 
     * response will take longer than that, the response will need to be deferred, sending a 
     * message "<app/bot> is thinking..." as a first response. This gives the response a 15
     * minute window to actually respond.
     * See https://discordjs.guide/slash-commands/response-methods.html#deferred-responses
     * 
     * @returns If the command needs to be deferred, then should return a CommandDeferType. If not, it should return undefined.
     */
    public getDeferType(): CommandDeferType | undefined {
        return this.commandRateLimitProxy.getDeferType();
    }

    /**
     * This is the method used to check whether or not the command can be run by the user. If the command cannot be 
     * run, a CommandError should be thrown stating the reason it will not run. This error will be returned to 
     * @param interaction The command interaction being run.
     * @throws CommandError if the command is found to be unable to run.
     */
    public checkUsability(interaction: ChatInputCommandInteraction): Promise<void> {
        return this.commandRateLimitProxy.checkUsability(interaction);
    }

    /**
     * Execuite the concrete object like normal. Nothing to do here since rate limiting involved the checks.
     * @param client The Discord client to run any commands to interact with Discord.
     * @param data The data related to the event, passed in from the EventDataService.
     */
    public async execute(client: Client, interaction: ChatInputCommandInteraction, data: EventData): Promise<void> {
        return this.commandRateLimitProxy.execute(client, interaction, data);
    }

    // Method particular to SlashCommands

    /**
     * Returns the description of the command.
     * @returns the description of the command.
     */
    public getDescription(): string {
        return this.commandRef.getDescription();
    }

    /**
     * Returns the description localizations for different languages, or null if there is none.
     * @returns LocalizationMap for the description localizations or null if there is none.
     */
    public getDescriptionLocalizations(): LocalizationMap | null {
        return this.commandRef.getDescriptionLocalizations();
    }

    /**
     * Whether or not the command handles nsfw things. If this is true, it can only be used in channels/places where nsfw content 
     * has been enabled.
     * @returns whether or not the command handles nsfw things.
     */
    public getIsNSFW(): boolean {
        return this.commandRef.getIsNSFW();
    }

    /**
     * Returns a list of options for the command. If the options are autocomplete options, they should be added 
     * here as well.
     * @returns list of the options for the command, both autofill and not.
     */
    public getOptions(): (ApplicationCommandOptionBase | AutocompletableOption<ApplicationCommandOptionBase>)[] {
        return this.commandRef.getOptions();
    }
};
