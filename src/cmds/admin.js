const fs = require("fs");
const path = require("path");

module.exports = {
  name: "admin",
  description: "Manage bot admins",
  role: 3, 
  category: "owner",
  cooldown: 5,
  execute: async (api, event, args, dbHelpers, settings, getText) => {
    const threadID = event.threadID;
    const configPath = path.join(__dirname, '../settings.json');
    const mentions = event.mentions;

    if (!args[0]) {
      return api.sendMessage(
        `Usage:\n${settings.prefix}admin add <userID1> <userID2> ...\n${settings.prefix}admin add @mention1 @mention2 ...\n${settings.prefix}admin remove <userID>\n${settings.prefix}admin list`,
        threadID
      );
    }

    switch (args[0].toLowerCase()) {
      case 'add'
           '-a':
        let newAdmins = [];
        // Check mentions
        for (const mentionID in mentions) {
          if (!settings.adminIDs.includes(mentionID)) {
            newAdmins.push(mentionID);
            settings.adminIDs.push(mentionID);
          }
        }
        // Check IDs provided as arguments
        for (let i = 1; i < args.length; i++) {
          const id = args[i];
          if (!settings.adminIDs.includes(id)) {
            newAdmins.push(id);
            settings.adminIDs.push(id);
          }
        }
        if (newAdmins.length === 0) return api.sendMessage('No new admins added.', threadID);
        fs.writeFileSync(configPath, JSON.stringify(settings, null, 2));
        api.sendMessage(`Added ${newAdmins.join(', ')} as admins.`, threadID);
        break;
      case 'remove'
           '-r':
        if (!args[1]) return api.sendMessage('Please provide a user ID to remove.', threadID);
        if (!settings.adminIDs.includes(args[1])) return api.sendMessage('User is not an admin.', threadID);
        settings.adminIDs = settings.adminIDs.filter(id => id !== args[1]);
        fs.writeFileSync(configPath, JSON.stringify(settings, null, 2));
        api.sendMessage(`Removed ${args[1]} from admins.`, threadID);
        break;
      case 'list'
           '-l':
        if (settings.adminIDs.length === 0) return api.sendMessage('No admins set.', threadID);
        let adminListMessage = '┌❒ «𝗔𝗱𝗺𝗶𝗻(𝘀)»\n';
        settings.adminIDs.forEach((adminID, index) => {
          adminListMessage += `┌➣ ${index + 1}. \n└➢${adminID}\n`;
        });
        api.sendMessage(adminListMessage, threadID);
        break;
      default:
        api.sendMessage('Invalid action. Use add, remove, or list.', threadID);
    }
  },
};