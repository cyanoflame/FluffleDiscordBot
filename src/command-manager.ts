import { Logger } from "./services/logger"
import LogMessageTemplates from "../lang/logMessageTemplates.json"
import { REST, Routes, type APIApplicationCommand, type RESTGetAPIApplicationCommandsResult, type RESTPatchAPIApplicationCommandJSONBody, type RESTPostAPIApplicationCommandsJSONBody, type RESTPostAPIChatInputApplicationCommandsJSONBody, type RESTPostAPIContextMenuApplicationCommandsJSONBody } from "discord.js";
import config from '../config/config.json'

/**
 * The potential operations that can be done with the command manager.
 * CLEAR =
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
    try {
        let localCmds: {[command: string]: RESTPostAPIChatInputApplicationCommandsJSONBody | RESTPostAPIContextMenuApplicationCommandsJSONBody}[] = [
            // ...Object.values(ChatCommandMetadata),
            // ...Object.values(MessageCommandMetadata).sort((a, b) => (a.name > b.name ? 1 : -1)),
            // ...Object.values(UserCommandMetadata).sort((a, b) => (a.name > b.name ? 1 : -1)),
        ];

        // Sort all command metadata alphabetically for each command
        let sortedLocalCmdsArgs: (RESTPostAPIChatInputApplicationCommandsJSONBody | RESTPostAPIContextMenuApplicationCommandsJSONBody)[] = []
        localCmds.forEach((cmdArgs) => Object.values(cmdArgs).sort((a, b) => (a.name > b.name ? 1 : -1)).forEach(sortedArg => sortedLocalCmdsArgs.push(sortedArg)))

        // Create the discord rest object
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

        // Perform the operation
        switch (operation) {
            case CommandOperation.VIEW: {
                Logger.info(
                    LogMessageTemplates.info.commandActionView
                        .replaceAll(
                            '{LOCAL_AND_REMOTE_LIST}',
                            formatCommandList(localCmdsOnRemote)
                        )
                        .replaceAll('{LOCAL_ONLY_LIST}', formatCommandList(localCmdsOnly))
                        .replaceAll('{REMOTE_ONLY_LIST}', formatCommandList(remoteCmdsOnly))
                );
                return;
            }
            case CommandOperation.REGISTER: {
                if (localCmdsOnly.length > 0) {
                    Logger.info(
                        LogMessageTemplates.info.commandActionCreating.replaceAll(
                            '{COMMAND_LIST}',
                            formatCommandList(localCmdsOnly)
                        )
                    );
                    for (let localCmd of localCmdsOnly) {
                        await rest.post(Routes.applicationCommands(process.env.BOT_ID!), {
                            body: localCmd,
                        });
                    }
                    Logger.info(LogMessageTemplates.info.commandActionCreated);
                }

                if (localCmdsOnRemote.length > 0) {
                    Logger.info(
                        LogMessageTemplates.info.commandActionUpdating.replaceAll(
                            '{COMMAND_LIST}',
                            formatCommandList(localCmdsOnRemote)
                        )
                    );
                    for (let localCmd of localCmdsOnRemote) {
                        await rest.post(Routes.applicationCommands(process.env.BOT_ID!), {
                            body: localCmd,
                        });
                    }
                    Logger.info(LogMessageTemplates.info.commandActionUpdated);
                }

                return;
            }
            case CommandOperation.RENAME: {
                let oldName = args[4];
                let newName = args[5];
                if (!(oldName && newName)) {
                    Logger.error(LogMessageTemplates.error.commandActionRenameMissingArg);
                    return;
                }

                let remoteCmd = remoteCmds.find(remoteCmd => remoteCmd.name == oldName);
                if (!remoteCmd) {
                    Logger.error(
                        LogMessageTemplates.error.commandActionNotFound.replaceAll('{COMMAND_NAME}', oldName)
                    );
                    return;
                }

                Logger.info(
                    LogMessageTemplates.info.commandActionRenaming
                        .replaceAll('{OLD_COMMAND_NAME}', remoteCmd.name)
                        .replaceAll('{NEW_COMMAND_NAME}', newName)
                );
                let body: RESTPatchAPIApplicationCommandJSONBody = {
                    name: newName,
                };
                await rest.patch(Routes.applicationCommand(process.env.BOT_ID!, remoteCmd.id), {
                    body,
                });
                Logger.info(LogMessageTemplates.info.commandActionRenamed);
                return;
            }
            case CommandOperation.DELETE: {
                let name = args[4];
                if (!name) {
                    Logger.error(LogMessageTemplates.error.commandActionDeleteMissingArg);
                    return;
                }

                let remoteCmd = remoteCmds.find(remoteCmd => remoteCmd.name == name);
                if (!remoteCmd) {
                    Logger.error(
                        LogMessageTemplates.error.commandActionNotFound.replaceAll('{COMMAND_NAME}', name)
                    );
                    return;
                }

                Logger.info(
                    LogMessageTemplates.info.commandActionDeleting.replaceAll('{COMMAND_NAME}', remoteCmd.name)
                );
                await rest.delete(Routes.applicationCommand(process.env.BOT_ID!, remoteCmd.id));
                Logger.info(LogMessageTemplates.info.commandActionDeleted);
                return;
            }
            case CommandOperation.CLEAR: {
                Logger.info(
                    LogMessageTemplates.info.commandActionClearing.replaceAll(
                        '{COMMAND_LIST}',
                        formatCommandList(remoteCmds)
                    )
                );
                await rest.put(Routes.applicationCommands(process.env.BOT_ID!), { body: [] });
                Logger.info(LogMessageTemplates.info.commandActionCleared);
                return;
            }
        }


    } catch (error) {
        Logger.error(LogMessageTemplates.error.commandAction, error);
    }
    // Wait for any final logs to be written.
    await new Promise(resolve => setTimeout(resolve, 1000));
}

process.on('unhandledRejection', (reason, _promise) => {
    Logger.error(LogMessageTemplates.error.unhandledRejection, reason);
});

// Start the system
start(toCommandOperation(process.argv[3])).catch(error => {
    Logger.error(LogMessageTemplates.error.unspecified, error);
});
