import { ChatInputCommandInteraction, InteractionContextType, PermissionFlagsBits, PermissionsBitField, SlashCommandBuilder, type ApplicationCommandOptionChoiceData, type AutocompleteFocusedOption, type AutocompleteInteraction, type Client, type CommandInteraction, type PermissionsString, type RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord.js";
import { SlashCommand } from "./SlashCommand";
import { CommandDeferType } from "../Command";
import type { EventData } from "../../models/eventData";
import { CommandError } from "../CommandError";

/**
 * This command is used to show statistics to the bot devs when they want to use it.
 */
export class DevCommand extends SlashCommand implements SlashCommand {

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
    public getDeferType(): CommandDeferType | undefined {
        return CommandDeferType.HIDDEN;
    }

    /**
     * Returns the names that define the command.
     * @returns the names that define the command.
     */
    public getNames(): string[] {
        return ["dev"];
    }

    /**
     * This method is used to get the metadata for the command.
     * @returns The metadata of the command.
     */
    public getMetadata(): RESTPostAPIChatInputApplicationCommandsJSONBody {
        let slashCommandData = new SlashCommandBuilder()
        .setName("dev") //Lang.getRef('chatCommands.dev', Language.Default),
        // .setNameLocalizations() //Lang.getRefLocalizationMap('chatCommands.dev'),
        .setDescription("Developer use only - shows information about the bot itself.") //Lang.getRef('commandDescs.dev', Language.Default),
        // .description_localizations()  //Lang.getRefLocalizationMap('commandDescs.dev'),
        .setContexts([
            InteractionContextType.BotDM,
            // InteractionContextType.Guild,
            // InteractionContextType.PrivateChannel,
        ])
        .setDefaultMemberPermissions(PermissionsBitField.resolve([
            PermissionFlagsBits.Administrator,
        ]))
        .addStringOption(option => 
            option.setName("command") //Lang.getRef('arguments.command', Language.Default)
            // .setName_localizations() //Lang.getRefLocalizationMap('arguments.command')
            .setDescription("Command") //Lang.getRef('argDescs.devCommand', Language.Default)
            // .setDescriptionLocalizations() // Lang.getRefLocalizationMap('argDescs.devCommand')
            .setRequired(true)
            .addChoices([{
                name: "info",
                // name_localizations: {}
                value: 'INFO'
            }])
            // .setAutocomplete(true)
        )

        // Retun the build slash command metadata
        return slashCommandData.toJSON();
    }


    /**
     * Returns autocomplete choice data for the command or undefined if there is none.
     * @param interaction The interaction to get the autocomplete data for.
     * @param option The option for the interaction to get the autocomplete data for.
     * @returns The autocomplete data for the interaction option or undefined if there is none.
     */
    public async autocomplete(interaction: AutocompleteInteraction, option: AutocompleteFocusedOption): Promise<ApplicationCommandOptionChoiceData[] | undefined> {
        // WHAT DO :thinking:
        return undefined;
    }

    /**
     * This is the method used to check whether or not the command can be run by the user. If the command cannot be 
     * run, a CommandError should be thrown stating the reason it will not run. This error will be returned to 
     * @param interaction The command interaction being run.
     * @throws CommandError if the command is found to be unable to run.
     */
    public checkUsability(interaction: CommandInteraction): void {
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
    public async executeSlashCommand(client: Client, interaction: ChatInputCommandInteraction, data: EventData): Promise<void> {
        let command = interaction.options.getString();
        // {
        //     command: intr.options.getString(
        //         // Lang.getRef('arguments.command', Language.Default)
        //     ) as DevCommandName,
        // };

        switch (command) {
            case 'INFO': {
                // let shardCount = intr.client.shard?.count ?? 1;
                // let serverCount: number;
                // if (intr.client.shard) {
                //     try {
                //         serverCount = await ShardUtils.serverCount(intr.client.shard);
                //     } catch (error) {
                //         if (error.name.includes('ShardingInProcess')) {
                //             await InteractionUtils.send(
                //                 intr,
                //                 Lang.getEmbed('errorEmbeds.startupInProcess', data.lang)
                //             );
                //             return;
                //         } else {
                //             throw error;
                //         }
                //     }
                // } else {
                //     serverCount = intr.client.guilds.cache.size;
                // }

                let memory = process.memoryUsage();

                // await InteractionUtils.send(
                //     intr,
                //     Lang.getEmbed('displayEmbeds.devInfo', data.lang, {
                //         NODE_VERSION: process.version,
                //         TS_VERSION: `v${typescript.version}`,
                //         ES_VERSION: TsConfig.compilerOptions.target,
                //         DJS_VERSION: `v${djs.version}`,
                //         SHARD_COUNT: shardCount.toLocaleString(data.lang),
                //         SERVER_COUNT: serverCount.toLocaleString(data.lang),
                //         SERVER_COUNT_PER_SHARD: Math.round(serverCount / shardCount).toLocaleString(
                //             data.lang
                //         ),
                //         RSS_SIZE: FormatUtils.fileSize(memory.rss),
                //         RSS_SIZE_PER_SERVER:
                //             serverCount > 0
                //                 ? FormatUtils.fileSize(memory.rss / serverCount)
                //                 : Lang.getRef('other.na', data.lang),
                //         HEAP_TOTAL_SIZE: FormatUtils.fileSize(memory.heapTotal),
                //         HEAP_TOTAL_SIZE_PER_SERVER:
                //             serverCount > 0
                //                 ? FormatUtils.fileSize(memory.heapTotal / serverCount)
                //                 : Lang.getRef('other.na', data.lang),
                //         HEAP_USED_SIZE: FormatUtils.fileSize(memory.heapUsed),
                //         HEAP_USED_SIZE_PER_SERVER:
                //             serverCount > 0
                //                 ? FormatUtils.fileSize(memory.heapUsed / serverCount)
                //                 : Lang.getRef('other.na', data.lang),
                //         HOSTNAME: os.hostname(),
                //         SHARD_ID: (intr.guild?.shardId ?? 0).toString(),
                //         SERVER_ID: intr.guild?.id ?? Lang.getRef('other.na', data.lang),
                //         BOT_ID: intr.client.user?.id,
                //         USER_ID: intr.user.id,
                //     })
                // );
                break;
            }
            default: {
                return;
            }
        }
    }

}
