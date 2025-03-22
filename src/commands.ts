import { Logger } from "./services/logger"
import LogMessageTemplates from "../lang/logMessageTemplates.json"
import { REST, Routes, type RESTGetAPIApplicationCommandsResult, type RESTPostAPIChatInputApplicationCommandsJSONBody, type RESTPostAPIContextMenuApplicationCommandsJSONBody } from "discord.js";
import config from '../config/config.json'

async function start(): Promise<void> {
    try {
        let localCmds: {[command: string]: RESTPostAPIChatInputApplicationCommandsJSONBody}[] = [
            // ...Object.values(ChatCommandMetadata),
            // ...Object.values(MessageCommandMetadata).sort((a, b) => (a.name > b.name ? 1 : -1)),
            // ...Object.values(UserCommandMetadata).sort((a, b) => (a.name > b.name ? 1 : -1)),
        ];

        // (RESTPostAPIChatInputApplicationCommandsJSONBody | RESTPostAPIContextMenuApplicationCommandsJSONBody)[]

        // Sort all command metadata alphabetically for each command
        let sortedLocalCmds = localCmds.map((obj) => Object.values(obj).sort((a, b) => (a.name > b.name ? 1 : -1)))

        // Create the discord rest object
        let rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN!);

        // ???
        let remoteCmds = (await rest.get(
            Routes.applicationCommands(process.env.CLIENT_ID!)
        )) as RESTGetAPIApplicationCommandsResult;

        //
        let localCmdsOnRemote = localCmds.filter(localCmd =>
            remoteCmds.some(remoteCmd => remoteCmd.name === localCmd.name)
        );
        let localCmdsOnly = localCmds.filter(
            localCmd => !remoteCmds.some(remoteCmd => remoteCmd.name === localCmd.name)
        );
        let remoteCmdsOnly = remoteCmds.filter(
            remoteCmd => !localCmds.some(localCmd => localCmd.name === remoteCmd.name)
        );


    } catch (error) {
        Logger.error(Logs.error.commandAction, error);
    }
    // Wait for any final logs to be written.
    await new Promise(resolve => setTimeout(resolve, 1000));
}

process.on('unhandledRejection', (reason, _promise) => {
    Logger.error(LogMessageTemplates.error.unhandledRejection, reason);
});

start().catch(error => {
    Logger.error(LogMessageTemplates.error.unspecified, error);
});
