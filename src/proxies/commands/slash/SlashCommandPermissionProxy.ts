import { GuildChannel, ThreadChannel, type ApplicationCommandOptionBase, type ApplicationCommandOptionChoiceData, type AutocompleteInteraction, type ChatInputCommandInteraction, type Client, type CommandInteraction, type InteractionContextType, type LocalizationMap, type Permissions, type PermissionsString, type RESTPostAPIChatInputApplicationCommandsJSONBody, type SlashCommandSubcommandBuilder, type SlashCommandSubcommandGroupBuilder } from "discord.js";
import type { EventData } from "../../../models/eventData";
import type { AutocompleteOption } from "../../../commands/slashCommands/components/autocomplete/AutocompleteOption";
import { Logger } from '../../../services/logger'
import LogMessageTemplates from "../../../../lang/logMessageTemplates.json"
import { CommandError } from '../../../commands/CommandError'
import type { SlashCommand } from "../../../commands/slashCommands/SlashCommand";
import type { SubcommandElement } from "../../../commands/slashCommands/components/SubcommandElement";
import type { CommandDeferType } from "../../../commands/CommandDeferType";

/**
 * This class serves as a base for a simple command that only checks against permissions to see if it 
 * can run. The permissions should be established in the getRequiredClientPermissions() in the child class.
 */
export class SlashCommandPermissionProxy implements SlashCommand {
    /** The slash command being proxied */
    private command: SlashCommand;

    /** The permissions required to use the command. */
    private requiredClientPermissions: PermissionsString[];

    /**
     * Creates the proxy with the permissions and the proxied command the permissions are applied to.
     * @param permissions The permissions to apply to the command.
     * @param command The command being proxied by permissions.
     */
    constructor(permissions: PermissionsString[], command: SlashCommand) {
        this.requiredClientPermissions = permissions;
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
     * This is the method used to check whether or not the user has the permissions to run the command or not. If the command cannot be 
     * run, a CommandError should be thrown stating the reason it will not run. This error will be returned to 
     * @param interaction The command interaction being run.
     * @throws CommandError with the permissions not met by the user running the command.
     */
    public async checkUsability(interaction: ChatInputCommandInteraction): Promise<void> {
        // check for the proper permissions
        if(interaction.channel instanceof GuildChannel || interaction.channel instanceof ThreadChannel) {
            // get user permissions
            let userPermissions = interaction.channel!.permissionsFor(interaction.client.user)
            if(userPermissions && userPermissions.has(this.requiredClientPermissions)) {
                // Permissions are good -- Check everything else for the command
                await this.command.checkUsability(interaction);
                // don't need to check anythign else
                return;
            } else {
                // All the missing permissions
                let missingPerms = this.requiredClientPermissions;
                // Get
                if(userPermissions) {
                    // Get the missing permissions -- check each one individually to see if the user has it
                    missingPerms = missingPerms.filter(requiredPermission => 
                        !userPermissions.has(requiredPermission)
                    )
                }
                // Throw an error because the user permissions didn't match
                throw new CommandError(
                    "Missing permissions to perform command: " +
                    missingPerms
                    .map(permission => `**${permission}**`) // TODO: Language support for this (instead of using enum map to function)
                    .join(', ')
                )
            }
        } else {
            // Throw an error because invalid channel type to run commands in
            throw new CommandError("Command cannot be run in channel type") // TODO: Language support for this
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
