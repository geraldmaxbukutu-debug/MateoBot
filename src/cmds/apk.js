const axios = require('axios');
const fs = require("fs").promises;
const path = require("path");
const { bold } = require("fontstyles");
const cacheFolder = path.resolve(__dirname, './cache');
fs.mkdir(cacheFolder, { recursive: true }).catch(() => {});

module.exports = {
  name: "apk",
  description: "Searches for and attempts to download an APK from Aptoide",
  aliases: ['appdl', 'downloadapkfile'],
  role: 0,
  category: "utility",
  cooldown: 30,
  execute: async (api, event, args, dbHelpers, settings, getText) => {
    const threadID = event.threadID;
    if (!args[0]) {
      return api.sendMessage(
        '╭────❒ 📱 Usage 📱 \n' +
        '├⬡ Search and attempt to download an APK from Aptoide using: [' + settings.prefix.join(',') + ']apk [app name]\n' +
        '├⬡ Example: ' + settings.prefix.join(',') + 'apk WhatsApp\n' +
        '╰─────────────', threadID);
    }
    const query = args.join(' ');
    const apiUrl = `http://ws75.aptoide.com/api/7/apps/search/query=${encodeURIComponent(query)}/limit=1`;
    try {
      const processingMsg = await api.sendMessage(
        `╭────❒ 📥 Downloading APK 📥 \n` +
        `├⬡ Searching Aptoide for: ${query} and attempting download...\n` +
        `├⬡ This might take a while, please be patient.\n` +
        `╰─────────────`, threadID);

      const response = await axios.get(apiUrl);
      const data = response.data;
      if (data.status === 'OK' && data.total > 0 && data.list.length > 0) {
        const app = data.list[0];
        const downloadUrl = app.file.url;
        const appName = app.name;
        try {
          const apkResponse = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
          const apkBuffer = Buffer.from(apkResponse.data, 'binary');
          const tempFilePath = path.join(cacheFolder, `${appName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.apk`);
          await fs.writeFile(tempFilePath, apkBuffer);
          await api.sendMessage({
            attachment: fs.createReadStream(tempFilePath),
            filename: `${appName}.apk`,
            mimetype: 'application/vnd.android.package-archive'
          }, threadID);
          await fs.unlink(tempFilePath);
        } catch (downloadError) {
          console.error('Error downloading APK:', downloadError);
          return api.sendMessage(
            `╭────❒ ❌ Download Error ❌ \n` +
            `├⬡ Failed to download the APK for ${appName}.\n` +
            `├⬡ Please try again later or use the download link provided by the ${settings.prefix}apk command.\n` +
            `╰──────────────`, threadID);
        }
      } else {
        return api.sendMessage(
          `╭────❒ ❌ No APK Found ❌ \n` +
          `├⬡ No APK found for: ${query} on Aptoide.\n` +
          `├⬡ Please try a different search term using the ${settings.prefix}apk command.\n` +
          `╰────────────`, threadID);
      }
    } catch (error) {
      console.error('APK search error:', error);
      return api.sendMessage(
        '╭────❒ ❌ Error ❌ \n' +
        '├⬡ An error occurred while searching for the APK.\n' +
        '├⬡ Please try again later.\n' +
        '╰──────────────', threadID);
    }
  },
};

