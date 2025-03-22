import { Logger } from "./services/logger"
import LogMessageTemplates from "../lang/logMessageTemplates.json"
import { REST, Routes, type APIApplicationCommand, type RESTGetAPIApplicationCommandsResult, type RESTPatchAPIApplicationCommandJSONBody, type RESTPostAPIApplicationCommandsJSONBody, type RESTPostAPIChatInputApplicationCommandsJSONBody, type RESTPostAPIContextMenuApplicationCommandsJSONBody } from "discord.js";
import { CommandManager } from "./commandManager/CommandManager";
import type { CommandManagerFunction } from "./commandManager/CommandManagerFunction";
import { ViewFunction } from "./commandManager/functions/ViewFunction";
import { RegisterFunction } from "./commandManager/functions/RegisterFunction";
import { RenameFunction } from "./commandManager/functions/RenameFunction";
import { DeleteFunction } from "./commandManager/functions/DeleteFunction";
import { ClearFunction } from "./commandManager/functions/ClearFunction";

/**
 * The potential operations that can be done with the command manager.
 * CLEAR = remove all commands
 */
enum CommandOperation {
    CLEAR = 'clear',
    DELETE = 'delete',
    REGISTER = 'register',
    RENAME = 'rename',
    VIEW = 'view',
    UNKNOWN = 'UNKNOWN'
}

/**
 * Converts the string argument into a valid command opearation.
 * @param argument The string argument being converted to a command operation.
 * @returns A valid CommandOperation.
 */
function toCommandOperation(argument: string): CommandOperation {
    switch (argument) {
        case CommandOperation.CLEAR:
            return CommandOperation.CLEAR
        case CommandOperation.DELETE:
            return CommandOperation.DELETE
        case CommandOperation.REGISTER:
            return CommandOperation.REGISTER
        case CommandOperation.RENAME:
            return CommandOperation.RENAME
        case CommandOperation.VIEW:
            return CommandOperation.VIEW
        default:
            return CommandOperation.UNKNOWN
    }
}

async function start(): Promise<void> {

    // Define the local commands here
    let localCommands: {[command: string]: RESTPostAPIChatInputApplicationCommandsJSONBody | RESTPostAPIContextMenuApplicationCommandsJSONBody}[] = [
        // ChatCommandMetadata,
        // MessageCommandMetadata,
        // ...
    ];

    // Create the manager
    let manager = new CommandManager(process.env.BOT_TOKEN!, process.env.BOT_ID!, localCommands)

    // Select the proper command
    let command: CommandManagerFunction | undefined = undefined;

    // Select the right command
    switch (toCommandOperation(process.argv[3])) {
        case CommandOperation.VIEW: {
            command = new ViewFunction(await manager.getLocalCommandsOnRemote(), await manager.getLocalCommandsOnly(), await manager.getRemoteCommandsOnly());
            break;
        }
        case CommandOperation.REGISTER: {
            command = new RegisterFunction(await manager.getLocalCommandsOnRemote(), await manager.getLocalCommandsOnly());
            break;
        }
        case CommandOperation.RENAME: {
            let oldName = process.argv[4];
            let newName = process.argv[5];
            if (!(oldName && newName)) {
                Logger.error(LogMessageTemplates.error.commandActionRenameMissingArg);
                break;
            }
            command = new RenameFunction(await manager.getRemoteCommands(), oldName, newName);
            break;
        }
        case CommandOperation.DELETE: {
            let commandName = process.argv[4]
            if (!commandName) {
                Logger.error(LogMessageTemplates.error.commandActionDeleteMissingArg);
                break;
            }
            command = new DeleteFunction(await manager.getRemoteCommands(), commandName);
            break;
        }
        case CommandOperation.CLEAR: {
            command = new ClearFunction(await manager.getRemoteCommands());
            break;
        }
    }

    // Run the command if it's valid
    if(command) {
        manager.executeCommand(command);
    }
}

// if any errors occur, log them this way
process.on('unhandledRejection', (reason, _promise) => {
    Logger.error(LogMessageTemplates.error.unhandledRejection, reason);
});

// Start the system
start().catch(error => {
    Logger.error(LogMessageTemplates.error.unspecified, error);
});
