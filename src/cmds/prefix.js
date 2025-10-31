module.exports = {
  name: "prefix",
  description: "View or set the command prefix",
  role: 0,
  category: "utility",
  execute: async (api, event, args, dbHelpers, settings, getText) => {
    const threadID = event.threadID;
    const isGroup = event.isGroup;

    if (event.body && event.body.toLowerCase.includes('prefix')) {
      let message = `System prefix: ${settings.prefix}\n`;
      if (isGroup) {
        const prefix = await dbHelpers.getChatPrefix(threadID) || settings.prefix;
        message += `Group prefix: ${prefix}`;
      } else {
        message += `Chat prefix: ${prefix}`;
      }
      api.sendMessage(message, threadID);
    } else if (args.length === 1 && event.senderID === settings.ownerID) {
      const newPrefix = args[0];
      if (isGroup) {
        await dbHelpers.setGroupPrefix(threadID, newPrefix);
        api.sendMessage(`Group prefix set to: ${newPrefix}`, threadID);
      } else {
        // Note: Setting global prefix would require updating settings, likely needing a restart
        api.sendMessage('Setting global prefix requires updating settings file.', threadID);
      }
    } else {
      api.sendMessage('Usage: prefix [newPrefix]', threadID);
    }
  },
};
