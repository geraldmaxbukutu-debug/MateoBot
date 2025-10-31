const { startUpdater, updatesPending, error } = require("../../updater.js");

module.exports = {
  name: "update",
  description: "Start retrieving",
  role: 2, 
  category: "utility",
  cooldown: 5,
  execute: async (api, event, args, dbHelpers, settings, getText, onChat, onReply, onBoot) => {
    try {
      api.sendMessage('Checking for updates...', event.threadID);
      if (error) {
        api.sendMessage('An error occured fatal.', event.threadID);
      }
      api.sendMessage(`${updatesPending} commit(s) waiting.`, event.threadID);
      api.sendMessage(`Starting updater, this will cause a restart if update is successful`);
      startUpdater();
    } catch (error) {
      api.sendMessage('error from code', event.threadID)
    }
  },
};

