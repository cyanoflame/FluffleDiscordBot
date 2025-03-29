import {
    AutocompleteInteraction,
    ButtonInteraction,
    ChatInputCommandInteraction,
    Client,
    CommandInteraction,
    Events,
    Guild,
    Message,
    MessageReaction,
    NewsChannel,
    RESTEvents,
    TextChannel,
    ThreadChannel,
    User
} from "discord.js"

import type {
    Channel,
    ClientOptions,
    Interaction,
    PartialMessageReaction,
    PartialUser,
    RateLimitData,
} from "discord.js"

import { Logger } from "../services/logger"

import LogMessageTemplates from "../../lang/logMessageTemplates.json"
import { PartialUtils } from "../utils/partialUtils"
import type { MsgTrigger } from "../msgTriggers/MsgTrigger"
import type { EventDataService } from "../services/eventDataService"
import type { Command } from "../commands/Command"
import type { SlashCommand } from "../commands/slash/SlashCommand"

/**
 * This class is used for the
 */
class DiscordBot {
    /** The Discord Client/bot itself */
    private client: Client
    /** Whether or not the bot is connected, setup and ready to work */
    private ready = false
    /** The discord bot token */
    private token: string

    /** The current list of active message triggers */
    private msgTriggers: MsgTrigger[]

    /** This is a placeholder while I figure out a better way of implementing it. */
    private eventDataService: EventDataService
    
    // /** The handler that runs when the bot joins a guild */
    // private guildJoinHandler: GuildJoinHandler
    // /** The handler that runs when a bot leaves a guild */
    // private guildLeaveHandler: GuildLeaveHandler
    // /** The handler that deals with responding to messages/triggers */
    // // private messageHandlers: MessageHandler
    // /** The handler that deals with responding to commands */
    // private commandHandler: CommandHandler
    // /** The handler that deals with responding to buttons */
    // private buttonHandler: ButtonHandler
    // /** The handler that deals with responding to reactions */
    // private reactionHandler: ReactionHandler

    /**
     * This contstructs the discord bot object.
     * @param options The options unique to the discord bot Client being used.
     * @param token The discord bot token.
     */
    constructor( 
        options: ClientOptions,
        token: string, 
        eventDataService: EventDataService // WILL BE REMOVED
    ) {
        // Create the discord bot object
        this.client = new Client(options)
        // Store the bot token
        this.token = token

        // Create the message trigger map
        this.msgTriggers = []

        // TEMPORARY
        this.eventDataService = eventDataService
        
        // this.guildJoinHandler = guildJoinHandler
        // this.guildLeaveHandler = guildLeaveHandler
        // this.messageHandler = messageHandler
        // this.commandHandler = commandHandler
        // this.buttonHandler = buttonHandler
        // this.reactionHandler = reactionHandler
    }

    /**
     * This method starts the bot and connects it to Discord to run.
     */
    public async start(): Promise<void> {
        this.registerListeners()
        await this.login(this.token)
    }

    /**
     * This method is used to setup the listeners used for the bot so that it responds to events.
     */
    private registerListeners(): void {
        this.client.on(Events.ClientReady, () => this.onReady())
        // this.client.on(Events.ShardReady, (shardId: number, unavailableGuilds: Set<string>) =>
        //     this.onShardReady(shardId, unavailableGuilds)
        // )
        // this.client.on(Events.GuildCreate, (guild: Guild) => this.onGuildJoin(guild))
        // this.client.on(Events.GuildDelete, (guild: Guild) => this.onGuildLeave(guild))
        // MessageTriggers
        this.client.on(Events.MessageCreate, (msg: Message) => this.onMessage(msg))
        // Commands
        this.client.on(Events.InteractionCreate, (interaction: Interaction) => this.onInteraction(interaction))
        // this.client.on(
        //     Events.MessageReactionAdd,
        //     (messageReaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) =>
        //         this.onReaction(messageReaction, user)
        // )
        // this.client.rest.on(RESTEvents.RateLimited, (rateLimitData: RateLimitData) =>
        //     this.onRateLimit(rateLimitData)
        // )
    }

    /**
     * Used to log the Discord bot in with the token to have it work.
     * @param token The bot token for the bot to get it to work.
     */
    private async login(token: string): Promise<void> {
        try {
            await this.client.login(token)
        } catch (error) {
            Logger.error(LogMessageTemplates.error.clientLogin, error)
            return
        }
    }

    private async onReady(): Promise<void> {
        let userTag = this.client.user?.tag
        Logger.info(LogMessageTemplates.info.clientLogin.replaceAll('{USER_TAG}', userTag ?? "[undefined]"))

        this.ready = true
        Logger.info(LogMessageTemplates.info.clientReady)
    }

    // private onShardReady(shardId: number, _unavailableGuilds: Set<string>): void {
    //     Logger.setShardId(shardId)
    // }

