import { ApplicationCommandOptionBase, ChatInputCommandInteraction, InteractionContextType, PermissionFlagsBits, PermissionsBitField, SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder, version, type APIApplicationCommandOptionChoice, type ApplicationCommandOptionChoiceData, type AutocompleteFocusedOption, type AutocompleteInteraction, type Client, type CommandInteraction, type LocalizationMap, type Permissions, type PermissionsString, type RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord.js";
import { AbstractSlashCommand } from "../../AbstractSlashCommand";
import { CommandDeferType } from "../../../Command";
import type { EventData } from "../../../../models/eventData";
import { CommandError } from "../../../CommandError";
import { hostname } from "os"
import { versionMajorMinor } from "typescript";
import { AutocompleteStringOption } from "../../components/autocomplete/AutocompleteStringOption";
import type { SubcommandElement } from "../../components/SubcommandElement";
import { InfoOptionSubcommandGroup } from "./subcommands/InfoOptionSubcommandGroup";
import { AllInfoOptionSubcommand } from "./subcommands/InfoOptionSubcommandGroup/AllInfoOptionSubcommand";
import { BotInfoOptionSubcommand } from "./subcommands/InfoOptionSubcommandGroup/BotInfoOptionSubcommand";
import { SystemInfoOptionSubcommand } from "./subcommands/InfoOptionSubcommandGroup/SystemInfoOptionSubcommand";
import { EnvironmentInfoOptionSubcommand } from "./subcommands/InfoOptionSubcommandGroup/EnvironmentInfoOptionSubcommand";

// /**
//  * This enum establishes a common set of values that could be returned from the choices.
//  */
// export enum DevInfoChoices {
//     ALL = "all",
//     SYSTEM = "system",
//     ENVIRONMENT = "environment",
//     BOT = "bot"
// };

/**
 * This command is used to test whatever. (currently testing slash commands)
 */
export class TestCommand extends AbstractSlashCommand {

    /** The list of user ids of users able to use the command */
    private userIds: string[];

    /**
     * This creates the command with the list of users able to use it.
     * @param userIds The list of user ids of those who can use the command.
     */
    constructor(userIds: string[]) {
        super();
        this.userIds = userIds;
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
    public override getDeferType(): CommandDeferType | undefined {
        return CommandDeferType.HIDDEN;
    }

    /**
     * Returns the name for the command.
     * @returns the name for the command.
     */
    public override getName(): string {
        return "test"; //Lang.getRef('chatCommands.test', Language.Default),
    }

    // /**
    //  * Returns the name localizations for different languages, or null if there is none.
    //  * @returns LocalizationMap for the name localizations or null if there is none.
    //  */
    // public override getNameLocalizations(): LocalizationMap | null {
    //     return null; //Lang.getRefLocalizationMap('chatCommands.dev'),
    // }

    /**
     * Returns the description of the command.
     * @returns the description of the command.
     */
    public override getDescription(): string {
        return "Developer use only - shows information about the bot itself."; //Lang.getRef('commandDescs.dev', Language.Default),
    }

    // /**
    //  * Returns the description localizations for different languages, or null if there is none.
    //  * @returns LocalizationMap for the description localizations or null if there is none.
    //  */
    // public override getDescriptionLocalizations(): LocalizationMap | null {
    //     return null; //Lang.getRefLocalizationMap('commandDescs.dev'),
    // }

    // /**
    //  * Return the contexts that the command can be run in (servers, dms, group dms).
    //  * @returns the contexts that the command can be run in.
    //  */
    // public override getContexts(): InteractionContextType[] {
    //     return [
    //         InteractionContextType.BotDM,
    //         InteractionContextType.Guild,
    //         InteractionContextType.PrivateChannel,
    //     ];
    // }

    /**
     * Get the permissions required to be able to run the command.
     * @returns the permissions required to run the command.
     */
    public override getDefaultMemberPermissions(): Permissions | bigint | number | null | undefined {
        return PermissionFlagsBits.Administrator;
    }

    // /**
    //  * Whether or not the command handles nsfw things. If this is true, it can only be used in channels/places where nsfw content 
    //  * has been enabled.
    //  * @returns whether or not the command handles nsfw things.
    //  */
    // public override getIsNSFW(): boolean {
    //     return false;
    // }

    // /**
    //  * Returns a list of options for the command. If the options are autocomplete options, they should be added 
    //  * here as well.
    //  * @returns list of the options for the command, both autofill and not.
    //  */
    // public override getOptions(): ApplicationCommandOptionBase[] {
    //     return [
    //         // new InfoTypeOption()
    //         new AutocompleteStringOption()
    //             .setName("infotype")
    //             .setDescription("Get the specific type of information")
    //             .setRequired(true)
    //             .setAutocompleteChoiceFunction(this.infoTypeAutocompleteFunction)
    //     ]
    // }

    // /**
    //  * This is the method used to get the the choices for an autocomplete interaction.
    //  * @param interaction The autocomplete interaction that choices need to be responded to.
    //  */
    // // public async getChoices(interaction: AutocompleteInteraction): Promise<APIApplicationCommandOptionChoice[]> {
    // private async infoTypeAutocompleteFunction(interaction: AutocompleteInteraction): Promise<APIApplicationCommandOptionChoice<DevInfoChoices>[]> {
    //     const focusedOption = interaction.options.getFocused(true);
    //     let choices = [
    //         {name: "all", value: DevInfoChoices.ALL},
    //         {name: "system", value: DevInfoChoices.SYSTEM},
    //         {name: "environment", value: DevInfoChoices.ENVIRONMENT},
    //         {name: "bot", value: DevInfoChoices.BOT}
    //     ];
    //     // Get the ones that are closest to what's typed already
    //     return choices.filter(choice => choice.value.startsWith(focusedOption.value));
    // }

    /**
     * Returns the collection of subcommands and subcommand groups used by the slash command.
     * @returns the collection of subcommands and subcommand groups used by the slash command.
     */
    public override getSubcommandElements(): (SlashCommandSubcommandBuilder | SlashCommandSubcommandGroupBuilder | SubcommandElement)[] {
        return [
            new InfoOptionSubcommandGroup([
                new AllInfoOptionSubcommand(),
                new BotInfoOptionSubcommand(),
                new EnvironmentInfoOptionSubcommand(),
                new SystemInfoOptionSubcommand()
            ])
        ]
    }

    /**
     * This checks whether or not the user is one of the bot developers. They can only use the command if they are a developer.
     * @param interaction The command interaction being run.
     * @throws CommandError if the command is found to be unable to run.
     */
    public override async checkUsability(interaction: ChatInputCommandInteraction): Promise<void> {
        // Throw an error because the user permissions didn't match
        if(this.userIds.indexOf(interaction.user.id) == -1) {
            throw new CommandError("This action can only be done by developers.");
        }
    }

    /**
     * This function will execute whenever the command is called.
     * @param client The Discord client to run any commands to interact with Discord.
     * @param interaction The interaction causing the command to be triggered.
     * @param data The data related to the event, passed in from the EventDataService.
     */
    public override async executeCommand(client: Client, interaction: ChatInputCommandInteraction, data: EventData): Promise<void> {
        // All handled by sub commands
    }

}
