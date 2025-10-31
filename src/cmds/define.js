const axios = require('axios');

module.exports = {
  name: "define",
  description: "Get the definition of a word",
  role: 0,
  category: "utility",
  cooldown: 5,
  execute: async (api, event, args, dbHelpers, settings, getText) => {
    const threadID = event.threadID;
    const word = args.join(' ');

    if (!word) {
      return api.sendMessage('Please provide a word to define.', threadID);
    }

    try {
      const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      const data = response.data[0];
      let message = `**${data.word}**\n`;
      data.meanings.forEach(meaning => {
        message += `${meaning.partOfSpeech}\n`;
        meaning.definitions.forEach(def => {
          message += `- ${def.definition}\n`;
        });
      });
      api.sendMessage(message, threadID);
    } catch (error) {
      api.sendMessage('Word not found or error fetching definition.', threadID);
    }
  },
};