    // private async onGuildJoin(guild: Guild): Promise<void> {
    //     if (!this.ready){ // || Debug.dummyMode.enabled) {
    //         return
    //     }

    //     try {
    //         await this.guildJoinHandler.process(guild)
    //     } catch (error) {
    //         Logger.error(LogMessageTemplates.error.guildJoin, error)
    //     }
    // }

    // private async onGuildLeave(guild: Guild): Promise<void> {
    //     if (!this.ready) { // || Debug.dummyMode.enabled) {
    //         return
    //     }

    //     try {
    //         await this.guildLeaveHandler.process(guild)
    //     } catch (error) {
    //         Logger.error(LogMessageTemplates.error.guildLeave, error)
    //     }
    // }

    /**
     * This method is used to add a MsgTrigger to the bot for it to use.
     * @param msgTrigger The msgTrigger that will be added to the bot to be used.
     * @returns the command index in the msgTrigger array, which could be used to remove it.
     */
    public addMsgTrigger(msgTrigger: MsgTrigger): number {
        // Add to the array
        this.msgTriggers.push(msgTrigger)
        // Return the index it was inserted at
        return this.msgTriggers.length - 1
    }

    /**
     * This method is used to remove a MsgTrigger specified by its index in the array. Removing it will make the bot
     * no longer check for/use it.
     * @param index The index of the msgTrigger being removed from the array storing them. This should've been 
     * returned when it was added.
     * @returns whether or not it was removed successfully or not. It will return false if the index is out of bounds.
     */
    public removeMsgTriggerIndex(index: number): boolean {
        if(this.msgTriggers[index] != undefined) {
            this.msgTriggers = this.msgTriggers.splice(index, 1)
            return true
        }
        return false
    }

    /**
     * This method is used to remove a MsgTrigger specified by the object itself. Removing it will make the bot
     * no longer check for/use it.
     * @param msgTrigger The message trigger object itself that's being removed from the array storing them.
     * @returns @returns whether or not it was removed successfully or not. It will return false if it did not exist in the array.
     */
    public removeMsgTrigger(msgTrigger: MsgTrigger): boolean {
        // Get the index of it
        let index = this.msgTriggers.indexOf(msgTrigger)
        return this.removeMsgTriggerIndex(index)
    }

    /**
     * This is the method that's called when a message is checked by the bot. It will check all of the MsgTriggers in the 
     * array and run any of them that are active.
     * @param msg The message being checked by the bot.
     */
    private async onMessage(msg: Message): Promise<void> {
        // Do not do anything if the bot is not ready, and do not respond 
        // to anything from the bot itself or the system
        if(!this.ready || msg.system || msg.author.id === msg.client.user?.id) {
            return
        }
        try {
            // Attempt to get the message if a partial for it is being checked
            let msgPartial = await PartialUtils.fillMessage(msg)
            if (!msgPartial) {
                return
            }

            // Find the msgTriggers that are current active
            let activeMsgTrigger = this.msgTriggers.filter(msgTrigger => {
                if (msgTrigger.isGuildRequired() && !msg.guild) {
                    return false
                }
    
                if (!msgTrigger.triggered(msg)) {
                    return false
                }

                return true
            })

            // If this message causes no triggers then return
            if (activeMsgTrigger.length === 0) {
                return
            }

            // Get data from database --> moved to the event object themselves
            let data = await this.eventDataService.create({
                user: msg.author,
                channel: msg.channel,
                guild: msg.guild ?? undefined,
            })

            // Execute triggers
            for (let msgTrigger of activeMsgTrigger) {
                await msgTrigger.execute(this.client, msg, data);
            }
        } catch (error) {
            Logger.error(LogMessageTemplates.error.message, error)
        }
    }

