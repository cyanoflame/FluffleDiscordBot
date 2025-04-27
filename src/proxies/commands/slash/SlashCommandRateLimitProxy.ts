import type { ApplicationCommandOptionBase, ApplicationCommandOptionChoiceData, AutocompleteInteraction, ChatInputCommandInteraction, Client, InteractionContextType, LocalizationMap, Permissions, RESTPostAPIChatInputApplicationCommandsJSONBody, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder } from "discord.js";
import type { EventData } from "../../../models/eventData";
import type { AutocompleteOption } from "../../../commands/slashCommands/components/autocomplete/AutocompleteOption";
import { RateLimiter } from "../../../utils/RateLimiter";
import type { RateLimiterAbstract } from "rate-limiter-flexible";
import { Logger } from '../../../services/logger'
import LogMessageTemplates from "../../../../lang/logMessageTemplates.json"
import { CommandError } from '../../../commands/CommandError'
import type { SlashCommand } from "../../../commands/slashCommands/SlashCommand";
import type { SubcommandElement } from "../../../commands/slashCommands/components/SubcommandElement";
import type { CommandDeferType } from "../../../commands/CommandDeferType";

/**
 * This proxy class is used to proxy to a SlashCommand to apply a rate limit to one when it needs to execute.
 */
export class SlashCommandRateLimitProxy implements SlashCommand {
    /** The rate limiter used for the class */
    private rateLimiter: RateLimiter;

    /** The slash command being proxied */
    private command: SlashCommand;

    /**
     * Constructs a rate limit proxy for a Slash Command.
     * @param rateLimiter Either a reference to a rate limiter to use, or an object with the details make a new rate limiter, such that:
     * rateLimitAmount - The amount of requests that can be made within an interval before limiting the rate ; and rateLimitInterval - The 
     * time that a the amount of requests can be made in before triggering a rate limit,
     * @param command The slash command object that is being rate limited.
     */
    constructor(rateLimiter: {rateLimitAmount: number, rateLimitInterval: number} | RateLimiterAbstract, command: SlashCommand) {
        // Create the rate limiter
        this.rateLimiter = new RateLimiter(rateLimiter);

        // Store the command
        this.command = command;
    }

    /**
     * Returns the proxied command's name.
     * @returns the proxied command's name.
     */
    public getName(): string {
        return this.command.getName();
    }

    /**
     * Returns the proxied command's name localizations.
     * @returns the proxied command's name localizations.
     */
    public getNameLocalizations(): LocalizationMap | null {
        return this.command.getNameLocalizations();
    }

    /**
     * Returns the proxied command's description.
     * @returns the proxied command's description.
     */
    public getDescription(): string {
        return this.command.getDescription();
    }

    /**
     * Returns the proxied command's description localizations.
     * @returns the proxied command's description localizations.
     */
    public getDescriptionLocalizations(): LocalizationMap | null {
        return this.command.getDescriptionLocalizations();
    }

    /**
     * Returns the proxied command's contexts.
     * @returns the proxied command's contexts.
     */
    public getContexts(): InteractionContextType[] {
        return this.command.getContexts();
    }

    /**
     * Returns the proxied command's default member permissions.
     * @returns the proxied command's default memeber permissions.
     */
    public getDefaultMemberPermissions(): Permissions | bigint | number | null | undefined {
        return this.command.getDefaultMemberPermissions();
    }

    /**
     * Returns the proxied command's age restriction setting.
     * @returns the proxied command's age-restriction setting.
     */
    public getIsNSFW(): boolean {
        return this.command.getIsNSFW();
    }

    /**
     * Returns the proxied command's arguments.
     * @returns the proxied command's arguments.
     */
    public getArguments(): (ApplicationCommandOptionBase | AutocompleteOption | SlashCommandSubcommandBuilder | SlashCommandSubcommandGroupBuilder | SubcommandElement)[] {
        return this.command.getArguments();
    }

    /**
     * Returns the proxied command's metadata.
     * @returns the proxied command's metadata.
     */
    public getMetadata(): RESTPostAPIChatInputApplicationCommandsJSONBody {
        return this.command.getMetadata() as RESTPostAPIChatInputApplicationCommandsJSONBody;
    }

    /**
     * Returns proxied command's autocomplete function.
     * @param interaction The interaction to get the autocomplete data for.
     * @returns The proxied command's autocomplete function.
     */
    public autocomplete(interaction: AutocompleteInteraction): Promise<ApplicationCommandOptionChoiceData[] | undefined> {
        return this.command.autocomplete(interaction);
    }
    

    /** 
     * Returns the proxied command's defer type.
     * @returns the proxied command's defer type.
     */
    public getDeferType(): CommandDeferType {
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
    public async checkUsability(interaction: ChatInputCommandInteraction): Promise<void> {
        // Check before if there's anything else stopping it from running
        await this.command.checkUsability(interaction);

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
    public async execute(client: Client, interaction: ChatInputCommandInteraction, data: EventData): Promise<void> {
        return this.command.execute(client, interaction, data);
    }
};
