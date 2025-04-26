import type { ChatInputCommandInteraction, Client, LocalizationMap } from "discord.js";
import { Subcommand } from "../../../../components/Subcommand";
import type { EventData } from "../../../../../../models/eventData";
import { versionMajorMinor } from "typescript";
import { version } from "discord.js";

/**
 * This subcommand is used by the test command to retrieve information about the bot environment.
 */
export class EnvironmentInfoOptionSubcommand extends Subcommand {

    /**
     * Returns the name for the subcommand.
     * @returns the name for the subcommand.
     */
    public override getName(): string {
        return "environment"
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
        return "Get information about the bot's environment information."
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
     * This function will execute whatever the subcommand element does when it is called.
     * @param client The Discord client to run any commands to interact with Discord.
     * @param interaction The interaction causing the command to be triggered.
     * @param data The data related to the event, passed in from the EventDataService.
     */
    public override async execute(client: Client, interaction: ChatInputCommandInteraction, data: EventData): Promise<void> {
        let outStr = "Environment Info:\n";

        outStr += `**Bun Version**: ${Bun.version}\n`;
        outStr += `**Typescript Version**: ${versionMajorMinor}\n`;
        outStr += `**Discord.js Version**: ${version}\n`;

        // Reply
        interaction.reply(outStr);
    }

}
