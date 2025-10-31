
const axios = require('axios');

module.exports = {
  name: "lyrics",
  description: "Get lyrics of a song",
  role: 0,
  category: "media",
  cooldown: 5,
  execute: async (api, event, args, dbHelpers, settings, getText) => {
    const threadID = event.threadID;
    const songName = args.join(' ');
    if (!songName) return api.sendMessage('Please provide a song name.', threadID);

    try {
      const response = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(songName)}`);
      const lyrics = response.data.lyrics;
      if (!lyrics) return api.sendMessage('Lyrics not found.', threadID);
      api.sendMessage(lyrics, threadID);
    } catch (error) {
      api.sendMessage('Error fetching lyrics.', threadID);
    }
  },
};
