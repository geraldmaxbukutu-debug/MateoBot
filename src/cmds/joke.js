const axios = require('axios');

module.exports = {
  name: "joke",
  description: "Get a random joke",
  role: 0,
  category: "media",
  cooldown: 5,
  execute: async (api, event, args, dbHelpers, settings, getText) => {
    const threadID = event.threadID;

    try {
      const response = await axios.get('https://v2.jokeapi.dev/joke/Any');
      const joke = response.data;
      if (joke.type === 'single') {
        api.sendMessage(joke.joke, threadID);
      } else {
        let message = `${joke.setup}\n`;
        message += `${joke.delivery}`;
        api.sendMessage(message, threadID);
      }
    } catch (error) {
      api.sendMessage('Error fetching joke.', threadID);
    }
  },
};

