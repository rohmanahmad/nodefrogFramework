"use strict";

import mongoose = from "mongoose";
import config from "../configs/database";
import Logger from './Logger';
const Schema = mongoose.Schema;
const { models, factory } = config;
/*
 * class ModelControls => untuk kebutuhan controlling models yg sudah di definisikan
 */
class ModelControls {
    protected logger: Logger
    constructor({ Logger }: {Logger: Logger}) {
        this.logger = Logger
    }
    /*
     * getFormatSchema -> digunakan untuk mengambil dan mensetting tipe data dari setiap field dalam sebuah schema model
     */
    getFormatSchema(sc) {
        let schema = {};
        for (let s in sc) {
            let type = String;
            if (sc[s] === "<number>") type = Number;
            if (sc[s] === "<date>") type = Date;
            if (sc[s] === "<objectId>") type = mongoose.Types.ObjectId;
            schema[s] = type;
        }
        return schema;
    }
    /*
     * register -> untuk meregistrasi semua config model yg sudah di definisikan pada config.js
     *             baik dari user defined maupun factory.
     */
    register() {
        // registrasi model yg sudah anda definisikan
        for (let m in models) {
            const sch = new Schema(this.getFormatSchema(models[m]["schema"]));
            mongoose.model(m, sch, m.toLowerCase());
        }
        // registrasi model bawaan/factory sudah definisikan
        for (let m in factory.models) {
            const sch = new Schema(
                this.getFormatSchema(factory.models[m]["schema"])
            );
            mongoose.model(m, sch, m.toLowerCase());
        }
    }
}

export default ModelControls;
