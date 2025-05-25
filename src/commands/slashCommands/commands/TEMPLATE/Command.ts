import { ApplicationCommandOptionBase, ChatInputCommandInteraction, InteractionContextType, MessagePayload, PermissionFlagsBits, PermissionsBitField, SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder, version, type APIApplicationCommandOptionChoice, type ApplicationCommandOptionChoiceData, type AutocompleteFocusedOption, type AutocompleteInteraction, type Client, type CommandInteraction, type InteractionReplyOptions, type LocalizationMap, type Permissions, type PermissionsString, type RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord.js";
import { AbstractSlashCommand } from "../../AbstractSlashCommand";
import type { EventData } from "../../../../models/eventData";
import { CommandError } from "../../../CommandError";
import type { AutocompleteOption } from "../../components/autocomplete/AutocompleteOption";
import type { SubcommandElement } from "../../components/SubcommandElement";
import { CommandDeferType } from "../../../CommandDeferType";

/**
 * This command is used as a template to make other commands easily.
 */
export class DevCommand extends AbstractSlashCommand {
    /**
     * This creates the command with the list of users able to use it.
     * @param userIds The list of user ids of those who can use the command.
     */
    constructor() {
        // Add any arguments to the constructor to pass them in when creating the command
        // Create private class instance variables and set them here if needed
        // See Dev command for an example
        super();
    }

    /** 
     * Discord requires a response from a command in 3 seconds or become invalid. If a 
     * response will take longer than that, the response will need to be deferred, sending a 
     * message "<app/bot> is thinking..." as a first response. This gives the response a 15
     * minute window to actually respond.
     * 
     * Since HIDDEN is used, the interaction must be responded to with interaction.followUp()
     * 
     * See https://discordjs.guide/slash-commands/response-methods.html#deferred-responses
     * 
     * @returns If the command needs to be deferred, then should return a CommandDeferType.
     */
    public override getDeferType(): CommandDeferType {
        // Uncomment the defer type used
        
        // Will hide the command response, leaving it only visible to the command's user
        return CommandDeferType.HIDDEN;
        
        // Will make the command's response public, so anyone can see the command's response
        // return CommandDeferType.PUBLIC;

        // Will NOT defer the command - user must be manually defer the command 
        // Otherwise the command response must occur in 3 seconds or it will fail.
        // NOTE: if defer is done in checkUsability, it will happen AFTER any proxy checks applied
        //       to the command (such as rate limit) -- this is still part of the 3 second response window.
        // Use the other defer types to extend the 3 second window to a 15 minute window.
        // This is only recommended to be used if you kow what you are doing.
        // return CommandDeferType.NONE; 
    }

    /**
     * Returns the name for the command.
     * @returns the name for the command.
     */
    public override getName(): string {
        // this is the name and what will be run:
        //  /<commandName>
        return "<commandName>"; //Lang.getRef('chatCommands.dev', Language.Default),
    }

    /**
     * Returns the name localizations for different languages, or null if there is none.
     * @returns LocalizationMap for the name localizations or null if there is none.
     */
    public override getNameLocalizations(): LocalizationMap | null {
        // This accounts for different names in different languages.
        return null; //Lang.getRefLocalizationMap('chatCommands.dev'),
    }

    /**
     * Returns the description of the command.
     * @returns the description of the command.
     */
    public override getDescription(): string {
        // This is a breif description for the command
        return "<command description>"; //Lang.getRef('commandDescs.dev', Language.Default),
    }

    /**
     * Returns the description localizations for different languages, or null if there is none.
     * @returns LocalizationMap for the description localizations or null if there is none.
     */
    public override getDescriptionLocalizations(): LocalizationMap | null {
        // This accounts for different descriptions in different languages.
        return null; //Lang.getRefLocalizationMap('commandDescs.dev'),
    }

    /**
     * Return the contexts that the command can be run in (servers, dms, group dms).
     * @returns the contexts that the command can be run in.
     */
    public override getContexts(): InteractionContextType[] {
        // Uncomment all the places you wish the command to be executable
        return [
            // can be used within DMs with the app's bot user
            // InteractionContextType.BotDM,
            
            // can be used within servers
            InteractionContextType.Guild,
            
            // can be used within Group DMs and DMs other than the app's bot user
            // InteractionContextType.PrivateChannel,
        ];
    }

    /**
     * Get the permissions required to be able to run the command.
     * @returns the permissions required to run the command.
     */
    public override getDefaultMemberPermissions(): Permissions | bigint | number | null | undefined {
        // No member permissions needed to use the command
        // return null;
        
        // Admin permissions needed to use the command
        return PermissionFlagsBits.Administrator;

        // Example for requiring multiple permissions:
        // (For this example: if they have both ManageChannels permissions and SendMessages permissions, 
        // then they could use the command)
        // return PermissionFlagsBits.ManageChannels | PermissionFlagsBits.SendMessages;
    }

    /**
     * Whether or not the command handles nsfw things. If this is true, it can only be used in channels/places where nsfw content 
     * has been enabled.
     * @returns whether or not the command handles nsfw things.
     */
    public override getIsNSFW(): boolean {
        // Uncomment only 1 for if it does or not
        return false;   // Command does NOT hanle nsfw things
        // return true; // Command does handle nsfw things
    }

    /**
     * Returns a list of options for the command. If the options are autocomplete options, they should be added 
     * here as well.
     * @returns list of the options for the command, both autofill and not.
     */
    public override getArguments(): (ApplicationCommandOptionBase | AutocompleteOption | SlashCommandSubcommandBuilder | SlashCommandSubcommandGroupBuilder | SubcommandElement)[] {
        return [
            // Set the options here
        ]
    }

    /**
     * This checks whether or not the user is one of the bot developers. They can only use the command if they are a developer.
     * @param interaction The command interaction being run.
     * @throws CommandError if the command is found to be unable to run.
     */
    public override async checkUsability(interaction: ChatInputCommandInteraction): Promise<void> {
        // Check whether or not a command can 
        
        // <check whatever>
        
        // if it cannot use a command, throw a CommandError elaborating why
        // if(!canUseCommand) {
        //      throw new CommandError("<cannot use command because xyz>");
        // }

        // if no CommandError is thrown, then the command can be used
    }

    /**
     * This function will execute whenever the command is called.
     * @param client The Discord client to run any commands to interact with Discord.
     * @param interaction The interaction causing the command to be triggered.
     * @param data The data related to the event, passed in from the EventDataService.
     */
    public override async executeCommand(client: Client, interaction: ChatInputCommandInteraction, data: EventData): Promise<void> {
        // Placehold for a message to reply with...
        let response = "";
        // let response: MessagePayload =  new MessagePayload(...)
        // let response: InteractionReplyOptions = {
        //     content: "",
        //     // ...
        // }

        // Get variables like this
        // let option = interaction.options.getTYPE(optionName)

        // <Do something to get/set response>

        // Respond to the command
        // Must use .followUp() when a defer type is set
        // Otherwise .reply() is used FIRST before any .followUp() command if deferType is set to NONE
        await interaction.followUp(response);

        // // Respond with the update message change the visibility of the message response (unknown if overrides the main one)
        // await interaction.followUp({
        //     flags: "Ephemeral", // msg is already hidden
        //     content: outStr,
        // });
    }

}
