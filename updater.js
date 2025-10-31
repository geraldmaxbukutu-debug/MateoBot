const { exec } = require('child_process');
const { promisify } = require('util');
const { logger } = require('./utils/console.js');
const path = require('path');
const { restartBot } = require('./index.js'); 
const execPromise = promisify(exec);
const REPO_DIR = path.resolve(__dirname);
const BRANCH = 'main';
const REMOTE = 'origin';
const INTERVAL_MS = 6 * 60 * 60 * 1000;

/**
 * Executes a Git command.
 * @param {string} command - The git command to execute.
 * @returns {Promise<string>} The command output.
 */
async function gitExecute(command) {
  try {
    const { stdout } = await execPromise(`git -C ${REPO_DIR} ${command}`);
    return stdout.trim();
  } catch (error) {
    console.error(`[Updater] Git command failed: ${command}\nError: ${error.stderr || error.message}`);
    return "";
  }
}
let error;

async function checkForUpdates() {
  console.log(`\n[Updater] Checking for updates on branch ${BRANCH}...`);
  const fetchOutput = await gitExecute(`fetch ${REMOTE} ${BRANCH}`);
  if (fetchOutput.includes("fatal: not a git repository")) {
    console.warn("[Updater] WARNING: Bot directory is not a Git repository. Auto-updater disabled.");
    error = true;
    return;
  }
  const count = await gitExecute(`rev-list --count HEAD..${REMOTE}/${BRANCH}`);
  const updatesPending = parseInt(count, 10);
  if (updatesPending > 0) {
    console.log(`\n===============`);
    console.log(`🚨 UPDATE FOUND! Local branch is behind by ${updatesPending} commit(s).`);
    console.log(`===============`);
    const pullOutput = await gitExecute(`pull ${REMOTE} ${BRANCH}`);
    console.log(`✅ Git Pull successful. Output:\n${pullOutput}`);
    console.log(`\n🚀 Restarting bot to apply updates...`);
    restartBot();
  } else {
    console.log(`✅ [Updater] No9 updates found. Local branch is up-to-date.`);
  }
}

function startUpdater() {
  checkForUpdates();
  return setInterval(checkForUpdates, INTERVAL_MS);
}

module.exports = { startUpdater, updatesPending, error };