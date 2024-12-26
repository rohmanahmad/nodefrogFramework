const { getEnv } = require("../libs/Utilities");

module.exports = {
    debug: getEnv("APP_DEBUG_LEVEL"),
    session: {
        exp: "1h"
    },
    encryption: {
        algorithm: "aes-128-ecb",
        key: Buffer.from("4KhYvjOeEOMh97ct", "utf-8"),
        iv: null
    },
    baseUrl: getEnv("APP_BASE_URL"),
    port: getEnv("APP_PORT"),
    env: getEnv("APP_ENV", "production")
};
