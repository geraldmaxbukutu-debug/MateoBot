const fs = require('fs');
const path = require('path');
const axios = require('axios');

// API Configuration for AI Diagnostics
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const API_KEY = "";

// Temporary in-memory cache for command loading errors.
// In a real bot, this would be stored in the 'settings' object or a dedicated DB table.
const commandErrorCache = {};

/**
 * Executes a file-system-based reload of a single command.
 * @param {string} cmdName The name of the command file (without .js).
 * @returns {string} Status message.
 */
function reloadCommand(cmdName) {
    const filePath = path.join(__dirname, `${cmdName}.js`);
    
    if (!fs.existsSync(filePath)) {
        return `❌ Command file "${cmdName}.js" not found.`;
    }

    try {
        // 1. Unload/Delete cache for the old module
        delete require.cache[require.resolve(filePath)];
        
        // 2. Load the new module
        const newCmd = require(filePath);
        
        // 3. Update the global command map (simulated: assuming dbHelpers.commands is available or passed)
        // Since we cannot directly access the global command map, 
        // we assume the main loop will take over management. For now, we only report success/failure.
        
        delete commandErrorCache[cmdName];
        return `✅ Command **${newCmd.name}** successfully reloaded.`;
    } catch (error) {
        // Log the detailed error to the cache
        commandErrorCache[cmdName] = { 
            error: error.message, 
            stack: error.stack.split('\n').slice(0, 5).join('\n') 
        };
        return `⚠️ Failed to reload **${cmdName}**: ${error.message}. Use \`sys errors\` or \`sys diagnose ${cmdName}\` for details.`;
    }
}


