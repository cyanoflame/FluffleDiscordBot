import type { Command, CommandDeferType } from '../../commands/Command'
import type { Client, CommandInteraction, Interaction, InteractionContextType, LocalizationMap, Message, Permissions, RESTPostAPIApplicationCommandsJSONBody, RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord.js'
import type { EventData } from '../../models/eventData'
import { Logger } from '../../services/logger'

import LogMessageTemplates from "../../../lang/logMessageTemplates.json"
import { CommandError } from '../../commands/CommandError'
import { RateLimitProxy } from '../RateLimitProxy'
import type { RateLimiterMemory } from 'rate-limiter-flexible'

/**
 * This class is an public proxy class used to create rate limiter proxies for commands. If looking to proxy a command, please see {
 * return this.command.This();}
 * SlashCommandRateLimitProxy for adding a rate limiters to any slash commands, MessageCommandRateLimitProxy for adding a rate limiter 
 * to any message commands, and UserCommandRateLimitProxy for adding a rate limiter to any user commands.
 */
export class CommandRateLimitProxy extends RateLimitProxy implements Command {

    /** The reference to the proxied object */
    private command: Command

    /**
     * Constructs the proxy.
     * @param rateLimiter Either a reference to a rate limiter to use, or an object with the details make a new rate limiter, such that:
     * rateLimitAmount - The amount of requests that can be made within an interval before limiting the rate ; and rateLimitInterval - The 
     * time that a the amount of requests can be made in before triggering a rate limit,
     * @param command The command object that is being rate limited.
     */
    constructor(rateLimiter: {rateLimitAmount: number, rateLimitInterval: number} | RateLimiterMemory, command: Command) {
        // Construct the rate limiter
        super(rateLimiter);

        // Store the reference to the proxied object
        this.command = command
    }

    /**
     * Returns the name for the command.
     * @returns the name for the command.
     */
    public getName(): string {
        return this.command.getName();
    }

    /**
     * Returns the name localizations for different languages, or null if there is none.
     * @returns LocalizationMap for the name localizations or null if there is none.
     */
    public getNameLocalizations(): LocalizationMap | null {
        return this.command.getNameLocalizations();
    }

    /**
     * Return the contexts that the command can be run in (servers, dms, group dms).
     * @returns the contexts that the command can be run in.
     */
    public getContexts(): InteractionContextType[] {
        return this.command.getContexts();
    }

    /**
     * Get the permissions required to be able to run the command.
     * @returns the permissions required to run the command.
     */
    public getDefaultMemberPermissions(): Permissions | bigint | number | null | undefined {
        return this.command.getDefaultMemberPermissions();
    }

    /**
     * This method is used to get the metadata for the command.
     * @returns The metadata of the command.
     */
    public getMetadata(): RESTPostAPIApplicationCommandsJSONBody {
        return this.command.getMetadata();
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
        return this.command.getDeferType();
    }

    /**
     * This method will perform the check for the rate limit. If it succeeds, then it will
     * @param msg The message causing the trigger.
     */
    public async checkUsability(interaction: CommandInteraction): Promise<void> {
        // Check before if there's anything else stopping it from running
        this.command.checkUsability(interaction);

        // if the trigger is valid, then check for the rate limit
        if(await this.incrementAndCheckRateLimit(interaction.client.user.id)) {
            // log the rate limit hit
            Logger.error(LogMessageTemplates.error.userCommandRateLimit
                .replaceAll('{USER_TAG}', interaction.client.user.tag)
                .replaceAll('{USER_ID}', interaction.client.user.id)
                .replaceAll('{COMMAND_NAME}', this.getName())
            )

            // if the user is rate limited, do NOT execute the trigger
            // Throw an error because the user permissions didn't match
            throw new CommandError(
                // TODO: Language support for this
                `You can only run this command ${this.getRateLimitAmount()} time(s) every ${this.getRateLimitInterval()} second(s). Please wait before attempting this command again.`
            )
        }
    }

    /**
     * Execuite the concrete object like normal. Nothing to do here since rate limiting involved the checks.
     * @param client The Discord client to run any commands to interact with Discord.
     * @param data The data related to the event, passed in from the EventDataService.
     */
    public async execute(client: Client, interaction: CommandInteraction, data: EventData): Promise<void> {
        await this.command.execute(client, interaction, data);
    }

}
