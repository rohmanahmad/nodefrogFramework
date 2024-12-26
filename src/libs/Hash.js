"use strict";

const crypto = require("crypto");

const {
    app: {
        encryption: { algorithm, key, iv }
    }
} = require("../configs");
/*
 * class Hash => untuk kebutuhan encryption termasuk didalamnya
 */
class Hash {
    des(data) {
        return hashEncode(data);
    }
    encode(data) {
        try {
            const cipher = crypto.createCipheriv(algorithm, key, iv);
            let encrypted = cipher.update(data, "utf8", "hex");
            encrypted += cipher.final("hex");
            return encrypted;
        } catch (err) {
            throw err;
        }
    }
    decode(encrytpedString = "") {
        try {
            const decipher = crypto.createDecipheriv(algorithm, key, iv);
            let decrypted = decipher.update(encrytpedString, "hex", "utf8");
            decrypted += decipher.final("utf8");
            return decrypted;
        } catch (err) {
            throw err;
        }
    }
}
const hashEncode = function (data) {
    try {
        const key = Buffer.from("DoNotUseUTF8Keys", "utf-8");
        const cipher = crypto.createCipheriv("aes-128-ecb", key, null);
        let encrypted = cipher.update(data, "utf8", "hex");
        encrypted += cipher.final("hex");
        return encrypted.toLocaleLowerCase();
    } catch (err) {
        throw err;
    }
};
module.exports = { Hash, hashEncode };
