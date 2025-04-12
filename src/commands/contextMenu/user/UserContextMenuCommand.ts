import {
    ApplicationCommandType,
    Client,
    ContextMenuCommandBuilder,
    UserContextMenuCommandInteraction,
} from 'discord.js';

import { EventData } from '../../../models/eventData';
import { ContextMenuCommand } from '../ContextMenuCommand';

/**
 * This class defines the structure of a command run from the context menu of a user.
 */
export abstract class UserContextMenuCommand extends ContextMenuCommand {

    /**
     * This method is used to build the metadata for the command, and also establish the different options.
     * The normal method is overridden so that this one can get that data, and also specify the type.
     * @returns The metadata of the command.
     */
    protected override buildMetadata(): ContextMenuCommandBuilder {
        // build it with all the other specified metadata
        let contextMenuCommandData = super.buildMetadata();

        // Set the context menu type to user
        contextMenuCommandData.setType(ApplicationCommandType.User);

        // Return the build data
        return contextMenuCommandData;
    }

    /**
     * This is the method used to check whether or not the command can be run by the user. If the command cannot be 
     * run, a CommandError should be thrown stating the reason it will not run. This error will be returned to 
     * @param interaction The interaction with the user context for the command being run.
     * @throws CommandError if the command is found to be unable to run.
     */
    abstract override checkUsability(interaction: UserContextMenuCommandInteraction): Promise<void>;

    /**
     * This function will execute whenever the command is called.
     * @param client The Discord client to run any commands to interact with Discord.
     * @param interaction The interaction with the message context for the command being run.
     * @param data The data related to the event, passed in from the EventDataService.
     */
    abstract override execute(client: Client, interaction: UserContextMenuCommandInteraction, data: EventData): Promise<void>

}
