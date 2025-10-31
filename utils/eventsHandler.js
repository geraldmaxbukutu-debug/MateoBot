/**
 * Processes non-message FCA events and ensures users/groups exist in the database.
 * @module eventsHandler
 */

/**
 * Ensures user and group data exists in the database for a given event.
 * @param {Object} event - The FCA event object.
 * @param {Object} dbHelpers - Database helper object.
 */
async function ensureDbRecords(event, dbHelpers) {
    if (event.senderID) {
        try {
            const user = await dbHelpers.getUser(event.senderID);
            if (!user) {
                await dbHelpers.createUser({ userID: event.senderID, name: event.senderName || "" }); 
            }
        } catch (e) {
            console.error(`[DB Check] Error ensuring user ${event.senderID} exists:`, e);
        }
    }
    if (event.isGroup && event.threadID) {
        try {
            const group = await dbHelpers.getGroup(event.threadID);
            if (!group) {
                await dbHelpers.createGroup({ groupID: event.threadID, name: event.threadName || "" });
            }
        } catch (e) {
            console.error(`[DB Check] Error ensuring group ${event.threadID} exists:`, e);
        }
    }
}


/**
 * Main event execution function. Runs handlers for non-message events.
 * @param {Object} api - The FCA API instance.
 * @param {Object} event - The event object from FCA.
 * @param {Map<string, Array<Object>>} events - Map of loaded event modules by type.
 * @param {Object} dbHelpers - Database helper object.
 * @param {Object} settings - Bot settings object.
 * @param {Function} getText - Language function.
 */
async function handleEvent(api, event, events, dbHelpers, settings, getText) {
    // 1. Ensure DB records are up to date (applies to most events)
    await ensureDbRecords(event, dbHelpers);

    // 2. Execute handlers for the specific event type
    if (events.has(event.type)) {
        const eventHandlers = events.get(event.type);
        for (const handler of eventHandlers) {
            if (handler.run && typeof handler.run === "function") {
                try {
                    await handler.run(api, event, dbHelpers, settings, getText);
                } catch (e) {
                    console.error(`[Event] Error executing ${event.type} handler:`, e);
                }
            }
        }
    }
}

module.exports = {
    handleEvent
};

