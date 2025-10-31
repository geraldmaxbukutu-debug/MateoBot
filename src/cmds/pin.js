const axios = require('axios');

module.exports = {
  name: "pinterest",
  description: "Search for pins on Pinterest",
  role: 0,
  category: "media",
  cooldown: 5,
  execute: async (api, event, args, dbHelpers, settings, getText) => {
    const threadID = event.threadID;
    const query = args.join(' ');

    if (!query) {
      return api.sendMessage('Please provide a search query.', threadID);
    }

    try {
      // Note: This is a simplified example and actual implementation may vary
      // due to Pinterest API requirements and limitations.
      const response = await axios.get(`https://www.pinterest.com/resource/BaseSearchResource/get/?source_url=/search/pins/?q=${encodeURIComponent(query)}&rs=typed`);
      const pins = response.data.resource_response.data.results.slice(0, 5); // Limit to 5 results

      if (!pins.length) {
        return api.sendMessage('No pins found.', threadID);
      }

      let message = `Pinterest Search Results for "${query}" (Top 5):\n`;
      pins.forEach((pin, index) => {
        message += `${index + 1}. ${pin.grid_title || 'No title'} - https://www.pinterest.com/pin/${pin.id}/\n`;
      });
      api.sendMessage(message, threadID);
    } catch (error) {
      api.sendMessage('Error searching Pinterest.', threadID);
    }
  },
};

