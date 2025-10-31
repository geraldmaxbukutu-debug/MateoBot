const axios = require('axios');

module.exports = {
  name: "manga",
  description: "Search manga information",
  role: 0,
  category: "media",
  cooldown: 5,
  execute: async (api, event, args, dbHelpers, settings, getText) => {
    const threadID = event.threadID;
    const query = args.join(' ');
    if (!query) return api.sendMessage('Please provide a manga name.', threadID);

    try {
      const response = await axios.get(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(query)}`);
      const manga = response.data.data[0];
      if (!manga) return api.sendMessage('Manga not found.', threadID);
      let message = `**${manga.title}**\n`;
      message += `Chapters: ${manga.chapters}\n`;
      message += `Score: ${manga.score}\n`;
      message += `Status: ${manga.status}\n`;
      message += `Synopsis: ${manga.synopsis}\n`;
      message += `URL: ${manga.url}`;
      api.sendMessage(message, threadID);
    } catch (error) {
      api.sendMessage('Error fetching manga information.', threadID);
    }
  },
};