module.exports = {
    name: "cmd",
    description: "Bot command management system with AI diagnostics.",
    usage: "{{prefix}}cmd <install|reload|list|errors|diagnose> [args]",
    role: 3, 
    category: "system",
    cooldown: 3,

    execute: async (api, event, args, dbHelpers, settings, getText) => {
        const threadID = event.threadID;
        const subCmd = args.get(0)?.toLowerCase();

        if (!subCmd) {
            return api.sendMessage(
                `🤖 **System Manager (SYS)**\n\nUsage:\n` +
                `> \`${settings.prefix}sys list\` - Show all loaded and broken commands.\n` +
                `> \`${settings.prefix}sys reload [name]\` - Reload one or all commands.\n` +
                `> \`${settings.prefix}sys install <url>\` - Download and install a new command.\n` +
                `> \`${settings.prefix}sys errors\` - Show all cached loading errors.\n` +
                `> \`${settings.prefix}sys diagnose <name>\` - Get AI assistance for a broken command.`,
                threadID
            );
        }

        api.sendTypingIndicator(threadID);

        // --- SUB-COMMAND LOGIC ---

        // 1. LIST COMMANDS
        if (subCmd === 'list') {
            const commandFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.js'));
            let listMessage = `📋 **Loaded Commands (${commandFiles.length} files)**:\n`;
            let activeCount = 0;
            let errorCount = 0;

            for (const file of commandFiles) {
                const cmdName = file.replace('.js', '');
                
                if (commandErrorCache[cmdName]) {
                    listMessage += `🔴 ${cmdName} [ERROR]\n`;
                    errorCount++;
                } else {
                    listMessage += `🟢 ${cmdName}\n`;
                    activeCount++;
                }
            }

            return api.sendMessage(`${listMessage}\nSummary: ${activeCount} active, ${errorCount} broken.`, threadID);
        }

        // 2. RELOAD COMMAND(S)
        if (subCmd === 'reload') {
            const target = args.get(1)?.toLowerCase();
            let results = [];

            if (target) {
                // Reload a single command
                results.push(reloadCommand(target));
            } else {
                // Reload ALL commands
                const commandFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.js'));
                for (const file of commandFiles) {
                    const cmdName = file.replace('.js', '');
                    results.push(reloadCommand(cmdName));
                }
                results.unshift(`🔄 Attempting to reload all ${commandFiles.length} commands...`);
            }
            return api.sendMessage(results.join('\n'), threadID);
        }
        
        // 3. INSTALL COMMAND
        if (subCmd === 'install') {
            const fileUrl = args.get(1);
            if (!fileUrl || !fileUrl.startsWith('http')) {
                return api.sendMessage("❌ Please provide a valid URL for the command file.", threadID);
            }
            
            api.sendMessage(`⏳ Downloading command from ${fileUrl}...`, threadID);

            try {
                const response = await axios.get(fileUrl);
                const cmdContent = response.data;
                
                // Simple attempt to extract command name from content for filename
                const nameMatch = cmdContent.match(/name:\s*["']([^"']+)["']/i);
                const cmdName = nameMatch ? nameMatch[1].toLowerCase() : `temp_cmd_${Date.now()}`;
                
                const filePath = path.join(__dirname, `${cmdName}.js`);
                fs.writeFileSync(filePath, cmdContent, 'utf-8');

                // Automatically attempt to reload the newly installed command
                const reloadStatus = reloadCommand(cmdName);

                return api.sendMessage(`📦 Command **${cmdName}.js** installed successfully.\n${reloadStatus}`, threadID);

            } catch (error) {
                console.error("[SYS_INSTALL_ERROR]", error);
                return api.sendMessage(`❌ Failed to install command: ${error.message}`, threadID);
            }
        }

        // 4. SHOW ERRORS
        if (subCmd === 'errors') {
            const brokenCommands = Object.keys(commandErrorCache);
            if (brokenCommands.length === 0) {
                return api.sendMessage("🥳 All commands loaded successfully! No errors in cache.", threadID);
            }

            let errorMessage = `🚨 **Cached Command Loading Errors (${brokenCommands.length})**:\n`;
            for (const cmdName of brokenCommands) {
                errorMessage += `\n**[${cmdName}.js]**\nError: ${commandErrorCache[cmdName].error}\n`;
            }
            errorMessage += `\nUse \`${settings.prefix}sys diagnose <name>\` for AI analysis.`;
            return api.sendMessage(errorMessage, threadID);
        }

        // 5. AI DIAGNOSTICS (DIAGNOSE)
        if (subCmd === 'diagnose') {
            const targetCmd = args.get(1)?.toLowerCase();
            
            if (!targetCmd) {
                return api.sendMessage("❓ Please specify the name of the broken command to diagnose (e.g., `sys diagnose broken_cmd`).", threadID);
            }
            if (!commandErrorCache[targetCmd]) {
                return api.sendMessage(`✅ Command **${targetCmd}** is not in the error cache or is loaded successfully.`, threadID);
            }
            if (!API_KEY) {
                 return api.sendMessage("❌ AI Diagnostics require `GEMINI_API_KEY` to be set in the environment.", threadID);
            }

            const errorInfo = commandErrorCache[targetCmd];
            const filePath = path.join(__dirname, `${targetCmd}.js`);

            try {
                const cmdCode = fs.readFileSync(filePath, 'utf-8');

                // --- AI Optimistic Management Prompt ---
                const systemPrompt = `You are a specialized Node.js/JavaScript debugging assistant for bot commands. Your task is to analyze the provided code and error message. You MUST respond with a diagnostic summary and the corrected, full JavaScript code block enclosed in a \`\`\`javascript block. Do not provide any conversational text before or after the code block.`;
                const userQuery = `The following bot command file failed to load. Please analyze the code and the error, then provide the corrected, full file contents.
---
**FILE NAME:** ${targetCmd}.js
**ERROR MESSAGE:** ${errorInfo.error}
**ERROR STACK (partial):**
${errorInfo.stack}
---
**CODE CONTENT:**
\`\`\`javascript
${cmdCode}
\`\`\``;
                // --- End Prompt ---
                
                api.sendMessage(`🧠 Sending **${targetCmd}** code and error to AI for diagnosis...`, threadID);

                const response = await axios.post(
                    `${GEMINI_API_URL}?key=${API_KEY}`,
                    {
                        contents: [{ parts: [{ text: userQuery }] }],
                        systemInstruction: { parts: [{ text: systemPrompt }] },
                        config: { temperature: 0.1 } // Keep it deterministic for code fixing
                    }
                );
                
                const aiResponseText = response.data.candidates[0].content.parts[0].text;
                
                api.sendMessage(`✨ **AI DIAGNOSTIC REPORT for ${targetCmd}.js**:\n\n${aiResponseText}`, threadID);

            } catch (error) {
                console.error("[SYS_DIAGNOSE_API_ERROR]", error.response ? error.response.data : error.message);
                api.sendMessage(`❌ AI Diagnosis failed due to an API error. Check the console.`, threadID);
            }
            return;
        }

        return api.sendMessage(`Unrecognized system command: **${subCmd}**. Use \`${settings.prefix}sys\` for help.`, threadID);
    }
};
