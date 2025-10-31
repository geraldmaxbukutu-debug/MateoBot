const axios = require('axios');

module.exports = {
  name: "catfact",
  description: "Get a random cat fact",
  role: 0,
  category: "fun",
  cooldown: 5,
  execute: async (api, event, args, dbHelpers, settings, getText) => {
    const threadID = event.threadID;

    try {
      const response = await axios.get('https://catfact.ninja/fact');
      const fact = response.data.fact;
      api.sendMessage(fact, threadID);
    } catch (error) {
      api.sendMessage('Error fetching cat fact.', threadID);
    }
  },
};

