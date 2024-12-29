"use strict";

import mongoose from "mongoose";
import Logger from "./Logger";
import ModelControls from "./ModelControls";
const {
    db,
    app: { env },
} = require("../configs");
/*
 * class Database => untuk kebutuhan Database connection dan segala yg berhubungan dengan database
 */
class Database extends ModelControls {
    constructor() {
        super();
        this.checkConnection();
    }
    /*
     * connect -> digunakan untuk mengkoneksikan api dengan database
     *  - semua config dapat disetting secara manual pada config.js pada bagian db.mongo
     */
    connect() {
        if (!db.mongo) throw "Invalid Mongodb URI Config!";
        // mongoose debug mode actived when the environment not in production mode
        if (
            ["development", "uat", "performance-test", "stress-test"].indexOf(
                env,
            ) > -1
        ) {
            mongoose.set("debug", true);
        }
        mongoose
            .connect(db.mongo, {})
            .catch(errorlog);
    }
    /*
     * checkConnection -> dipanggil pada constructor, sehingga semua query yang akan dilakukan
     *                    akan melakukan pengecekan koneksi ke server database.
     *   - bila koneksi putus/closed maka akan otomatis memanggil fungsi connect()
     */
    checkConnection() {
        if (mongoose.connection.readyState === 0) this.connect();
        mongoose.connection
            .on("error", (err) => errorlog(err))
            .on("disconnected", (e) => {
                logInfo("mongo disconnected & reconnecting in 10s...");
                setTimeout(() => {
                    this.connect();
                }, 10 * 1000);
            })
            .on("close", (e) => {
                logInfo("mongo closed!");
                this.connect();
            })
            .on("connected", () => {
                this.register();
                logInfo("|. mongodb connected");
            });
    }
}

export default Database;
