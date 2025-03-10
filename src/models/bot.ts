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
    Interaction,
    PartialMessageReaction,
    PartialUser,
    RateLimitData,
} from "discord.js"

import { Logger } from "../services/logger"

import LogMessageTemplates from "../../lang/logMessageTemplates.json"

/**
 * This class is used for the
 */
class Bot {
    /** Whether or not the bot is connected, setup and ready to work */
    private ready = false
    /** The discord bot token */
    private token: string
    /** The Discord Client/bot itself */
    private client: Client
    /** The handler that runs when the bot joins a guild */
    private guildJoinHandler: GuildJoinHandler
    /** The handler that runs when a bot leaves a guild */
    private guildLeaveHandler: GuildLeaveHandler
    /** The handler that deals with responding to messages/triggers */
    private messageHandler: MessageHandler
    /** The handler that deals with responding to commands */
    private commandHandler: CommandHandler
    /** The handler that deals with responding to buttons */
    private buttonHandler: ButtonHandler
    /** The handler that deals with responding to reactions */
    private reactionHandler: ReactionHandler

    /**
     * This contstructs the discord bot object.
     * @param token The discord bot token.
     * @param client 
     * @param guildJoinHandler 
     * @param guildLeaveHandler 
     * @param messageHandler 
     * @param commandHandler 
     * @param buttonHandler 
     * @param reactionHandler 
     */
    constructor( 
        token: string, 
        client: Client, 
        guildJoinHandler: GuildJoinHandler, 
        guildLeaveHandler: GuildLeaveHandler, 
        messageHandler: MessageHandler, 
        commandHandler: CommandHandler, 
        buttonHandler: ButtonHandler, 
        reactionHandler: ReactionHandler, 
    ) {
        this.token = token
        this.client = client
        this.guildJoinHandler = guildJoinHandler
        this.guildLeaveHandler = guildLeaveHandler
        this.messageHandler = messageHandler
        this.commandHandler = commandHandler
        this.buttonHandler = buttonHandler
        this.reactionHandler = reactionHandler
    }

    public async start(): Promise<void> {
        this.registerListeners()
        await this.login(this.token)
    }

    private registerListeners(): void {
        this.client.on(Events.ClientReady, () => this.onReady())
        this.client.on(Events.ShardReady, (shardId: number, unavailableGuilds: Set<string>) =>
            this.onShardReady(shardId, unavailableGuilds)
        )
        this.client.on(Events.GuildCreate, (guild: Guild) => this.onGuildJoin(guild))
        this.client.on(Events.GuildDelete, (guild: Guild) => this.onGuildLeave(guild))
        this.client.on(Events.MessageCreate, (msg: Message) => this.onMessage(msg))
        this.client.on(Events.InteractionCreate, (intr: Interaction) => this.onInteraction(intr))
        this.client.on(
            Events.MessageReactionAdd,
            (messageReaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) =>
                this.onReaction(messageReaction, user)
        )
        this.client.rest.on(RESTEvents.RateLimited, (rateLimitData: RateLimitData) =>
            this.onRateLimit(rateLimitData)
        )
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

    private onShardReady(shardId: number, _unavailableGuilds: Set<string>): void {
        Logger.setShardId(shardId)
    }

    private async onGuildJoin(guild: Guild): Promise<void> {
        if (!this.ready || Debug.dummyMode.enabled) {
            return
        }

        try {
            await this.guildJoinHandler.process(guild)
        } catch (error) {
            Logger.error(LogMessageTemplates.error.guildJoin, error)
        }
    }

    private async onGuildLeave(guild: Guild): Promise<void> {
        if (!this.ready || Debug.dummyMode.enabled) {
            return
        }

        try {
            await this.guildLeaveHandler.process(guild)
        } catch (error) {
            Logger.error(LogMessageTemplates.error.guildLeave, error)
        }
    }

    private async onMessage(msg: Message): Promise<void> {
        if (
            !this.ready ||
            (Debug.dummyMode.enabled && !Debug.dummyMode.whitelist.includes(msg.author.id))
        ) {
            return
        }

        try {
            msg = await PartialUtils.fillMessage(msg)
            if (!msg) {
                return
            }

            await this.messageHandler.process(msg)
        } catch (error) {
            Logger.error(LogMessageTemplates.error.message, error)
        }
    }

    private async onInteraction(intr: Interaction): Promise<void> {
        if (
            !this.ready ||
            (Debug.dummyMode.enabled && !Debug.dummyMode.whitelist.includes(intr.user.id))
        ) {
            return
        }

        if (intr instanceof CommandInteraction || intr instanceof AutocompleteInteraction) {
            try {
                await this.commandHandler.process(intr)
            } catch (error) {
                Logger.error(LogMessageTemplates.error.command, error)
            }
        } else if (intr instanceof ButtonInteraction) {
            try {
                await this.buttonHandler.process(intr)
            } catch (error) {
                Logger.error(LogMessageTemplates.error.button, error)
            }
        }
    }

    private async onReaction(
        msgReaction: MessageReaction | PartialMessageReaction,
        reactor: User | PartialUser
    ): Promise<void> {
        if (
            !this.ready ||
            (Debug.dummyMode.enabled && !Debug.dummyMode.whitelist.includes(reactor.id))
        ) {
            return
        }

        try {
            msgReaction = await PartialUtils.fillReaction(msgReaction)
            if (!msgReaction) {
                return
            }

            reactor = await PartialUtils.fillUser(reactor)
            if (!reactor) {
                return
            }

            await this.reactionHandler.process(
                msgReaction,
                msgReaction.message as Message,
                reactor
            )
        } catch (error) {
            Logger.error(LogMessageTemplates.error.reaction, error)
        }
    }

    private async onRateLimit(rateLimitData: RateLimitData): Promise<void> {
        if (rateLimitData.timeToReset >= Config.logging.rateLimit.minTimeout * 1000) {
            Logger.error(LogMessageTemplates.error.apiRateLimit, rateLimitData)
        }
    }
}
