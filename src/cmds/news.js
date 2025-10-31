const axios = require('axios');
const API_KEY = 'YOUR_NEWS_API_KEY'; // Get from newsapi.org or similar
const NEWS_API_URL = 'https://newsapi.org/v2/top-headlines';

module.exports = {
  name: "news",
  description: "Get top news headlines",
  role: 0,
  category: "info",
  cooldown: 5,
  execute: async (api, event, args, dbHelpers, settings, getText) => {
    const threadID = event.threadID;
    const country = args[0] || 'ng';                             

  // Default to Nigeria ('ng')

    try {
      const response = await axios.get(NEWS_API_URL, {
        params: {
          country: country,
          apiKey: API_KEY
        }
      });
      const articles = response.data.articles;
      let message = `Top News Headlines (${country.toUpperCase()}):\n\n`;
      articles.slice(0, 5).forEach((article, index) => {
        message += `${index + 1}. ${article.title}\n`;
        message += `${article.url}\n\n`;
      });
      api.sendMessage(message, threadID);
    } catch (error) {
      api.sendMessage('Error fetching news.', threadID);
    }
  },
};