    private async onInteraction(interaction: Interaction): Promise<void> {
        // Do not do anything if the bot is not ready, and do not respond 
        // to anything from the bot itself or the system
        if (!this.ready || interaction.user.id === interaction.client.user?.id || interaction.user.bot) {
            return
        }

        // If running a command or autocompleteInteraction
        if (interaction instanceof CommandInteraction || interaction instanceof AutocompleteInteraction) {
            try {
                let commandParts = interaction instanceof ChatInputCommandInteraction || interaction instanceof AutocompleteInteraction ? 
                    [
                        interaction.commandName,
                        interaction.options.getSubcommandGroup(false),
                        interaction.options.getSubcommand(false),
                    ].filter(Boolean)
                    : [interaction.commandName];
                let commandName = commandParts.join(' ');

                // Try to find the command the user wants
                // let command = CommandUtils.findCommand(this.commands, commandParts);
                let command: Command = undefined as unknown as Command // TEMPORARY
                // ^^ MOVING TO COMMANDSTORE OBJECT

                if (!command) {
                    Logger.error(
                        LogMessageTemplates.error.commandNotFound
                            .replaceAll('{INTERACTION_ID}', interaction.id)
                            .replaceAll('{COMMAND_NAME}', commandName)
                    );
                    return;
                }

                // autocomplete interaction
                if (interaction instanceof AutocompleteInteraction) {
                    // if (!command.autocomplete) {
                    //     Logger.error(
                    //         LogMessageTemplates.error.autocompleteNotFound
                    //             .replaceAll('{INTERACTION_ID}', interaction.id)
                    //             .replaceAll('{COMMAND_NAME}', commandName)
                    //     );
                    //     return;
                    // }
        
                    try {
                        let option = interaction.options.getFocused(true);
                        let choices = await (command as SlashCommand).autocomplete(interaction, option);
                        // await InteractionUtils.respond(
                        //     interaction,
                        //     choices?.slice(0, DiscordLimits.CHOICES_PER_AUTOCOMPLETE)
                        // );
                    } catch (error) {
                        Logger.error(
                            interaction.channel instanceof TextChannel ||
                            interaction.channel instanceof NewsChannel ||
                            interaction.channel instanceof ThreadChannel
                                ? LogMessageTemplates.error.autocompleteGuild
                                      .replaceAll('{INTERACTION_ID}', interaction.id)
                                      .replaceAll('{OPTION_NAME}', commandName)
                                      .replaceAll('{COMMAND_NAME}', commandName)
                                      .replaceAll('{USER_TAG}', interaction.user.tag)
                                      .replaceAll('{USER_ID}', interaction.user.id)
                                      .replaceAll('{CHANNEL_NAME}', interaction.channel.name)
                                      .replaceAll('{CHANNEL_ID}', interaction.channel.id)
                                      .replaceAll('{GUILD_NAME}', interaction.guild?.name ?? "UNDEFINED")
                                      .replaceAll('{GUILD_ID}', interaction.guild?.id ?? "UNDEFINED")
                                : LogMessageTemplates.error.autocompleteOther
                                      .replaceAll('{INTERACTION_ID}', interaction.id)
                                      .replaceAll('{OPTION_NAME}', commandName)
                                      .replaceAll('{COMMAND_NAME}', commandName)
                                      .replaceAll('{USER_TAG}', interaction.user.tag)
                                      .replaceAll('{USER_ID}', interaction.user.id),
                            error
                        );
                    }
                    return;
                } else {
                    // For any command interactions

                    // Check for permissions (this could be imp0lemented as a proxy class as well if necessary)
                    if(command.canUseCommand(interaction)) {

                        // Get the event data
                        let data = await this.eventDataService.create({
                            user: interaction.client.user,
                            channel: interaction.channel ? interaction.channel as Channel : undefined,
                            guild: interaction.guild ?? undefined,
                        });

                        // Check the command permissions for the user
                        command.execute(interaction, data);
                    } else {
                        // if the user is unable to use the command, tell them why
                        // await InteractionUtils.send(
                        //     intr,
                        //     Lang.getEmbed('validationEmbeds.missingClientPerms', data.lang, {
                        //         PERMISSIONS: command.requireClientPerms
                        //             .map(perm => `**${Permission.Data[perm].displayName(data.lang)}**`)
                        //             .join(', '),
                        //     })
                        // );
                    }
                }
            } catch (error) {
                Logger.error(LogMessageTemplates.error.command, error)
            }
        }

        // else if (interaction instanceof ButtonInteraction) {
        //     try {
        //         await this.buttonHandler.process(interaction)
        //     } catch (error) {
        //         Logger.error(LogMessageTemplates.error.button, error)
        //     }
        // }
    }

    // private async onReaction(
    //     msgReaction: MessageReaction | PartialMessageReaction,
    //     reactor: User | PartialUser
    // ): Promise<void> {
    //     if (
    //         !this.ready ||
    //         (Debug.dummyMode.enabled && !Debug.dummyMode.whitelist.includes(reactor.id))
    //     ) {
    //         return
    //     }

    //     try {
    //         msgReaction = await PartialUtils.fillReaction(msgReaction)
    //         if (!msgReaction) {
    //             return
    //         }

    //         reactor = await PartialUtils.fillUser(reactor)
    //         if (!reactor) {
    //             return
    //         }

    //         await this.reactionHandler.process(
    //             msgReaction,
    //             msgReaction.message as Message,
    //             reactor
    //         )
    //     } catch (error) {
    //         Logger.error(LogMessageTemplates.error.reaction, error)
    //     }
    // }

    // private async onRateLimit(rateLimitData: RateLimitData): Promise<void> {
    //     if(rateLimitData.timeToReset >= Config.logging.rateLimit.minTimeout * 1000) {
    //         Logger.error(LogMessageTemplates.error.apiRateLimit, rateLimitData)
    //     }
    // }
}


export {
    DiscordBot
}
