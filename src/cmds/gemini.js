const axios = require('axios');
const fs = require("fs").promises;
const path = require("path");
const crypto = require('crypto');
const { bold } = require("fontstyles");
const cacheFolder = path.resolve(__dirname, './cache');
fs.mkdir(cacheFolder, { recursive: true }).catch(() => {});

async function uploadToCatbox(imagePath) {
  try {
    const formData = new FormData();
    formData.append('fileToUpload', await fs.readFile(imagePath));
    const response = await axios.post('https:                                       
      headers: {
        ...formData.getHeaders(),
      },
    });
    return response.data;
  } catch (error) {
    console.error('//catbox.moe/user/api.php', formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading to Catbox:', error);
    return null;
  }
}

module.exports = {
  name: "gemini",
  description: "Interacts with the Gemini Flash 2.0 model or analyzes an image",
  aliases: ['ai', 'googleai'],
  role: 0,
  category: "ai",
  cooldown: 10,
  execute: async (api, event, args, dbHelpers, settings, getText) => {
    const threadID = event.threadID;
    const hasImage = event.attachments && event.attachments.length > 0 && event.attachments[0].type === 'photo';
    if (!args[0] && !hasImage) {
      return api.sendMessage(
        '╭────❒ ❌ Error ❒\n' +
        '├⬡ Please provide a question or send an image to analyze.\n' +
        '├⬡ Usage (Question): ' + settings.prefix + 'gemini [your question]\n' +
        '├⬡ Usage (Image Analysis): Send an image with ' + settings.prefix + 'gemini [optional question]\n' +
        '╰────────────❒', threadID);
    }

    const question = args.join(' ');
    let imageUrl = null;

    if (hasImage) {
      const processingImageMsg = await api.sendMessage(
        '╭────❒ ⏳ Processing Image ❒\n' +
        '├⬡ Downloading and preparing the image for analysis...\n' +
        '├⬡ Please wait a moment...\n' +
        '╰────────────❒', threadID);
      try {
        const imagePath = path.join(cacheFolder, crypto.randomBytes(16).toString('hex') + '.jpg');
        imageUrl = await uploadToCatbox(imagePath);
        await fs.unlink(imagePath);
        if (imageUrl) {
…        } else {
          return api.sendMessage(
            '╭────❒ ❌ Upload Error ❒\n' +
            '├⬡ Failed to upload the image for analysis.\n' +
            '├⬡ Please try again later.\n' +
            '╰────────────❒', threadID);
        }
      } catch (error) {
        console.error('Error processing image:', error);
        return api.sendMessage(
          '╭────❒ ❌ Image Error ❒\n' +
          '├⬡ An error occurred while processing the image.\n' +
          '├⬡ Please try again later.\n' +
          '╰────────────❒', threadID);
      }
    }

    const processingMsg = await api.sendMessage(
      `╭────❒ ⏳ Thinking ❒\n├⬡ Querying Gemini Flash 2.0${imageUrl ? ' with image analysis' : ''}:\n├⬡ ${question || 'Analyzing image...'}\n├⬡ Please wait for the response...\n╰────────────❒`, threadID);
    try {
      const apiUrl = `https://kaiz-apis.gleeze.com/api/gemini-flash-2.0?q=${encodeURIComponent(question || 'Describe this image.')}&uid=${encodeURIComponent(event.senderID)}&imageUrl=${encodeURIComponent(imageUrl || '')}`;
      const response = await axios.get(apiUrl);
      const geminiData = response.data;
      if (geminiData && geminiData.response) {
        api.sendMessage(`🤖 Gemini Flash 2.0 says:\n\n${geminiData.response}`, threadID);
      } else {
        return api.sendMessage(
          '╭────❒ ❓ Hmm... ❒\n' +
          '├⬡ Gemini Flash 2.0 did not provide a response.\n' +
          '├⬡ Please try asking again later.\n' +
          '╰────────────❒', threadID);
      }
    } catch (error) {
      console.error('Error querying Gemini:', error);
      return api.sendMessage(
        '╭────❒ ❌ Error ❒\n' +
        '├⬡ An error occurred while communicating with Gemini Flash 2.0.\n' +
        '├⬡ Please try again later.\n' +
        '╰────────────❒', threadID);
    }
  },
};

