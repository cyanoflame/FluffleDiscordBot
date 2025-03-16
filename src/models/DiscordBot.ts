import {
    AutocompleteInteraction,
    ButtonInteraction,
    Client,
    CommandInteraction,
    Events,
    Guild,
    Message,
    MessageReaction,
    RESTEvents,
    User
} from "discord.js"

import type {
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
        this.client.on(Events.MessageCreate, (msg: Message) => this.onMessage(msg))
        // this.client.on(Events.InteractionCreate, (intr: Interaction) => this.onInteraction(intr))
        // this.client.on(
        //     Events.MessageReactionAdd,
        //     (messageReaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) =>
        //         this.onReaction(messageReaction, user)
        // )
        // this.client.rest.on(RESTEvents.RateLimited, (rateLimitData: RateLimitData) =>
        //     this.onRateLimit(rateLimitData)
        // )
    }

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

        // if (!Debug.dummyMode.enabled) {
        //     this.jobService.start()
        // }

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
        // Do not do anything if the bot is not ready
        if(!this.ready) {
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
                if (msgTrigger.requireGuild && !msg.guild) {
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
                await msgTrigger.execute(msg, data);
            }
        } catch (error) {
            Logger.error(LogMessageTemplates.error.message, error)
        }
    }

    // private async onInteraction(intr: Interaction): Promise<void> {
    //     if (
    //         !this.ready ||
    //         (Debug.dummyMode.enabled && !Debug.dummyMode.whitelist.includes(intr.user.id))
    //     ) {
    //         return
    //     }

    //     if (intr instanceof CommandInteraction || intr instanceof AutocompleteInteraction) {
    //         try {
    //             await this.commandHandler.process(intr)
    //         } catch (error) {
    //             Logger.error(LogMessageTemplates.error.command, error)
    //         }
    //     } else if (intr instanceof ButtonInteraction) {
    //         try {
    //             await this.buttonHandler.process(intr)
    //         } catch (error) {
    //             Logger.error(LogMessageTemplates.error.button, error)
    //         }
    //     }
    // }

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
