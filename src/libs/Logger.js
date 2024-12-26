"use strict";

const logInfo = function (...data) {
    console.log(...data);
};
const logError = function (...data) {
    console.error(...data);
};

class Logger {
    logInfoStream(data, subject = "log.info") {
        logInfo(data);
    }
    logErrorStream(data, subject = "log.error") {
        logError(data);
    }
}

module.exports = { Logger, logInfo, logError };
