import { type LocalizationMap, type InteractionContextType, type Permissions, type ApplicationIntegrationType, type Client, type MessageContextMenuCommandInteraction, type RESTPostAPIApplicationCommandsJSONBody, type PermissionsString, GuildChannel, ThreadChannel } from "discord.js";
import type { EventData } from "../../../../models/eventData";
import { Logger } from '../../../../services/logger'
import LogMessageTemplates from "../../../../../lang/logMessageTemplates.json"
import { CommandError } from '../../../../commands/CommandError'
import type { CommandDeferType } from "../../../../commands/CommandDeferType";
import { MessageContextMenuCommand } from "../../../../commands/contextMenuCommands/message/MessageContextMenuCommand";
import type { ContextMenuCommand } from "../../../../commands/contextMenuCommands/ContextMenuCommand";

/**
 * This proxy class is used to proxy to a MessageContextMenuCommand to apply a rate limit to one when it needs to execute.
 */
export class MessageContextMenuCommandRateLimitProxy implements ContextMenuCommand {
    /** The permissions required to use the command. */
    private requiredClientPermissions: PermissionsString[];

    /** The slash command being proxied */
    private command: MessageContextMenuCommand;

    /**
     * Creates the proxy with the permissions and the proxied command the permissions are applied to.
     * @param permissions The permissions to apply to the command.
     * @param command The command being proxied by permissions.
     */
    constructor(permissions: PermissionsString[], command: MessageContextMenuCommand) {
        // Create the rate limiter
        this.requiredClientPermissions = permissions;

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
     * Returns the proxied command's metadata.
     * @returns the proxied command's metadata.
     */
    public getMetadata(): RESTPostAPIApplicationCommandsJSONBody {
        return this.command.getMetadata();
    }

    /**
     * Return the proxied command's contexts.
     * @returns the proxied command's contexts.
     */
    public getContexts(): InteractionContextType[] {
        return this.command.getContexts();
    }

    /**
     * Get the proxied command's default member permissions.
     * @returns the proxied commands default member permissions.
     */
    public getDefaultMemberPermissions(): Permissions | bigint | number | null | undefined {
        return this.command.getDefaultMemberPermissions();
    }

    /**
     * Returns the proxied command's integration type.
     * @returns the proxied command's integration type.
     */
    public getIntegrationTypes(): ApplicationIntegrationType[] {
        throw new Error("Method not implemented.");
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
    public async checkUsability(interaction: MessageContextMenuCommandInteraction): Promise<void> {
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
    public async execute(client: Client, interaction: MessageContextMenuCommandInteraction, data: EventData): Promise<void> {
        return this.command.execute(client, interaction, data);
    }

}
