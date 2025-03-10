import {
    DiscordAPIError,
    RESTJSONErrorCodes as DiscordApiErrors,
    Message,
    MessageReaction,
    User
} from 'discord.js'

import type {
    PartialMessage,
    PartialMessageReaction,
    PartialUser
} from 'discord.js'

const IGNORED_ERRORS = [
    DiscordApiErrors.UnknownMessage,
    DiscordApiErrors.UnknownChannel,
    DiscordApiErrors.UnknownGuild,
    DiscordApiErrors.UnknownUser,
    DiscordApiErrors.UnknownInteraction,
    DiscordApiErrors.MissingAccess,
]

/**
 * These are utility functions for dealing with Discord.js Partials
 */
export class PartialUtils {
    public static async fillUser(user: User | PartialUser): Promise<User | undefined> {
        if (user.partial) {
            try {
                return await user.fetch()
            } catch (error) {
                if (
                    error instanceof DiscordAPIError &&
                    typeof error.code == 'number' &&
                    IGNORED_ERRORS.includes(error.code)
                ) {
                    return undefined
                } else {
                    throw error
                }
            }
        }

        return user as User
    }

    public static async fillMessage(msg: Message | PartialMessage): Promise<Message | undefined> {
        if (msg.partial) {
            try {
                return await msg.fetch()
            } catch (error) {
                if (
                    error instanceof DiscordAPIError &&
                    typeof error.code == 'number' &&
                    IGNORED_ERRORS.includes(error.code)
                ) {
                    return undefined
                } else {
                    throw error
                }
            }
        }

        return msg as Message
    }

    public static async fillReaction(
        msgReaction: MessageReaction | PartialMessageReaction
    ): Promise<MessageReaction> {
        if (msgReaction.partial) {
            try {
                msgReaction = await msgReaction.fetch()
            } catch (error) {
                if (
                    error instanceof DiscordAPIError &&
                    typeof error.code == 'number' &&
                    IGNORED_ERRORS.includes(error.code)
                ) {
                    return
                } else {
                    throw error
                }
            }
        }

        msgReaction.message = await this.fillMessage(msgReaction.message)
        if (!msgReaction.message) {
            return 
        }

        return msgReaction as MessageReaction
    }
}
