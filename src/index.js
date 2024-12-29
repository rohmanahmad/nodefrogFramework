"use strict";

require("dotenv").config({ path: __dirname + "/.env" });

if (!process.env.TEST) {
    new Server()
        .init()
        .port(parseInt(port || 3000))
        .theme("default")
        .routes()
        .start()
        .then(logInfo)
        .catch(errorlog);
} else {
    module.exports = Server;
}
