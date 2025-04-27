import { ApplicationCommandOptionBase, ChatInputCommandInteraction, InteractionContextType, PermissionFlagsBits, PermissionsBitField, SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder, version, type APIApplicationCommandOptionChoice, type ApplicationCommandOptionChoiceData, type AutocompleteFocusedOption, type AutocompleteInteraction, type Client, type CommandInteraction, type LocalizationMap, type Permissions, type PermissionsString, type RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord.js";
import { AbstractSlashCommand } from "../../AbstractSlashCommand";
import type { EventData } from "../../../../models/eventData";
import { CommandError } from "../../../CommandError";
import { hostname } from "os"
import { versionMajorMinor } from "typescript";
import { heapStats } from "bun:jsc";
import type { AutocompleteOption } from "../../components/autocomplete/AutocompleteOption";
import type { SubcommandElement } from "../../components/SubcommandElement";
import { infotypeOption } from "./options/infotype";
import { DevInfoChoice } from "./DevChoicesEnum";
import { CommandDeferType } from "../../../CommandDeferType";

/**
 * This command is used to show statistics to the bot devs when they want to use it.
 */
export class DevCommand extends AbstractSlashCommand {

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
     * 
     * Since HIDDEN is used, the interaction must be responded to with interaction.followUp()
     * 
     * See https://discordjs.guide/slash-commands/response-methods.html#deferred-responses
     * 
     * @returns If the command needs to be deferred, then should return a CommandDeferType.
     */
    public override getDeferType(): CommandDeferType {
        return CommandDeferType.HIDDEN;
    }

    /**
     * Returns the name for the command.
     * @returns the name for the command.
     */
    public override getName(): string {
        return "dev"; //Lang.getRef('chatCommands.dev', Language.Default),
    }

    /**
     * Returns the name localizations for different languages, or null if there is none.
     * @returns LocalizationMap for the name localizations or null if there is none.
     */
    public override getNameLocalizations(): LocalizationMap | null {
        return null; //Lang.getRefLocalizationMap('chatCommands.dev'),
    }

    /**
     * Returns the description of the command.
     * @returns the description of the command.
     */
    public override getDescription(): string {
        return "Developer use only - shows information about the bot itself."; //Lang.getRef('commandDescs.dev', Language.Default),
    }

    /**
     * Returns the description localizations for different languages, or null if there is none.
     * @returns LocalizationMap for the description localizations or null if there is none.
     */
    public override getDescriptionLocalizations(): LocalizationMap | null {
        return null; //Lang.getRefLocalizationMap('commandDescs.dev'),
    }

    /**
     * Return the contexts that the command can be run in (servers, dms, group dms).
     * @returns the contexts that the command can be run in.
     */
    public override getContexts(): InteractionContextType[] {
        return [
            InteractionContextType.BotDM,
            InteractionContextType.Guild,
            InteractionContextType.PrivateChannel,
        ];
    }

    /**
     * Get the permissions required to be able to run the command.
     * @returns the permissions required to run the command.
     */
    public override getDefaultMemberPermissions(): Permissions | bigint | number | null | undefined {
        return PermissionFlagsBits.Administrator;
    }

    /**
     * Whether or not the command handles nsfw things. If this is true, it can only be used in channels/places where nsfw content 
     * has been enabled.
     * @returns whether or not the command handles nsfw things.
     */
    public override getIsNSFW(): boolean {
        return false;
    }

    /**
     * Returns a list of options for the command. If the options are autocomplete options, they should be added 
     * here as well.
     * @returns list of the options for the command, both autofill and not.
     */
    public override getArguments(): (ApplicationCommandOptionBase | AutocompleteOption | SlashCommandSubcommandBuilder | SlashCommandSubcommandGroupBuilder | SubcommandElement)[] {
        return [
            infotypeOption
                // .setAutocompleteChoiceFunction(this.infoTypeAutocompleteFunction)
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
        // let optionsList = this.getOptions().map(option => {
        //     if(option instanceof AutocompletableOption) {
        //         return option.getOptionData();
        //     } else {
        //         return option;
        //     }
        // });

        // get option by name --> pass in the option name
        // let infoType = interaction.options.getString(this.getOptions()[0]!.name); // Not recommended
        // let infoType = interaction.options.getString(this.getOptionNameAtOptionIndex(0)!); // Not recommended
        let infoType = interaction.options.getString(infotypeOption.name); // Recommended

        let outStr = "";

        switch(infoType) {
            case(DevInfoChoice.ALL): {
                outStr += this.getSystemInfo();
                outStr += this.getEnvironmentInfo();
                outStr += this.getBotInfo(interaction);
                break;
            }
            case(DevInfoChoice.SYSTEM): {
                outStr += this.getSystemInfo();
                break;
            }
            case(DevInfoChoice.ENVIRONMENT): {
                outStr += this.getEnvironmentInfo();
                break;
            }
            case(DevInfoChoice.BOT): {
                outStr += this.getBotInfo(interaction);
                break;
            }
        };

        // Reply
        await interaction.followUp(outStr); // must use .followUp() when a defer type is set
    }

    /**
     * Used to get info about the system the bot is running on.
     * @returns String with info regarding the system the bot is on.
     */
    private getSystemInfo(): string {
        let memory = process.memoryUsage();
        let heapInfo = heapStats();

        let outStr = "# System Info:\n";
        outStr += `**RSS**: ${memory.rss} bytes\n`; // todo: add per server and per shard
        outStr += `**Heap Total**: ${heapInfo.heapCapacity} bytes\n`;
        outStr += `**Heap Used**: ${heapInfo.heapSize} bytes -- (${(heapInfo.heapSize/heapInfo.heapCapacity) * 100.0} %)\n`;
        outStr += `**Hostname**: ${hostname()} bytes\n`;

        return outStr;
    }

    /**
     * Used to get info about the environment the bot is running in.
     * @returns String with info regarding the environment the bot is running in.
     */
    private getEnvironmentInfo(): string {
        let outStr = "# Environment Info:\n";

        outStr += `**Bun Version**: ${Bun.version}\n`;
        outStr += `**Typescript Version**: ${versionMajorMinor}\n`;
        outStr += `**Discord.js Version**: ${version}\n`;

        return outStr
    }

    /**
     * Used to get info about the bot itself and its current state.
     * @param interaction The interaction that triggered the command.
     * @returns String with info regarding the bot itself and its current state.
     */
    private getBotInfo(interaction: ChatInputCommandInteraction): string {
        let outStr = "# Bot Info:\n";

        outStr += `**Guild ID**: ${interaction.guild?.id ?? "Undefined"}\n`;
        outStr += `**Bot ID**: ${interaction.client.user?.id ?? "Undefined"}\n`;
        outStr += `**User ID**: ${interaction.user.id}\n`;

        //         //         SHARD_COUNT: shardCount.toLocaleString(data.lang),
        //         //         SERVER_COUNT: serverCount.toLocaleString(data.lang),
        //         //         SERVER_COUNT_PER_SHARD: Math.round(serverCount / shardCount).toLocaleString(
        //         //             data.lang
        //         //         ),
        //         //         RSS_SIZE: FormatUtils.fileSize(memory.rss),
        //         //         SHARD_ID: (intr.guild?.shardId ?? 0).toString(),
        //         //         SERVER_ID: intr.guild?.id ?? Lang.getRef('other.na', data.lang),
        //         //         BOT_ID: intr.client.user?.id,
        //         //         USER_ID: intr.user.id,

        return outStr
    }

}

        // {
        //     command: intr.options.getString(
        //         // Lang.getRef('arguments.command', Language.Default)
        //     ) as DevCommandName,
        // };

        // switch (command) {
        //     case 'INFO': {
        //         // let shardCount = intr.client.shard?.count ?? 1;
        //         // let serverCount: number;
        //         // if (intr.client.shard) {
        //         //     try {
        //         //         serverCount = await ShardUtils.serverCount(intr.client.shard);
        //         //     } catch (error) {
        //         //         if (error.name.includes('ShardingInProcess')) {
        //         //             await InteractionUtils.send(
        //         //                 intr,
        //         //                 Lang.getEmbed('errorEmbeds.startupInProcess', data.lang)
        //         //             );
        //         //             return;
        //         //         } else {
        //         //             throw error;
        //         //         }
        //         //     }
        //         // } else {
        //         //     serverCount = intr.client.guilds.cache.size;
        //         // }

        //         

        //         // await InteractionUtils.send(
        //         //     intr,
        //         //     Lang.getEmbed('displayEmbeds.devInfo', data.lang, {


        //         //     })
        //         // );
        //         break;
        //     }
        //     default: {
        //         return;
        //     }
        // }
