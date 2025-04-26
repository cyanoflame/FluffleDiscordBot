import type { ChatInputCommandInteraction, Client, LocalizationMap } from "discord.js";
import { Subcommand } from "../../../../components/Subcommand";
import type { EventData } from "../../../../../../models/eventData";
import { hostname } from "os"
import { heapStats } from "bun:jsc";

/**
 * This subcommand is used by the test command to retrieve information about the system the bot is running on.
 */
export class SystemInfoOptionSubcommand extends Subcommand {

    /**
     * Returns the name for the subcommand.
     * @returns the name for the subcommand.
     */
    public override getName(): string {
        return "system"
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
        return "Get information about the system the bot is running on.";
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
     * Used to get info about the system the bot is running on.
     * @returns String with info regarding the system the bot is on.
     */
    public getSystemInfo(): string {
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
     * This function will execute whatever the subcommand element does when it is called.
     * @param client The Discord client to run any commands to interact with Discord.
     * @param interaction The interaction causing the command to be triggered.
     * @param data The data related to the event, passed in from the EventDataService.
     */
    public override async execute(client: Client, interaction: ChatInputCommandInteraction, data: EventData): Promise<void> {
        // Reply
        interaction.reply(this.getSystemInfo());
    }

}
