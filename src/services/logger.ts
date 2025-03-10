import { DiscordAPIError } from 'discord.js'
import pino from 'pino'

import config from '../../config/config.json'

/**
 * This class is used to log data and errors in a consistent and meaningful way using Pino.
 */
export class Logger {
    
    /** This is used to track the id of the shard the logging originates from */
    private static shardId: number

    /**
     * This is the pino logging object used for logging data in a consisntent manner.
     */
    private static pinoLogger = pino(
        {
            formatters: {
                level: label => {
                    return { level: label }
                },
            },
        },
        config.logging.pretty
            ? pino.transport({
                  target: 'pino-pretty',
                  options: {
                      colorize: true,
                      ignore: 'pid,hostname',
                      translateTime: 'yyyy-mm-dd HH:MM:ss.l',
                  },
              })
            : undefined
    )

    /**
     * This logs the messager under the info level.
     * @param message The message being logged.
     * @param obj The object to include with the message being logged.
     */
    public static info(message: string, obj?: any): void {
        if (obj) {
            this.pinoLogger.info(obj, message)
        } else {
            this.pinoLogger.info(message)
        }
    }

    /**
     * This logs the messager under the warning level.
     * @param message The message being logged
     * @param obj The object to include with the message being logged.
     */
    public static warn(message: string, obj?: any): void {
        if (obj) {
            this.pinoLogger.warn(obj, message)
        } else {
            this.pinoLogger.warn(message)
        }
    }

    /**
     * This logs the messager under the error level.
     * @param message The message being logged
     * @param obj The object to include with the message being logged.
     */
    public static async error(message: string, obj?: any): Promise<void> {
        // Log just a message if no error object
        if (!obj) {
            this.pinoLogger.error(message)
            return
        }

        // Otherwise log details about the error
        if (typeof obj === 'string') {
            this.pinoLogger.child({
                    message: obj,
                })
                .error(message)
        } else if (obj instanceof Response) {
            let resText: string = ""
            try {
                resText = await obj.text()
            } catch {
                // Ignore
            }
            this.pinoLogger.child({
                    path: obj.url,
                    statusCode: obj.status,
                    statusName: obj.statusText,
                    headers: obj.headers.toJSON(),
                    body: resText,
                })
                .error(message)
        } else if (obj instanceof DiscordAPIError) {
            // Specially log instances of discord errors
            this.pinoLogger.child({
                    message: obj.message,
                    code: obj.code,
                    statusCode: obj.status,
                    method: obj.method,
                    url: obj.url,
                    stack: obj.stack,
                })
                .error(message)
        } else {
            this.pinoLogger.error(obj, message)
        }
    }

    /**
     * This recreates the logger with a shard id to distinguish which discord shard the message originates from.
     * @param shardId The id of the shard to be used by the logger/
     */
    public static setShardId(shardId: number): void {
        if (this.shardId !== shardId) {
            this.shardId = shardId
            this.pinoLogger = this.pinoLogger.child({ shardId })
        }
    }
}
