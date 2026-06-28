const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const writeLog = (filename, level, message) => {
  const logPath = path.join(logsDir, filename);
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}\n`;
  fs.appendFileSync(logPath, logMessage, 'utf8');
};

const logRegistration = (message) => {
  writeLog('registration.log', 'INFO', message);
};

const logEmail = (message) => {
  writeLog('email.log', 'INFO', message);
};

const logError = (message) => {
  writeLog('error.log', 'ERROR', message);
};

module.exports = {
  logRegistration,
  logEmail,
  logError
};
