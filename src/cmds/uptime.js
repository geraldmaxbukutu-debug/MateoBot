const fs = require("fs");
const path = require("path");
const os = require("os");
const { bold } = require("fontstyles");

module.exports = {
  name: "uptime",
  description: "Displays bot uptime status with an image",
  aliases: ['alive', 'runtime'],
  role: 0,
  category: "system",
  cooldown: 5,
  execute: async (api, event, args, dbHelpers, settings, getText) => {
    const threadID = event.threadID;
    try {
      const uptimeSeconds = process.uptime();
      const days = Math.floor(uptimeSeconds / (3600 * 24));
      const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((uptimeSeconds % 3600) / 60);
      const seconds = Math.floor(uptimeSeconds % 60);
      const ramUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
      const instagram = "kola ko";
      const github = "Gerald Max";
      const facebook = "Gerald Max";
      const botName = "Titan-Botz";
      const apiUrl = `https://kaiz-apis.gleeze.com/api/uptime?instag=${instagram}&ghub=${github}&fb=${facebook}&hours=${hours}&minutes=${minutes}&seconds=${seconds}&botname=${encodeURIComponent(botName)}`;
      const statusMessage = `
╭─❍ ${bold("UPTIME STATUS")}
├ ${bold("Uptime")}: ${days}d ${hours}h ${minutes}m ${seconds}s
├ ${bold("RAM Usage")}: ${ramUsage}MB
├ ${bold("Prefix")}: ${settings.prefix.join(", ")}
├ ${bold("Server")}: Online 📶
┗━─━━━━━━━━━━━━━
      `.trim();
      try {
        api.sendMessage({
          attachment: await axios.get(apiUrl, { responseType: 'stream' }),
          body: statusMessage
        }, threadID);
      } catch (error) {
        console.error("Error fetching uptime image:", error);
        api.sendMessage(`${statusMessage}\n\n⚠️ Image generation failed`, threadID);
      }
    } catch (err) {
      console.error('[Uptime CMD] Error:', err);
      api.sendMessage('╭────❒ ❌ Error ❒\n' + '├⬡ An error occurred while processing the command\n' + '╰────────────❒', threadID);
    }
  },
};

