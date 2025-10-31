const axios = require('axios');
const fs = require("fs");
const path = require("path");
const yts = require('yt-search');
const { bold } = require("fontstyles");
const cacheFolder = path.resolve(__dirname, './cache');
if (!fs.existsSync(cacheFolder)) {
  fs.mkdirSync(cacheFolder);
}

module.exports = {
  name: "song",
  description: "Search and download audio from YouTube",
  aliases: ['ytplay', 'ytsearch', 'music'],
  role: 0,
  category: "media",
  cooldown: 5,
  execute: async (api, event, args, dbHelpers, settings, getText) => {
    const threadID = event.threadID;
    try {
      if (!args[0]) {
        return api.sendMessage(
          '╭────❒ ❌ Error ❒\n' +
          '├⬡ Please provide a song name or YouTube URL\n' +
          '├⬡ Usage: ' + settings.prefix + 'song [song name/YouTube URL]\n' +
          '╰────────────❒', threadID);
      }
      const processingMsg = await api.sendMessage(
        '╭────❒ ⏳ Processing ❒\n' +
        '├⬡ Searching and downloading your song...\n' +
        '├⬡ Please wait a moment\n' +
        '╰────────────❒', threadID);

      const query = args.join(' ');
      let videoUrl;
      let videoInfo;
      if (query.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)/)) {
        videoUrl = query;
        const videoId = query.includes('youtu.be') ? query.split('/').pop() : new URL(query).searchParams.get('v');
        const videoSearch = await yts({ videoId });
        videoInfo = videoSearch;
      } else {
        const searchResults = await yts(query);
        if (!searchResults.videos || searchResults.videos.length === 0) {
          return api.sendMessage(
            '╭────❒ ❌ Not Found ❒\n' +
            '├⬡ No songs found for your query\n' +
            '├⬡ Try a different search term\n' +
            '╰────────────❒', threadID);
        }
        videoInfo = searchResults.videos[0];
        videoUrl = videoInfo.url;
      }

      const apiResponse = await axios.get(`https://kaiz-apis.gleeze.com/api/ytdown-mp3?url=${encodeURIComponent(videoUrl)}`);
      if (!apiResponse.data || !apiResponse.data.download_url) {
        return api.sendMessage(
          '╭────❒ ❌ API Error ❒\n' +
          '├⬡ Failed to download the song\n' +
          '├⬡ Please try again later or use a different query\n' +
          '╰────────────❒', threadID);
      }

      const downloadUrl = apiResponse.data.download_url;
      const title = apiResponse.data.title || videoInfo.title;
      const duration = apiResponse.data.duration || videoInfo.timestamp || "Unknown";
      const audioFilePath = path.join(cacheFolder, `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp3`);

      const audioResponse = await axios.get(downloadUrl, { responseType: 'stream' });
      const writer = fs.createWriteStream(audioFilePath);
      audioResponse.data.pipe(writer);

      writer.on('finish', async () => {
        api.sendMessage({
          attachment: fs.createReadStream(audioFilePath),
          body: `Playing: ${title} (${duration})`
        }, threadID);
        api.sendMessage({ delete: processingMsg.messageID }, threadID);
      });

      writer.on('error', async (error) => {
        console.error('Error saving audio file:', error.message);
        api.sendMessage(
          '╭────❒ ❌ Error ❒\n' +
          '├⬡ An error occurred while downloading the audio file\n' +
          '├⬡ Please try again later\n' +
          '╰────────────❒', threadID);
      });
    } catch (err) {
      console.error('[Song CMD] Error:', err);
      api.sendMessage(
        '╭────❒ ❌ Error ❒\n' +
        '├⬡ An error occurred while processing the command\n' +
        '├⬡ Please try again later\n' +
        '╰────────────❒', threadID);
    }
  },
};

