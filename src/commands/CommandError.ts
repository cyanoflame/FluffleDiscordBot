/**
 * This class is used to be thrown from errors resulting from commands. It's used to send what 
 * the cause for being unable to run the command.
 */
export class CommandError extends Error {
    constructor(msg: string) {
        super(msg);
    }
}
