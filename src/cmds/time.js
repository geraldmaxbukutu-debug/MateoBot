const moment = require('moment-timezone');

module.exports = {
  name: "time",
  description: "Get current time",
  role: 0,
  category: "utility",
  cooldown: 5,
  execute: async (api, event, args, dbHelpers, settings, getText) => {
    const threadID = event.threadID;
    const timeZone = settings.timeZone || 'Africa/Lagos'; // Nigeria time
    const cityname = timeZone.split('/')[1];
    const continent = timeZone.split('/')[0];
    
    try {
      const currentTime = moment().tz(timeZone).format('YYYY-MM-DD HH:mm:ss z');
      let message = `Current Time in ${cityname} of continent: ${continent}\n`;
      message += `${currentTime}`;
      api.sendMessage(message, threadID);
    } catch (error) {
      api.sendMessage('Error fetching time. Check timezone?', threadID);
    }
  },
};

