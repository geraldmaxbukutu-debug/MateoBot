const os = require('os');
const performanceNow = require('performance-now');

module.exports = {
  name: 'stats',
  description: 'Display bot statistics',
  aliases: ['botstats', 'status'],
  role: 0,
  category: 'info',
  cooldown: 10,
  execute: async (api, event, args, dbHelpers, settings, getText) => {
    const threadID = event.threadID;
    try {
      const formatSize = size => {
        if (size < 1024) return size + ' B';
        const kb = size / 1024;
        if (kb < 1024) return kb.toFixed(2) + ' KB';
        const mb = kb / 1024;
        if (mb < 1024) return mb.toFixed(2) + ' MB';
        return (mb / 1024).toFixed(2) + ' GB';
      };

      const used = process.memoryUsage();
      const cpus = os.cpus();
      const cpuInfo = cpus[0];
      const osInfo = {
        type: os.type(),
        platform: os.platform(),
        arch: os.arch(),
        release: os.release(),
        hostname: os.hostname(),
        uptime: os.uptime(),
      };

      let cpuDetails = `Model: ${cpuInfo.model}\n`;
      cpuDetails += `Speed: ${cpuInfo.speed} MHz\n`;
      cpuDetails += `Cores: ${os.cpus().length}\n`;

      let timestamp = performanceNow();
      let latency = performanceNow() - timestamp;
      const uptime = `${Math.floor(process.uptime() / 3600)} hours ${Math.floor((process.uptime() % 3600) / 60)} minutes`;
      const configVersion = settings.version || '1.0.0';

      const statsText = `╭────❒ 📊 Bot Stats\n` +
                        `├⬡ *OS Type:* ${osInfo.type}\n` +
                        `├⬡ *Platform:* ${osInfo.platform}\n` +
                        `├⬡ *Architecture:* ${osInfo.arch}\n` +
                        `├⬡ *Release:* ${osInfo.release}\n` +
                        `├⬡ *Hostname:* ${osInfo.hostname}\n` +
                        `├⬡ *RAM:* ${formatSize(os.totalmem() - os.freemem())} / ${formatSize(os.totalmem())}\n` +
                        `├⬡ *NodeJS Memory:* ${formatSize(used.rss)}\n` +
                        `├⬡ *CPU Info:*\n${cpuDetails}` +
                        `├⬡ *Latency:* ${latency.toFixed(4)} ms\n` +
                        `├⬡ *Runtime:* ${uptime}\n` +
                        `├⬡ *Bot Version:* ${configVersion}\n` +
                        `╰────────────❒`;

      api.sendMessage({
        body: statsText,
        threadID
      });
    } catch (err) {
      console.error('Stats error:', err);
      api.sendMessage({
        body: '╭────❒ ❌ Error ❒\n├⬡ Failed to fetch bot stats\n├⬡ Please try again later\n╰────────────❒',
        threadID
      });
    }
  }
};

