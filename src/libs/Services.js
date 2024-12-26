"use strict";

const { model } = require("./Utilities");
const { Hash } = require("./Hash");

/* class Services => untuk membantu logic2 yg lebih komplex */
class Services {
    isValidEmail(email) {
        if (!email) return false;
        if (email && email.length < 5) return false;
        if (email && email.indexOf("@") < 2) return false;
        return true;
    }
    async checkExistsUser({ username, email }) {
        try {
            const m = model("users");
            const exists = await m.findOne({
                $or: [
                    {
                        username
                    },
                    {
                        email
                    }
                ]
            });
            if (exists) throw new Error("User or Email Already Exists");
        } catch (err) {
            throw err;
        }
    }
    async validateUserRegister({
        username,
        email,
        firstname,
        lastname,
        password
    }) {
        try {
            // check all input are valid
            if (!username || (username && username.length < 5))
                throw new Error("Invalid Username. Min 5 Characters.");
            if (!this.isValidEmail(email)) throw new Error("Invalid Email");
            if (!firstname || (firstname && firstname.length < 1))
                throw new Error("Invalid First Name.");
            if (!lastname || (lastname && lastname.length < 1))
                throw new Error("Invalid Last Name.");
            if (!password || (password && password.length < 6))
                throw new Error("Invalid Password or Password Too Weak.");
            await this.checkExistsUser({ email, username });
            const code = `${
                new Date().getTime() +
                new Date().getHours() +
                new Date().getDay()
            }`.substr(7, 6);
            // debugger
            return {
                email,
                username,
                firstname,
                lastname,
                password: new Hash().encode(password),
                createdAt: new Date(),
                updatedAt: null,
                isVerified: false,
                activeUntil: new Date(
                    new Date().getTime() + 15 * 24 * 60 * 60 * 1000
                ), // 15hari trial
                verificationCode: `NF-${code}`,
                status: 0
            };
        } catch (err) {
            throw err;
        }
    }
}
module.exports = { Services };
