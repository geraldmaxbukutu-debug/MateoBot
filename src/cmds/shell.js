const { exec } = require('child_process');

module.exports = {
  name: 'shell',
  description: 'Execute terminal commands.',
  role: 2,
  category: 'Admin',
  cooldown: 0,
  execute: async (api, event, args, dbHelpers, settings, getText) => {
    const threadID = event.threadID;
    if (!args.length) {
      return api.sendMessage({
        body: 'Please provide a command to execute.',
        threadID
      });
    }

    const command = args.join(' ');
    try {
      const processingMsg = await api.sendMessage({
        body: 'Processing...',
        threadID
      });

      exec(command, (error, stdout, stderr) => {
        let response;
        if (error) response = `Error:\n${error.message}`;
        else if (stderr) response = `Stderr:\n${stderr}`;
        else response = `Output:\n${stdout}`;

        api.sendMessage({
          body: response,
          threadID
        });
        api.unsendMessage(processingMsg.messageID);
      });
    } catch (err) {
      console.error('Shell command error:', err);
      api.sendMessage({
        body: 'Error executing command.',
        threadID
      });
    }
  }
};

