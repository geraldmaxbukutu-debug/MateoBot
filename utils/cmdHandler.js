/**
 * Executes command logic, including parsing, role checking, and executing command modules.
 * @module cmdHandler
 */

// === Command & Argument Parser ===
function parseArgs(messageBody, prefix) {
    const bodyWithoutPrefix = messageBody.slice(prefix.length).trim();
    // Regex to split by spaces but keep quoted strings intact
    const parts = bodyWithoutPrefix.match(/[^\s"']+|"([^"]*)"|'([^']*)'/g) || [];
    
    if (parts.length === 0) return { commandName: "", args: [] };
    
    const commandName = parts.shift().toLowerCase();
    
    // Clean up quotes from args
    const argsArray = parts.map(part => part.replace(/^"|"$/g, '').replace(/^'|'$/g, ''));
    
    // Attach a custom 'get' method to the array for indexed retrieval
    argsArray.get = function(index) {
        const idx = parseInt(index, 10);
        return this[idx] !== undefined ? this[idx] : null;
    };

    return { commandName, args: argsArray };
}


/**
 * Main command execution function. Called when a 'message' event is received.
 * @param {Object} api - The FCA API instance.
 * @param {Object} event - The message event object from FCA.
 * @param {Map<string, Object>} commands - Map of loaded command modules.
 * @param {Object} dbHelpers - Database helper object.
 * @param {Object} settings - Bot settings object.
 * @param {Function} getText - Language function.
 * @param {Map<string, Object>} onReplyMap - Map for reply state management.
 * @param {Map<string, Object>} onChatMap - Map for chat state management.
 * @param {Array<Function>} onBootCallbacks - Array for shutdown/boot callbacks.
 */
async function handleCommand(api, event, commands, dbHelpers, settings, getText, onReplyMap, onChatMap, onBootCallbacks) {
    
    if (event.type !== "message" || !event.body) return;
    
    const messageBody = event.body;

    if (onReplyMap.has(event.threadID)) {
        const onReply = onReplyMap.get(event.threadID)
        if (onReply.type === "continue") {
             const args = messageBody.trim().split(/ +/g);
             const onReplyFunc = onReply.callback;
             onReplyMap.delete(event.threadID); // Clear map after use
            try {
                await onReplyFunc(api, event, args, dbHelpers, settings, getText);
            } catch (e) {
                api.sendMessage("Error processing reply.", event.threadID);
                console.error("[Reply] Error:", e);
            }
            return;
        }
    }

    if (!messageBody.startsWith(settings.prefix)) {
        for (const [name, command] of commands) {
            if (command.executeWithoutPrefix && typeof command.execute === "function") {
                try {
                    const onReply = (onReplyData) => onReplyMap.set(event.threadID, onReplyData);
                    const onChat = (onChatData) => onChatMap.set(event.threadID, onChatData);
                    const onBoot = (callback) => onBootCallbacks.push(callback);

                    await command.execute(
                        api,
                        event,
                        [], 
                        dbHelpers,
                        settings,
                        getText,
                        onChat,
                        onReply,
                        onBoot
                    )
                } catch (e) {
                    console.error(`[Prefixless Command] Error running ${name}:`, e);
                }
            }
        }
        return;
    }

    const { commandName, args } = parseArgs(messageBody, settings.prefix);
    const command = commands.get(commandName);

    if (!command) {
        return api.sendMessage(getText("commandNotFound", { cmd: commandName }), event.threadID);
    }
    
    let role = 0; 
    if (settings.ownerID === event.senderID) role = 3; 
    else if (settings.adminIDs.includes(event.senderID)) role = 2;

    if (command.role > role) {
        return api.sendMessage(getText("notAdmin"), event.threadID);
    }
    
    
    try {
        const onReply = (onReplyData) => onReplyMap.set(event.threadID, onReplyData);
        const onChat = (onChatData) => onChatMap.set(event.threadID, onChatData);
        const onBoot = (callback) => onBootCallbacks.push(callback);
        
        await command.execute(
            api,
            event,
            args,
            dbHelpers,
            settings,
            getText,
            onChat,
            onReply,
            onBoot,
        );
    } catch (e) {
        api.sendMessage("Error executing command.", event.threadID);
        console.error(`[Command] Error running ${commandName}:`, e);
    }
}

module.exports = {
    handleCommand
};

