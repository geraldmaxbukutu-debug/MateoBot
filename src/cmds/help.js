const fs = require("fs");
const path = require("path");
const os = require('os');

const { bold } = require("fontstyles");

module.exports = {
  name: "help",
  description: "Displays a list of available commands",
  role: 0,
  category: "general",
  cooldown: 5,

  execute: async (api, event, args, dbHelpers, settings, getText) => {
    const threadID = event.threadID;
    
    let allCommands = new Map();
    try {
        const cmdDir = path.join(__dirname);
        const commandFiles = fs.readdirSync(cmdDir)
            .filter(file => file.endsWith('.js') && file !== path.basename(__filename));

        for (const file of commandFiles) {
            delete require.cache[require.resolve(path.join(cmdDir, file))];
            const cmd = require(path.join(cmdDir, file));
            if (cmd && cmd.name) allCommands.set(cmd.name, cmd);
        }
    } catch (e) {
                console.warn("[Help CMD] Could not read command directory locally. Relying only on base data.");
    }
    allCommands.set(module.exports.name, module.exports);

    if (args.length > 0) {
        const commandName = args[0].toLowerCase();
        const command = allCommands.get(commandName);

        if (!command) {
            return api.sendMessage('(HELP): ' + getText("commandNotFound", { cmd: commandName }), threadID);
        }

        const detailMessage = `
╭─❍ ${bold(`COMMAND: ${command.name.toUpperCase()}`)}
├ ${bold("Description")}: ${command.description || "No description provided."}
├ ${bold("Usage")}: ${command.usage ? command.usage.replace("{{prefix}}", settings.prefix) : `${settings.prefix}${command.name} [args]`}
├ ${bold("Category")}: ${command.category || "Uncategorized"}
├ ${bold("Required Role")}: ${command.role === 3 ? "Owner" : command.role === 2 ? "Admin" : command.role === 1 ? "Group Admin" : "Everyone"}
┗─━━━━━━━━━━━━━━
        `.trim();
        return api.sendMessage(detailMessage, threadID);
    }
    
    const categories = {};
    let totalCommands = 0;

    for (const [name, command] of allCommands) {
      let userRole = 0;
      if (settings.ownerID === event.senderID) userRole = 3;
      else if (settings.adminIDs.includes(event.senderID)) userRole = 2;
       
      const canShow = command.role <= userRole;

      if (canShow) {
        const cat = command.category || "Uncategorized";
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(name);
        totalCommands++;
      }
    }
      
    const uptime = formatUptime(process.uptime());
    const ramUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
      
    const userName = getUserName(event.senderID);
    const ownerName = getUserName(settings.ownerID);  
            
    let helpMessage = `╭─❍ ${bold("TEAM TITAN-BOTZ")}\n`;
    helpMessage += `\n├ ${bold(`Total Commands: ${totalCommands}`)}`;
    helpMessage += `\n├⬡ 👤 User: @${userName}`;
    helpMessage += `\n├⬡ 👤 Owner: @${ownerName}`;  
    helpMessage += `\n├⬡ ⚙️ Version: 1.0.0 (new)`;
    helpMessage += `\n├⬡ ⏱️ Uptime: ${uptime}`;
    helpMessage += `\n├⬡ 🌐 Prefix: ${settings.prefix || '/'}`;
    helpMessage += `\n├⬡ ⚡ Server: Active`;
    helpMessage += `\n├⬡ 🔋 RAM: ${ramUsage}MB`;
    helpMessage += `\n┗─━━━━━━━━━━\n\n`;
    for (const category in categories) {
      helpMessage += `┏─❍ ${bold(category.toUpperCase())} \n`;

       const commandsList = categories[category];
      for (let i = 0; i < commandsList.length; i += 3) {
        const group = commandsList.slice(i, i + 3);
        helpMessage += `❒ ${group.map(cmd => `${settings.prefix}${cmd}`).join(", ")}\n`;
      }
      helpMessage += "┗─━━━━━━━━━━\n";
    }
    
    helpMessage += `┏─━━━━━━━━━━\n¡│ Use ${settings.prefix}help <command> for more info about a specific command.\n┗─━━━━━━━━━━\n\nThis bot host is powered by ${os.platform} with ${os.type}`;

    api.sendMessage({
        body: helpMessage,
        mentions: [
        {
            tag: `@${userName}`,
            id: event.senderID
        },
        {
            tag: `@${ownerName}`,
            id: settings.ownerID
        }
        ]
    }, threadID);
  },
};

function formatUptime(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    seconds -= days * 24 * 60 * 60;
    const hours = Math.floor(seconds / (60 * 60));
    seconds -= hours * 60 * 60;
    const minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;
    seconds = Math.floor(seconds);
    
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

async function getUserName(userID) {
  try {
    const userInfo = await api.getUserInfo(userID);
    return userInfo[userID].name || 'Unknown User';
  } catch (error) {
    console.error('Error fetching user name:', error);
    return 'Unknown User';
  }
}