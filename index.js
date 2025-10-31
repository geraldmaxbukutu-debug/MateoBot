const { spawn } = require('child_process');
const fs = require('fs');
const express = require('express');
const app = express();
const settings = JSON.parse(fs.readFileSync('./settings.json', 'utf8'));
const interval = (settings.restartIntervalMinutes || 60) * 60 * 1000;
let botProcess;

/**
 * Starts or restarts the bot process.
 */
function restartBot() {
  if (botProcess) {
    botProcess.kill('SIGTERM');
    botProcess = null;
  }
  botProcess = spawn('node', ['gerald.js'], { stdio: 'inherit' });
  botProcess.on('exit', (code) => {
    console.log(`[AutoRestart] Bot exited with code ${code}. Restarting...`);
    restartBot(); // Restart on exit
  });
}

app.listen(3000, () => {
  console.log('Server listening on port 3000');
  restartBot(); // Start bot after server is listening
});

setInterval(() => {
  console.log('[AutoRestart] Restarting bot...');
  restartBot();
}, interval);

module.exports = restartBot;