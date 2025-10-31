const { restartBot } = require('../../index.js');

module.exports = {
  name: "restart",
  description: "Restart the bot",
  role: 3, // Owner only
  category: "owner",
  cooldown: 0,
  execute: async (api, event, args, dbHelpers, settings, getText) => {
    const threadID = event.threadID;
    api.sendMessage('Restarting bot...', threadID);
    restartBot();
  },
};

