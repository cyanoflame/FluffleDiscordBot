// import type { Command, CommandDeferType } from '../../commands/Command'
// import type { Client, CommandInteraction, Interaction, Message, RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord.js'
// import type { EventData } from '../../models/eventData'
// import { Logger } from '../../services/logger'

import type { Command } from "../../commands/Command";
import type { SlashCommand } from "../../commands/slash/SlashCommand";
import { RateLimitProxy } from "../RateLimitProxy";

// import LogMessageTemplates from "../../../lang/logMessageTemplates.json"
// import { CommandError } from '../../commands/CommandError'
// import { RateLimiterAbstract, RateLimiterMemory } from 'rate-limiter-flexible'

// /**
//  * This class is an abstract proxy class used to create rate limiter proxiesfor commands. If looking to proxy a command, please see:
//  * SlashCommandRateLimitProxy for adding a rate limiters to any slash commands, MessageCommandRateLimitProxy for adding a rate limiter 
//  * to any message commands, and UserCommandRateLimitProxy for adding a rate limiter to any user commands.
//  */
// export abstract class CommandRateLimitProxy implements Command {

//     /** The rate limiter used for whatever event handler is making use of it */
//     private rateLimiter: RateLimiterAbstract

//     /** The reference to the proxied object */
//     private command: Command

//     /** The name of the proxy - used to identify it the proxy in logs */
//     private proxyName: string

//     /**
//      * Constructs the proxy.
//      * @param rateLimiter Either a reference to a rate limiter to use, or an object with the details make a new rate limiter, such that:
//      * rateLimitAmount - The amount of requests that can be made within an interval before limiting the rate ; and rateLimitInterval - The 
//      * time that a the amount of requests can be made in before triggering a rate limit,
//      * @param proxyName The name of the the proxy, used to identify it in logging.
//      * @param command The command object that is being rate limited.
//      */
//     constructor(rateLimiter: {rateLimitAmount: number, rateLimitInterval: number} | RateLimiterAbstract, proxyName: string, command: Command) {
//         // if the ratelimiter is predefined, then set that. Otherwise, make a new one
//         if(rateLimiter instanceof RateLimiterAbstract) {
//             // set the rate limiter reference
//             this.rateLimiter = rateLimiter
//         } else {
//             // Create the rate limiter object
//             this.rateLimiter = new RateLimiterMemory({
//                 points: rateLimiter.rateLimitAmount, 
//                 duration: rateLimiter.rateLimitInterval
//             })
//         }

//         // Store the reference to the proxied object
//         this.command = command

//         // Store the name of the proxy - used for logging
//         this.proxyName = proxyName
//     }

//     // /**
//     //  * Checks whether or not the user is rate limited. Haven't tested/used it yet though.
//     //  * @param userId The user id being checked for being rate limited.
//     //  * @returns whether or not the user is currently rate limited.
//     //  */
//     // public async isRateLimited(userId: string): Promise<boolean> {
//     //     return this.rateLimiter.get(userId).then(rateLimitRes => {
//     //         // User token is not in the list -- is not rate limtied
//     //         if(rateLimitRes == null) {
//     //             return false;
//     //         }
//     //         return rateLimitRes.remainingPoints == 0 && rateLimitRes.msBeforeNext != 0
//     //     })
//     // }

//     /**
//      * Increments the rate limit count for the user and returns whether or not a user is rate limited.
//      * @param userId The user id being checked for being rate limited.
//      * @returns whether or not the user is currently rate limited.
//      */
//     public async incrementAndCheckRateLimit(userId: string): Promise<boolean> {
//         let result = this.rateLimiter.consume(userId)
//         // is not rate limited
//         .then((rateLimiterRes) => {return false})
//         // is rate limited
//         .catch((rateLimiterRes) => {return true});
//         return result
//     }

//     /**
//      * Used to change the amount of requests that can be made before limiting the rate.
//      * @param amount The amount of requests that can be made within an interval before limiting the rate.
//      */
//     public setRateLimitAmount(amount: number): void {
//         this.rateLimiter.points = amount
//     }

//     /**
//      * Used to change the amount of time for timeouts
//      * @param interval The time that a the amount of requests can be made in before triggering a rate limit,
//      */
//     public setRateLimitInterval(interval: number): void {
//         this.rateLimiter.duration = interval;
//     }

//     /**
//      * Returns the name that define the command.
//      * @returns the names that define the command.
//      */
//     public getName(): string {
//         return this.command.getName();
//     }
    
//     /** 
//      * Discord requires a response from a command in 3 seconds or become invalid. If a 
//      * response will take longer than that, the response will need to be deferred, sending a 
//      * message "<app/bot> is thinking..." as a first response. This gives the response a 15
//      * minute window to actually respond.
//      * See https://discordjs.guide/slash-commands/response-methods.html#deferred-responses
//      * 
//      * @returns If the command needs to be deferred, then should return a CommandDeferType. If not, it should return undefined.
//      */
//     public getDeferType(): CommandDeferType | undefined {
//         return this.command.getDeferType();
//     }

//     /**
//      * This method is used to get the metadata for the command.
//      * @returns The metadata of the command.
//      */
//     public getMetadata(): RESTPostAPIChatInputApplicationCommandsJSONBody {
//         return this.command.getMetadata()
//     }

//     /**
//      * This method will perform the check for the rate limit. If it succeeds, then it will
//      * @param msg The message causing the trigger.
//      */
//     public async checkUsability(interaction: CommandInteraction): Promise<void> {
//         // Check before if there's anything else stopping it from running
//         this.command.checkUsability(interaction);

//         // if the trigger is valid, then check for the rate limit
//         if(await this.incrementAndCheckRateLimit(interaction.client.user.id)) {
//             // log the rate limit hit
//             Logger.error(LogMessageTemplates.error.userCommandRateLimit
//                 .replaceAll('{USER_TAG}', interaction.client.user.tag)
//                 .replaceAll('{USER_ID}', interaction.client.user.id)
//                 .replaceAll('{COMMAND_NAME}', this.proxyName)
//             )

//             // if the user is rate limited, do NOT execute the trigger
//             // Throw an error because the user permissions didn't match
//             throw new CommandError(
//                 // TODO: Language support for this
//                 `You can only run this command ${this.rateLimiter.points} time(s) every ${this.rateLimiter.duration} second(s). Please wait before attempting this command again.`
//             )
//         }
//     }
    
//     /**
//      * Execuite the concrete object like normal. Nothing to do here since rate limiting involved the checks.
//      * @param client The Discord client to run any commands to interact with Discord.
//      * @param msg The message casuing the trigger.
//      * @param data The data related to the event, passed in from the EventDataService.
//      */
//     public async execute(client: Client, interaction: CommandInteraction, data: EventData): Promise<void> {
//         await this.command.execute(client, interaction, data)
//     }

// }

export abstract class CommandRateLimitProxy extends RateLimitProxy implements Command {
    //
}

// export class SlashCommandRateLimitProxy extends CommandRateLimitProxy, SlashCommand