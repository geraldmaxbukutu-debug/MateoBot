const axios = require('axios');

module.exports = {
  name: "anime",
  description: "Search anime information",
  role: 0,
  category: "media",
  cooldown: 5,
  execute: async (api, event, args, dbHelpers, settings, getText) => {
    const threadID = event.threadID;
    const query = args.join(' ');
    if (!query) return api.sendMessage('Please provide an anime name.', threadID);

    try {
      const response = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}`);
      const anime = response.data.data[0];
      if (!anime) return api.sendMessage('Anime not found.', threadID);
      let message = `**${anime.title}**\n`;
      message += `Episodes: ${anime.episodes}\n`;
      message += `Score: ${anime.score}\n`;
      message += `Status: ${anime.status}\n`;
      message += `Synopsis: ${anime.synopsis}\n`;
      message += `URL: ${anime.url}`;
      api.sendMessage(message, threadID);
    } catch (error) {
      api.sendMessage('Error fetching anime information.', threadID);
    }
  },
};

