import {
    AutocompleteInteraction,
    ButtonInteraction,
    ChatInputCommandInteraction,
    Client,
    CommandInteraction,
    EmbedBuilder,
    Events,
    Guild,
    Message,
    MessageReaction,
    NewsChannel,
    resolveColor,
    RESTEvents,
    TextChannel,
    ThreadChannel,
    User
} from "discord.js"

import type {
    Channel,
    ClientOptions,
    ColorResolvable,
    Interaction,
    InteractionReplyOptions,
    PartialMessageReaction,
    PartialUser,
    RateLimitData,
} from "discord.js"

import { Logger } from "../services/logger"

import { PartialUtils } from "../utils/partialUtils"
import type { MessageTrigger } from "../messageTriggers/MessageTrigger"
import type { EventDataService } from "../services/eventDataService"
import { CommandDeferType, type Command } from "../commands/Command"
import type { SlashCommand } from "../commands/slash/SlashCommand"
import { CommandError } from "../commands/CommandError"

import LogMessageTemplates from "../../lang/logMessageTemplates.json"
import CommonLanguageElements from "../../lang/common.json"
import { CommandStore } from "./CommandStore"
import { DiscordLimits } from "../constants/DiscordLimits"

/**
 * This class is used for the
 */
class DiscordBot {
    /** The Discord Client/bot itself */
    private client: Client;

    /** Whether or not the bot is connected, setup and ready to work */
    private ready = false;

    /** The discord bot token */
    private token: string;

    /** The current list of active message triggers */
    private messageTriggers: MessageTrigger[];

    /** This is where the commands used by the bot are stored */
    private commands: CommandStore;

    /** This is a placeholder while I figure out a better way of implementing it. */
    private eventDataService: EventDataService;

    
    // /** The handler that runs when the bot joins a guild */
    // private guildJoinHandler: GuildJoinHandler
    // /** The handler that runs when a bot leaves a guild */
    // private guildLeaveHandler: GuildLeaveHandler
    // /** The handler that deals with responding to messages/triggers */
    // // private messageHandlers: MessageHandler
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
        this.messageTriggers = []

        // Create the command storage
        this.commands = new CommandStore();

        // TEMPORARY
        this.eventDataService = eventDataService
        
        // this.guildJoinHandler = guildJoinHandler
        // this.guildLeaveHandler = guildLeaveHandler
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
        this.client.on(Events.MessageCreate, (msg: Message) => this.onMessage(msg));
        // Interactions (commands & buttons)
        this.client.on(Events.InteractionCreate, (interaction: Interaction) => this.onInteraction(interaction));
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
     * This method is used to add a MessageTrigger to the bot for it to use.
     * @param messageTrigger The messageTrigger that will be added to the bot to be used.
     * @returns the command index in the messageTrigger array, which could be used to remove it.
     */
    public addMessageTrigger(messageTrigger: MessageTrigger): number {
        // Add to the array
        this.messageTriggers.push(messageTrigger)
        // Return the index it was inserted at
        return this.messageTriggers.length - 1
    }

    /**
     * This method is used to remove a MessageTrigger specified by its index in the array. Removing it will make the bot
     * no longer check for/use it.
     * @param index The index of the messageTrigger being removed from the array storing them. This was returned when 
     * it was added. Otherwise, you can remove it by referencing the object itself.
     * @returns whether or not it was removed successfully or not. It will return false if the index is out of bounds.
     */
    public removeMessageTriggerIndex(index: number): boolean {
        if(this.messageTriggers[index] != undefined) {
            this.messageTriggers = this.messageTriggers.splice(index, 1)
            return true
        }
        return false
    }

    /**
     * This method is used to remove a MessageTrigger specified by the object itself. Removing it will make the bot
     * no longer check for/use it.
     * @param messageTrigger The message trigger object itself that's being removed from the array storing them.
     * @returns @returns whether or not it was removed successfully or not. It will return false if it did not exist in the array.
     */
    public removeMessageTrigger(messageTrigger: MessageTrigger): boolean {
        // Get the index of it
        let index = this.messageTriggers.indexOf(messageTrigger)
        return this.removeMessageTriggerIndex(index)
    }

    /**
     * This is the method that's called when a message is checked by the bot. It will check all of the MessageTriggers in the 
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

            // Find the messageTriggers that are current active
            // let activeMessageTrigger = this.messageTriggers.filter(messageTrigger => {
            //     if (messageTrigger.isGuildRequired() && !msg.guild) {
            //         return false
            //     }

            //     return messageTrigger.triggered(msg)
            // })
            let activeMessageTriggers: MessageTrigger[] = []
            for(const messageTrigger of this.messageTriggers) {
                // if message requires a guild and there isn' tone
                if (messageTrigger.isGuildRequired() && !msg.guild) {
                    continue;
                }
                // check which message triggers are active
                if(await messageTrigger.triggered(msg)) {
                    activeMessageTriggers.push(messageTrigger);
                }
            }

            // If this message causes no triggers then return
            if (activeMessageTriggers.length === 0) {
                return
            }

            // Get data from database --> moved to the event object themselves
            let data = await this.eventDataService.create({
                user: msg.author,
                channel: msg.channel,
                guild: msg.guild ?? undefined,
            })

            // Execute triggers
            for (let messageTrigger of activeMessageTriggers) {
                await messageTrigger.execute(this.client, msg, data);
            }
        } catch (error) {
            Logger.error(LogMessageTemplates.error.message, error)
        }
    }

    /**
     * This is the method that's called when any interaction is checked by the bot. Interactions include commands,
     * autocomplete commands, and button interactions.
     * @param interaction The interaction being checked by the bot.
     */
    private async onInteraction(interaction: Interaction): Promise<void> {
        // Do not do anything if the bot is not ready, and do not respond 
        // to anything from the bot itself or the system
        if (!this.ready || interaction.user.id === interaction.client.user?.id || interaction.user.bot) {
            return
        }

        // if the interaction is a command or autocompleteInteraction
        if (interaction.isAutocomplete() || interaction.isCommand()) {
            await this.onCommand(interaction);
        } else 
        // if the interaction originated from a button
        if (interaction instanceof ButtonInteraction) {
            throw new Error("NOT IMPLEMENTED YET");
            // await this.onButtonInteraction(interaction);

            // try {
            //     await this.buttonHandler.process(interaction)
            // } catch (error) {
            //     // log the error from the interaction
            //     Logger.error(LogMessageTemplates.error.button, error)
            // }
        }
    }

