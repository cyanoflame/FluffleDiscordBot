import { ChannelType, SlashCommandBooleanOption, SlashCommandChannelOption, SlashCommandStringOption, type ApplicationCommandOptionBase, type ChatInputCommandInteraction, type Client, type LocalizationMap } from "discord.js";
import { Subcommand } from "../../../components/Subcommand";
import type { EventData } from "../../../../../models/eventData";
import type { AutocompleteOption } from "../../../components/autocomplete/AutocompleteOption";
import SqliteDb from "../../../../../database/sqlite/SqliteDb";

/**
 * This subcommand is used by the test command to retrieve all information about the bot.
 */
export class ChannelSubcommand extends Subcommand {

    /**
     * Returns the name for the subcommand.
     * @returns the name for the subcommand.
     */
    public override getName(): string {
        return "channel"
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
        return "Configure settings for the FluffleDiscordBot";
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
     * Returns a list of options for the command. If the options are autocomplete options, they should be added 
     * here as well.
     * @returns list of the options for the command, both autofill and not.
     */
    public override getOptions(): (ApplicationCommandOptionBase | AutocompleteOption)[] {
        return [
            new SlashCommandChannelOption()
                .setName("targetchannel")
                .setNameLocalizations(null)
                .setDescription("The channel to modify")
                .setDescriptionLocalizations(null)
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true),

            new SlashCommandStringOption()
                .setName("targetsetting")
                .setNameLocalizations(null)
                .setDescription("The setting to modify")
                .setDescriptionLocalizations(null)
                .setRequired(true)
                .addChoices(
                    {name: 'whitelist', value: 'whitelist', name_localizations: undefined},
                    {name: 'blacklist', value: 'blacklist', name_localizations: undefined},
                ),

            new SlashCommandBooleanOption()
                .setName("toggle")
                .setNameLocalizations(null)
                .setDescription("Set as one or not")
                .setDescriptionLocalizations(null)
                .setRequired(true)
        ];
    }

    /**
     * This function will execute whatever the subcommand element does when it is called.
     * @param client The Discord client to run any commands to interact with Discord.
     * @param interaction The interaction causing the command to be triggered.
     * @param data The data related to the event, passed in from the EventDataService.
     */
    public override async execute(client: Client, interaction: ChatInputCommandInteraction, data: EventData): Promise<void> {
        // Get all of the information in one string
        let outStr = "";

        // Update the DB
        let channel = interaction.options.getChannel("targetchannel");

        // Check for the channel to be present
        if(channel == null) {
            throw Error("The channel is invalid or does not exist"); // TODO: Language support
        }
        
        // Get the setting
        let toggle = interaction.options.getBoolean("toggle");

        // Check to make sure the toggle is valid
        if(toggle === null) {
            throw Error("Invalid option for toggle");
        }

        // Get the database
        let db = SqliteDb.getInstance();

        // Do the proper action depending on the options set
        switch(interaction.options.getString("targetsetting")) {
            case "whitelist": {
                if(toggle) {
                    db.addToGuildWhitelist(interaction.guildId!, channel.id); // this command can only be executed in a guild
                    outStr = `Whitelisted channel ${channel.name} for use with the FluffleDiscordBot.`; // TODO: Language support
                } else {
                    db.removeFromGuildWhitelist(channel.id); // this command can only be executed in a guild
                    outStr = `Removed channel ${channel.name} from whitelist for the FluffleDiscordBot.`; // TODO: Language support
                }
                break;
            }
            case "blacklist": {
                if(toggle) {
                    db.addToGuildBlacklist(interaction.guildId!, channel.id); // this command can only be executed in a guild
                    outStr = `Removed channel ${channel.name} from blacklist for the FluffleDiscordBot.`; // TODO: Language support
                } else {
                    db.removeFromGuildBlacklist(channel.id); // this command can only be executed in a guild
                    outStr = `Removed channel ${channel.name} from blacklist for the FluffleDiscordBot.`; // TODO: Language support
                }
                break;
            }
            default: {
                throw Error("Invalid setting to configure for channel")
            }
        }

        // Respond with the update message
        await interaction.followUp({
            // flags: "Ephemeral", // msg is already hidden
            content: outStr,
        });
    }

}
