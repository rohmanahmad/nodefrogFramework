import crypto from "crypto";

import config from "../config";

/*
 * class Hash => untuk kebutuhan encryption termasuk didalamnya
 */
class Hash {
    protected algorithm: string = config.app.encryption.algorithm;
    protected key: Buffer<ArrayBuffer> = config.app.encryption.key;
    protected iv: Buffer<ArrayBuffer> | null = config.app.encryption.iv;
    encode(data: string) {
        try {
            const cipher = crypto.createCipheriv(
                this.algorithm,
                this.key,
                this.iv,
            );
            let encrypted = cipher.update(data, "utf8", "hex");
            encrypted += cipher.final("hex");
            return encrypted;
        } catch (err) {
            throw err;
        }
    }
    decode(encrytpedString: string = "") {
        try {
            const decipher = crypto.createDecipheriv(
                this.algorithm,
                this.key,
                this.iv,
            );
            let decrypted = decipher.update(encrytpedString, "hex", "utf8");
            decrypted += decipher.final("utf8");
            return decrypted;
        } catch (err) {
            throw err;
        }
    }
}
export default Hash;
