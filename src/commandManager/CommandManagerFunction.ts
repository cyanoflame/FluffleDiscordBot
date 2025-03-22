import type { REST } from "discord.js";

/**
 * This is the interface that establishes a function that is used by the command manager.
 */
export interface CommandManagerFunction {
    
    /**
     * This is what runs when the command is executed.
     * @param rest The REST object being used to communicate with discord for command interactions.
     * @param botClientId The bot's client id that's needed to interact with discord for command interactions.
     */
    execute(rest: REST, botClientId: string): Promise<void>
}
