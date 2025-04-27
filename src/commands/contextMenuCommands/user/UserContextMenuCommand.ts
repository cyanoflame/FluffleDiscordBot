import {
    ApplicationCommandType,
    ContextMenuCommandBuilder,
} from 'discord.js';
import { AbstractContextMenuCommand } from '../AbstractContextMenuCommand';

/**
 * This class defines the structure of a command run from the context menu of a user.
 */
export abstract class UserContextMenuCommand extends AbstractContextMenuCommand {
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
}
