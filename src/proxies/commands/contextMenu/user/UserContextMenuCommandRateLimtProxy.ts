import type { LocalizationMap, InteractionContextType, Permissions, ApplicationIntegrationType, Client, UserContextMenuCommandInteraction } from "discord.js";
import type { EventData } from "../../../../models/eventData";
import { RateLimiter } from "../../../../utils/RateLimiter";
import type { RateLimiterAbstract } from "rate-limiter-flexible";
import { Logger } from '../../../../services/logger'
import LogMessageTemplates from "../../../../../lang/logMessageTemplates.json"
import { CommandError } from '../../../../commands/CommandError'
import { UserContextMenuCommand } from "../../../../commands/contextMenuCommands/user/UserContextMenuCommand";
import type { CommandDeferType } from "../../../../commands/CommandDeferType";

/**
 * This proxy class is used to proxy to a UserContextMenuCommand to apply a rate limit to one when it needs to execute.
 */
export class UserContextMenuCommandRateLimitProxy extends UserContextMenuCommand {
    
    /** The rate limiter used for the class */
    private rateLimiter: RateLimiter;

    /** The slash command being proxied */
    private command: UserContextMenuCommand;

    /**
     * Constructs a rate limit proxy for a UserContextMenu Command.
     * @param rateLimiter Either a reference to a rate limiter to use, or an object with the details make a new rate limiter, such that:
     * rateLimitAmount - The amount of requests that can be made within an interval before limiting the rate ; and rateLimitInterval - The 
     * time that a the amount of requests can be made in before triggering a rate limit,
     * @param command The user context menu command object that is being rate limited.
     */
    constructor(rateLimiter: {rateLimitAmount: number, rateLimitInterval: number} | RateLimiterAbstract, command: UserContextMenuCommand) {
        // Create the SlashCommand object
        super();

        // Create the rate limiter
        this.rateLimiter = new RateLimiter(rateLimiter);

        // Store the command
        this.command = command;
    }

    /**
     * Returns the proxied command's name.
     * @returns the proxied command's name.
     */
    public override getName(): string {
        return this.command.getName();
    }

    /**
     * Returns the proxied command's name localizations.
     * @returns the proxied command's name localizations.
     */
    public override getNameLocalizations(): LocalizationMap | null {
        return this.command.getNameLocalizations();
    }

    /**
     * Return the proxied command's contexts.
     * @returns the proxied command's contexts.
     */
    public override getContexts(): InteractionContextType[] {
        return this.command.getContexts();
    }

    /**
     * Get the proxied command's default member permissions.
     * @returns the proxied commands default member permissions.
     */
    public override getDefaultMemberPermissions(): Permissions | bigint | number | null | undefined {
        return this.command.getDefaultMemberPermissions();
    }

    /**
     * Returns the proxied command's integration type.
     * @returns the proxied command's integration type.
     */
    public override getIntegrationTypes(): ApplicationIntegrationType[] {
        throw new Error("Method not implemented.");
    }
    
    /** 
     * Returns the proxied command's defer type.
     * @returns the proxied command's defer type.
     */
    public override getDeferType(): CommandDeferType {
        return this.command.getDeferType();
    }

    /**
     * This method will perform the check for the rate limit on the command. If it succeeds, the user is not rate 
     * limited and it will not do anything. If it fails and user is rate limited, it will throw a CommandError mentioning 
     * such. It checks for the rate limit AFTER other checks are made for the command so it only rate limits users successfully
     * using it.
     * @param interaction The command interaction being run.
     * @throws CommandError if the command is found to be unable to run.
     */
    public override async checkUsability(interaction: UserContextMenuCommandInteraction): Promise<void> {
        // Check before if there's anything else stopping it from running
        this.command.checkUsability(interaction);

        // if the trigger is valid, then check for the rate limit
        if(await this.rateLimiter.incrementAndCheckRateLimit(interaction.client.user.id)) {
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
                `You can only run this command ${this.rateLimiter.getRateLimitAmount()} time(s) every ${this.rateLimiter.getRateLimitInterval()} second(s). Please wait before attempting this command again.`
            )
        }
    }

    /**
     * Execuite the proxied command's function.
     * @param client The Discord client to run any commands to interact with Discord.
     * @param data The data related to the event, passed in from the EventDataService.
     */
    public override async execute(client: Client, interaction: UserContextMenuCommandInteraction, data: EventData): Promise<void> {
        return this.command.execute(client, interaction, data);
    }

}
