const http = require('http');
const os = require('os');

const MONITOR_PORT = 3000;
const SELF_CHECK_INTERVAL_MS = 4 * 60 * 1000;

let botApi = null;
let botSettings = {};
let botUptime = new Date();
let lastHeartbeat = new Date();
let selfCheckStatus = 'PENDING_START';

function getMetrics() {
  const processMemory = process.memoryUsage();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  return {
    bot: {
      status: botApi ? 'LIVE' : 'OFFLINE',
      uptime: Math.floor((new Date() - botUptime) / 1000),
      lastHeartbeat: lastHeartbeat.toISOString(),
      selfCheckStatus: selfCheckStatus,
      pid: process.pid,
      fcaUserID: botApi ? botApi.getCurrentUserID() : 'N/A'
    },
    system: {
      osType: os.type(),
      cpuUsage: os.loadavg(),
      memory: {
        totalGB: (totalMemory / 1024 / 1024 / 1024).toFixed(2),
        freeGB: (freeMemory / 1024 / 1024 / 1024).toFixed(2),
        processMemoryMB: (processMemory.rss / 1024 / 1024).toFixed(2)
      }
    }
  };
}

async function runSelfCheck() {
  if (!botApi) {
    selfCheckStatus = 'FATAL: NO API INSTANCE';
    console.error('[Monitor] Self-check failed: API instance not available.');
    return;
  }

  try {
    const currentUserID = await botApi.getCurrentUserID();
    if (currentUserID) {
      selfCheckStatus = 'SUCCESS';
      lastHeartbeat = new Date();
      console.log('[Monitor] Self-check successful. FCA connection appears healthy.');
    } else {
      selfCheckStatus = 'FAILURE: FCA_CHECK_FAILED';
      console.error('[Monitor] Self-check failed: Could not verify FCA user ID.');
    }
  } catch (error) {
    selfCheckStatus = 'FAILURE: FCA_ERROR';
    console.error('[Monitor] Self-check failed with FCA error:', error.message);
  }
}

function startMonitor(api, settings) {
  if (botApi) return;
  botApi = api;
  botSettings = settings;

  setInterval(() => {
    runSelfCheck();
  }, SELF_CHECK_INTERVAL_MS);

  setTimeout(runSelfCheck, 10000);

  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const metrics = getMetrics();
    let statusCode = 200;
    if (metrics.bot.status !== 'LIVE' || metrics.bot.selfCheckStatus.includes('FAILURE')) {
      statusCode = 503;
    }
    res.writeHead(statusCode);
    res.end(JSON.stringify(metrics, null, 2));
  });

  server.listen(MONITOR_PORT, () => {
    console.log(`\n[Monitor] Health check server running on port ${MONITOR_PORT}`);
    console.log(`[Monitor] Internal self-check configured for every 4 minutes.`);
  });

  server.on('error', (e) => {
    console.error(`[Monitor] HTTP Server error on port ${MONITOR_PORT}:`, e.message);
  });
}

module.exports = { startMonitor, MONITOR_PORT, getMetrics };