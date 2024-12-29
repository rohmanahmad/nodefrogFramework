const appKey: String = process.env.APP_KEY || "";

export default {
    debug: process.env.APP_DEBUG_LEVEL,
    session: {
        exp: "1h",
    },
    encryption: {
        algorithm: "aes-128-ecb",
        key: Buffer.from(appKey, "utf-8"),
        iv: null,
    },
    baseUrl: process.env.APP_BASE_URL,
    port: process.env.APP_PORT,
    env: process.env.APP_ENV,
};