    /**
     * This method is used to add a Command to the bot for it to use.
     * @param command The command that will be added to the bot to be used.
     * @returns The index of the command in the command collection, which could be used to remove it.
     */
    public addCommand(command: Command): number {
        return this.commands.addCommand(command);
    }

    /**
     * This method is used to remove a Command specified by its index in the array. Removing it will make the bot
     * no longer check for/use it.
     * @param index The index of the command being removed from the command collection storing them. This was returned when 
     * it was added. Otherwise, you can remove it by referencing the object itself.
     * @returns Whether or not it was removed successfully or not. It will return false if the index is out of bounds.
     */
    public removeCommandIndex(index: number): boolean {
        return this.commands.removeCommandIndex(index);
    }

    /**
     * This method is used to remove a Command specified by the object itself. Removing it will make the bot
     * no longer check for/use it.
     * @param command The command object itself that's being removed from the array storing them.
     * @returns @returns Whether or not it was removed successfully or not. It will return false if it did not exist in the array.
     */
    public removeCommand(command: Command): boolean {
        return this.commands.removeCommand(command);
    }

    /**
     * This is the method that's called when any interaction is checked by the bot. Interactions include commands,
     * autocomplete commands, and button interactions.
     * @param interaction The interaction being checked by the bot.
     */
    private async onCommand(interaction: AutocompleteInteraction | CommandInteraction): Promise<void> {
        // Get the parts of the command to identify it
        let commandParts: string[] = [interaction.commandName]
        if(interaction.isChatInputCommand()|| interaction.isAutocomplete()) {
            let subcommandGroup = interaction.options.getSubcommandGroup(false);
            if(subcommandGroup != null) {
                commandParts.push(subcommandGroup)
            }
            let subcommand = interaction.options.getSubcommand(false);
            if(subcommand != null) {
                commandParts.push(subcommand)
            }
        }

        // try to find the command the user wants
        let command = this.commands.findCommand(commandParts);

        // Find the command name
        let commandName = commandParts.join(' ');

        // if there is no valid command found
        if (!command) {
            Logger.error(
                LogMessageTemplates.error.commandNotFound
                    .replaceAll('{INTERACTION_ID}', interaction.id)
                    .replaceAll('{COMMAND_NAME}', commandName)
            );
            return;
        }

        // autocomplete interaction
        if (interaction.isAutocomplete()) {
            try {
                // Get the potential options for a command to be autocompleted
                let option = interaction.options.getFocused(true);
                // Get the choices available for the auto complete options
                let choices = await (command as SlashCommand).autocomplete(interaction, option);
                // Respond with the auto complete options if there are any
                await interaction.respond(choices? choices.slice(0, DiscordLimits.CHOICES_PER_AUTOCOMPLETE) : []);
                
            } catch (error) {
                // Catch anyt autocomplete error
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
            try {
                // Check whether the command can be used or not
                await command.checkUsability(interaction);

                // Get the event data -- move this elsewhere
                let data = await this.eventDataService.create({
                    user: interaction.client.user,
                    channel: interaction.channel ? interaction.channel as Channel : undefined,
                    guild: interaction.guild ?? undefined,
                });

                // Check the command permissions for the user
                command.execute(this.client, interaction, data);
            } catch(err) {
                // if the user to run the command inform them why
                if(err instanceof CommandError) {
                    // // Get the event data
                    // let data = await this.eventDataService.create({
                    //     user: interaction.client.user,
                    //     channel: interaction.channel ? interaction.channel as Channel : undefined,
                    //     guild: interaction.guild ?? undefined,
                    // });

                    // Log the command error
                    Logger.error(LogMessageTemplates.error.command, err);
                    
                    // Respond to the commadn with the error response
                    await interaction.followUp({
                        flags: (command.getDeferType() == CommandDeferType.HIDDEN) ? "Ephemeral" : undefined, // maintain the defer type of the command
                        embeds: [
                            new EmbedBuilder({
                                description: err.message,
                                color: resolveColor(CommonLanguageElements.colors.warning as ColorResolvable),
                            })
                        ],
                        withResponse: !(interaction.deferred || interaction.replied)
                    });
                } else {
                    // if any other error, propagate the error
                    throw err;
                }
            }
        }
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
