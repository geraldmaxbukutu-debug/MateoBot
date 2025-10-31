const chalk = require('chalk');
const bold = chalk.bold;
const MateoBot = bold.cyan('[Mateo Bot]: ');

function log(text) {
  const sign = "💬";
  return console.log(`${MateoBot} ${text}`).trim;
}

function warnc(text) {
  const sign = "⚠️";
  const yellow = chalk.yellow;
  let output = bold("WARNING: ") + text;
  return console.log(yellow(sign + ' ' + MateoBot + ' ' + output)).trim;
}

function errorc(text) {
  const sign = "🔴";
  const red = chalk.red;
  let output = bold("ERROR: ") + text;
  return console.log(red(sign + ' ' + MateoBot + ' ' + output)).trim;
}

function infoc(text) {
  const sign = "ℹ️";
  const blue = chalk.blue;
  let output = bold("INFO: ") + text;
  return console.log(blue(sign + ' ' + MateoBot + ' ' + output)).trim;
}

function successc(text) {
  const sign = "✅";
  const green = chalk.green;
  let output = bold("SUCCESS: ") + text;
  return console.log(green(sign + ' ' + MateoBot + ' ' + output)).trim;
}

const logger = log;
logger.warn = warnc;
logger.error = errorc;
logger.info = infoc;
logger.success = successc;

module.exports = logger;