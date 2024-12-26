"use strict";

const mongoose = require("mongoose");
const { logInfo } = require("./Logger");

/*
 * aliases => berfungsi sebagai alias dari model/ bisa dibilang
 */
const aliases = {
    acl: "ACL",
    users: "Users",
    accounts: "Accounts",
    categories: "Categories",
    transaction: "Transaction"
};
const getEnv = function (key, defaultValue = "") {
    return process.env[key] || defaultValue;
};
/*
 * model => tujuannya untuk mencari model yg sudah di mapping pada variable alias
 */
const model = function (m) {
    m = aliases[m];
    const models = mongoose.models;
    if (models[m]) return models[m];
    throw "Model Not Found";
};

/*
 * validateQueries => digunakan untuk memvalidasi semua query yg masuk dan akan di validasi sesuai dengan yang terdefinisi pada config/documentation
 */
const validateQueries = function (queries = {}) {
    let valid = {};
    let { limit, page, objectId, upsert } = queries;
    if (limit) {
        limit = parseInt(limit || 10);
        if (limit < 0) limit = 10;
        valid["limit"] = limit;
    }
    if (page) {
        page = parseInt(page || 1);
        if (page > 0) page -= 1;
        const skip = limit * page - page;
        valid["page"] = page + 1;
        valid["skip"] = skip;
    }
    if (objectId) {
        try {
            valid["objectId"] = mongoose.Types.ObjectId(objectId);
        } catch (err) {
            throw "Invalid ID (Object)";
        }
    }
    if (upsert) {
        valid["upsert"] = upsert === "true" || upsert === "yes";
    }
    return valid;
};
/*
 * authentication => digunakan untuk mengaktifkan fungsi auth dari setiap request yg dituju.
 */
const authentication = function (req, res, next) {
    try {
        const token = req.header("x-api-key") || req.query["x-token"];
        if (!token) throw new Error("The Token Required For This Endpoint");
        next();
    } catch (err) {
        res.status(402).send({
            statusCode: 402,
            message: "Bad Auth Token!",
            error: err.message
        });
    }
};
const authAccessControll = function (req, res, next) {
    try {
    } catch (err) {
        res.status(403).send({
            statusCode: 403,
            message: "Not Permitted",
            error: err.message
        });
    }
};
/*
 * passAuth => fungsi yang digunakan untuk bypass semua authentikasi
 */
const passAuth = function (req, res, next) {
    logInfo("|.. passing authentication");
    next();
};

module.exports = {
    model,
    validateQueries,
    authentication,
    authAccessControll,
    passAuth,
    getEnv
};
