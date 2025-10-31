const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = {
  name: 'flux',
  description: 'Generate flux art images',
  aliases: ['fluxart', 'fluxgen'],
  role: 0,
  category: 'image',
  cooldown: 10,
  execute: async (api, event, args, dbHelpers, settings, getText) => {
    const threadID = event.threadID;
    try {
      const prompt = args.join(" ");
      if (!prompt) {
        return api.sendMessage({
          body: "╭─❒ ❌ Error ❒\n├⬡ Please provide a prompt\n├⬡ Example: !flux beautiful sunset\n╰────────────❒",
          threadID
        });
      }

      api.sendMessage({
        body: `╭─❒ 🎨 Generating Flux Art ❒\n├⬡ Prompt: ${prompt}\n├⬡ Please wait...\n╰────────────❒`,
        threadID
      });

      const apiUrl = `https://kaiz-apis.gleeze.com/api/flux?prompt=${encodeURIComponent(prompt)}`;
      const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(response.data, 'binary');

      api.sendMessage({
        attachment: fs.createWriteStream('flux.png').write(imageBuffer),
        body: `╭─❒ 🎨 Flux Art Generator ❒\n├⬡ Prompt: ${prompt}\n╰────────────❒ \nFlux Studio`,
        threadID
      });
    } catch (err) {
      console.error('Error in flux command:', err);
      api.sendMessage({
        body: '╭─❒ ❌ Error ❒\n├⬡ Failed to generate image\n├⬡ Please try again later\n╰────────────❒',
        threadID
      });
    }
  }
};

