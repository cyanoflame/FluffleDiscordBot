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

// Removed for now unless there is some significance in keeping them. Why would you ignore errors?
// const IGNORED_ERRORS = [
//     DiscordApiErrors.UnknownMessage,
//     DiscordApiErrors.UnknownChannel,
//     DiscordApiErrors.UnknownGuild,
//     DiscordApiErrors.UnknownUser,
//     DiscordApiErrors.UnknownInteraction,
//     DiscordApiErrors.MissingAccess,
// ]

/**
 * These are utility functions for dealing with Discord.js Partials
 */
export class PartialUtils {
    /**
     * Retrieve the full user from partial user data.
     * @param user The partial user to get all the data for.
     * @returns The full user information.
     */
    public static async fillUser(user: User | PartialUser): Promise<User> {
        if (user.partial) {
            try {
                return await user.fetch()
            } catch (error) {
                // if (
                //     error instanceof DiscordAPIError &&
                //     typeof error.code == 'number' &&
                //     IGNORED_ERRORS.includes(error.code)
                // ) {
                //     return
                // } else {
                    throw error
                // }
            }
        }

        return user as User
    }

    /**
     * Returns the whole message from the message partial.
     * @param msg The partial message to get all the data of.
     * @returns The full message data.
     */
    public static async fillMessage(msg: Message | PartialMessage): Promise<Message> {
        if (msg.partial) {
            try {
                return await msg.fetch()
            } catch (error) {
                // if (
                //     error instanceof DiscordAPIError &&
                //     typeof error.code == 'number' &&
                //     IGNORED_ERRORS.includes(error.code)
                // ) {
                //     return undefined
                // } else {
                    throw error
                // }
            }
        }

        return msg as Message
    }

    /**
     * Returns the whole reaction information from the message reaction partial.
     * @param msgReaction The message reaction partial to get all the data of.
     * @returns The full message reaction information.
     */
    public static async fillReaction(
        msgReaction: MessageReaction | PartialMessageReaction
    ): Promise<MessageReaction> {
        if (msgReaction.partial) {
            try {
                msgReaction = await msgReaction.fetch()
            } catch (error) {
                // if (
                //     error instanceof DiscordAPIError &&
                //     typeof error.code == 'number' &&
                //     IGNORED_ERRORS.includes(error.code)
                // ) {
                //     return
                // } else {
                    throw error
                // }
            }
        }

        // msgReaction.message = await this.fillMessage(msgReaction.message)
        // if (!msgReaction.message) {
        //     return 
        // }

        return msgReaction as MessageReaction
    }
}
