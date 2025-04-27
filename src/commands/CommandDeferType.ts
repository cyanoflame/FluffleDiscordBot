/**
 * Once the command is executed and the response takes longer than 3 seconds, the response will need to be deferred.
 * If set to anything outside of NONE, the bot will auto defer the commands, and set the responses to be visible publicly 
 * or privately. The bot will defer the interaction such that it will show a message like '<bot> is thinking...' similar 
 * to '<user> is typing...'. Note:
 * - if a deferred option is used, a command cannot respond to a command with interaction.reply();
 * - if no deferred option is used, the dev must attach the "Ephemeral" to the interaction.reply() flags to change 
 *   if they wish to make the response hidden.
 * 
 * The possible options include:
 * 
 *      PUBLIC: For this option, anyone can see whether or not the bot is thinking.
 * 
 *      HIDDEN: For this option, only the command user can see whether or not the bot is thinking.
 * 
 *      NONE: For this option, the command response is not deferred automatically AT ALL. The dev is responsible
 *            for deferring/replying/following up messages properly on their own.
 */
export enum CommandDeferType {
    PUBLIC = 'PUBLIC',
    HIDDEN = 'HIDDEN',
    NONE = 'NONE'
}
