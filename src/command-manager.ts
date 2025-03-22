import { Logger } from "./services/logger"
import LogMessageTemplates from "../lang/logMessageTemplates.json"
import { REST, Routes, type APIApplicationCommand, type RESTGetAPIApplicationCommandsResult, type RESTPatchAPIApplicationCommandJSONBody, type RESTPostAPIApplicationCommandsJSONBody, type RESTPostAPIChatInputApplicationCommandsJSONBody, type RESTPostAPIContextMenuApplicationCommandsJSONBody } from "discord.js";
import config from '../config/config.json'
import { CommandManager } from "./commandManager/CommandManager";

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

/**
 * This takes a list of commands and returns the names of all of them in a comma separated string.
 * For example: "cmd1, cmd2, cmd3"
 * @param cmds The list of commands to format into a readable string.
 * @returns Comma separated string of all the commands in the input list.
 */
function formatCommandList(cmds: RESTPostAPIApplicationCommandsJSONBody[] | APIApplicationCommand[]): string {
    return cmds.length > 0
        ? cmds.map((cmd: { name: string }) => `'${cmd.name}'`).join(', ')
        : 'N/A';
}

async function start(operation: CommandOperation): Promise<void> {

    let manager = new CommandManager(process.env.BOT_TOKEN!, process.env.BOT_ID!)

    // try {
        let localCmds: {[command: string]: RESTPostAPIChatInputApplicationCommandsJSONBody | RESTPostAPIContextMenuApplicationCommandsJSONBody}[] = [
            // ...Object.values(ChatCommandMetadata),
            // ...Object.values(MessageCommandMetadata).sort((a, b) => (a.name > b.name ? 1 : -1)),
            // ...Object.values(UserCommandMetadata).sort((a, b) => (a.name > b.name ? 1 : -1)),
        ];

        // Sort all command metadata alphabetically for each command
        let sortedLocalCmdsArgs: (RESTPostAPIChatInputApplicationCommandsJSONBody | RESTPostAPIContextMenuApplicationCommandsJSONBody)[] = []
        localCmds.forEach((cmdArgs) => Object.values(cmdArgs).sort((a, b) => (a.name > b.name ? 1 : -1)).forEach(sortedArg => sortedLocalCmdsArgs.push(sortedArg)))

        // // Create the discord rest object
        let rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN!);

        // Gets the commands that have previously been uploaded to the bot
        let remoteCmds = (await rest.get(
            Routes.applicationCommands(process.env.CLIENT_ID!)
        )) as RESTGetAPIApplicationCommandsResult;

        // Figure out which commands are local vs which are already uploaded to the bot for syncing properly

        // This creates a list of all of the local commands that already have been uploaded to the bot
        let localCmdsOnRemote = sortedLocalCmdsArgs.filter(localCmd =>
            remoteCmds.some(remoteCmd => remoteCmd.name === localCmd.name)
        );
        // This creates a list of all the local commands that do NOT exist/have been uploaded to the bot
        let localCmdsOnly = sortedLocalCmdsArgs.filter(
            localCmd => !remoteCmds.some(remoteCmd => remoteCmd.name === localCmd.name)
        );
        // This is a list of all the commands that ONLY exist/have been uploaded to the bot
        let remoteCmdsOnly = remoteCmds.filter(
            remoteCmd => !sortedLocalCmdsArgs.some(localCmd => localCmd.name === remoteCmd.name)
        );

    //     // Perform the operation
    //     switch (operation) {
    //         case CommandOperation.VIEW: {

    //             return;
    //         }
    //         case CommandOperation.REGISTER: {
                

    //             return;
    //         }
    //         case CommandOperation.RENAME: {
                
    //             return;
    //         }
    //         case CommandOperation.DELETE: {
                
    //             return;
    //         }
    //         case CommandOperation.CLEAR: {

    //             return;
    //         }
    //     }

    // } catch (error) {
    //     Logger.error(LogMessageTemplates.error.commandAction, error);
    // }
    
}

// if any errors occur, log them this way
process.on('unhandledRejection', (reason, _promise) => {
    Logger.error(LogMessageTemplates.error.unhandledRejection, reason);
});

// Start the system
start(toCommandOperation(process.argv[3])).catch(error => {
    Logger.error(LogMessageTemplates.error.unspecified, error);
});
