"use strict";

type LoggerData = any;

class Logger {
    constructor() {
        //
    }
    logInfo(...data: LoggerData[]) {
        console.log(`[]`, ...data);
    }
    logError(...data: LoggerData[]) {
        console.error(...data);
    }
    logInfoStream(data: LoggerData, subject = "log.info") {
        this.logInfo(data);
    }
    logErrorStream(data: LoggerData, subject = "log.error") {
        this.logError(data);
    }
}

export default Logger;
