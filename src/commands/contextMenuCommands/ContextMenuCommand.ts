import type { ApplicationIntegrationType } from "discord.js";

/**
 * This interface contains methods common to all context menu commands.
 */
export interface ContextMenuCommand {
    /**
     * Returns the the integration types for the context menu command. This describes where it 
     * can be installed- being available to users or to servers, or both.
     */
    getIntegrationTypes(): ApplicationIntegrationType[];
}
