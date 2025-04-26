import type { ChatInputCommandInteraction, Client, LocalizationMap } from "discord.js";
import { Subcommand } from "../../../../components/Subcommand";
import type { EventData } from "../../../../../../models/eventData";

/**
 * This subcommand is used by the test command to retrieve information about the bot itself.
 */
export class BotInfoOptionSubcommand extends Subcommand {

    /**
     * Returns the name for the subcommand.
     * @returns the name for the subcommand.
     */
    public override getName(): string {
        return "bot"
    }

    /**
     * Returns the name localizations for different languages, or null if there is none.
     * @returns LocalizationMap for the name localizations or null if there is none.
     */
    public override getNameLocalizations(): LocalizationMap | null {
        // default result if not overridden
        return null; // TODO: Language support for this
    }

    /**
     * Returns the description of the subcommand.
     * @returns the description of the subcommand.
     */
    public override getDescription(): string {
        // default result if not overridden
        return "Get information about the bot itself.";
    }

    /**
     * Returns the description localizations for different languages, or null if there is none.
     * @returns LocalizationMap for the description localizations or null if there is none.
     */
    public override getDescriptionLocalizations(): LocalizationMap | null {
        // default result if not overridden
        return null; // TODO: Language support for this
    }

    /**
     * Used to get info about the bot itself and its current state.
     * @param interaction The interaction that triggered the command.
     * @returns String with info regarding the bot itself and its current state.
     */
    public getBotInfo(interaction: ChatInputCommandInteraction): string {
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

    /**
     * This function will execute whatever the subcommand element does when it is called.
     * @param client The Discord client to run any commands to interact with Discord.
     * @param interaction The interaction causing the command to be triggered.
     * @param data The data related to the event, passed in from the EventDataService.
     */
    public override async execute(client: Client, interaction: ChatInputCommandInteraction, data: EventData): Promise<void> {
        // Reply
        interaction.reply(this.getBotInfo(interaction));
    }

}
