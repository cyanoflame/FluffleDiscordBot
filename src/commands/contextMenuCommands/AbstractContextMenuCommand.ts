import {
    ApplicationIntegrationType,
    ContextMenuCommandBuilder,
    type RESTPostAPIContextMenuApplicationCommandsJSONBody,
} from 'discord.js';
import { AbstractCommand } from '../AbstractCommand';
import type { ContextMenuCommand } from './ContextMenuCommand';

/**
 * This class defines the structure of a basic context menu command.These do not have 
 * options or subcommands.
 */
export abstract class AbstractContextMenuCommand extends AbstractCommand implements ContextMenuCommand {
    /**
     * Returns the the integration types for the context menu command. This describes where it 
     * can be installed- being available to users or to servers, or both.
     */
    abstract getIntegrationTypes(): ApplicationIntegrationType[];

    /** This is the command's metadata -- it's constructed upon object creation */
    private metadata: RESTPostAPIContextMenuApplicationCommandsJSONBody;

    /**
     * This function creates the map for the autocomplete parameters/commands.
     */
    constructor() {
        // Construct the parent Command class
        super();

        // Construct the metadata object upon command creation
        this.metadata = this.buildMetadata().toJSON();
    }

    /**
     * This method is used to get the full metadata for the command.
     * @returns The metadata of the command.
     */
    public override getMetadata(): RESTPostAPIContextMenuApplicationCommandsJSONBody {
        return this.metadata;
    }

    /**
     * This method is used to build the metadata for the command, and also establish the different options.
     * This method must be overriden and called from child classes to apply the correct type for the context menu.
     * @returns The metadata of the command.
     */
    protected buildMetadata(): ContextMenuCommandBuilder {
        // Build the command from each of the defined methods
        let contextMenuCommandData = new ContextMenuCommandBuilder()
            .setName(this.getName())
            .setNameLocalizations(this.getNameLocalizations())
            .setContexts(this.getContexts())
            .setDefaultMemberPermissions(this.getDefaultMemberPermissions())
            .setIntegrationTypes(this.getIntegrationTypes())

        // Return the built command's data
        return contextMenuCommandData;
    }

}
