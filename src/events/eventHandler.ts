/**
 * This is the interface that specifies an event handler object. It has a method used to process events.
 */
export interface EventHandler {
    /**
     * This method should be executed when a process needs to handle an event.
     */
    process(): Promise<void>

}
