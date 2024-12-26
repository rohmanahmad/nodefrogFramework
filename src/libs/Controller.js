"use strict";

const { Hash } = require("./Hash");
const { Services } = require("./Services");
const {
    security: { acl },
    app: {
        session: { exp }
    }
} = require("../configs");
const { model } = require("./Utilities");
const { Logger } = require("./Logger");

let sessionLong = 60; // default menit
const sessionNumber = parseInt(exp);

if (exp.indexOf("s") > -1) sessionLong = 1;
else if (exp.indexOf("m") > -1) sessionLong = 60;
else if (exp.indexOf("h") > -1) sessionLong = 60 * 60;
else if (exp.indexOf("d") > -1) sessionLong = 60 * 60 * 24;

const sessionExp = sessionNumber * sessionLong;

/*
 * class Controllers => digunakan untuk mengontrol semua fungsi yg dipanggil dari setiap rute yang terdaftar.
 */
class Controllers {
    constructor() {
        this.logger = new Logger();
    }
    async login(req, res, next) {
        try {
            let { username, password } = req.body;
            if (!username || (username && username.length === ""))
                throw new Error("Invalid Username or Password");
            const usersModel = model("users");
            let loginInformation = await usersModel.findOne({ username });
            if (!loginInformation)
                throw new Error("Invalid Username or Password");
            if (loginInformation.status === 0)
                throw new Error("User Inactive. Please Reactivate");
            const decodedPass = new Hash().decode(information.password);
            if (password !== decodedPass) throw new Error(error);
            const ttl = new Date().getTime() + sessionExp;
            res.apiCollection({
                statusCode: 200,
                data: {
                    token: new Hash()
                        .des(
                            JSON.stringify({
                                username: information.username,
                                ttl
                            })
                        )
                        .toUpperCase(),
                    expired: ttl,
                    basicInformation: {
                        id: information._id.toString().toUpperCase(),
                        fullname: information.fullname
                    }
                }
            });
        } catch (err) {
            res.apiError(err);
        }
    }
    async register(req, res, next) {
        try {
            const body = req.body || {};
            const m = model("users");
            const data = await new Services().validateUserRegister(body);
            await m.create(data);
            res.apiSuccess();
        } catch (err) {
            res.apiError(err);
        }
    }
    async find(req, res, next) {
        try {
            const mdl = Object.keys(req.params)[0];
            let { limit, skip, page } = validateQueries(req.query);
            const query = req.body || {};
            const m = model(req.params[mdl]);
            let items = await m.find(query).skip(skip).limit(limit);
            if (req.params[mdl] === "users") {
                items = items.map((x) => {
                    x.password = "[hidden]";
                    return x;
                });
            }
            res.send({
                statusCode: 200,
                config: {
                    processId: req.config.processId,
                    query: { limit, page, query }
                },
                items
            });
        } catch (err) {
            res.apiError(err);
        }
    }
    async findOne(req, res, next) {
        try {
            let { limit, skip, page } = validateQueries(req.query);
            const query = req.body || {};
            const mdl = Object.keys(req.params)[0];
            const m = model(req.params[mdl]);
            const item = await m.findOne(query).skip(skip).limit(limit);
            res.send({ statusCode: 200, config: { limit, page, query }, item });
        } catch (err) {
            res.apiError(err);
        }
    }
    async create(req, res, next) {
        try {
            const data = req.body || {};
            const mdl = Object.keys(req.params)[0];
            const m = model(req.params[mdl]);
            let item = null;
            if (data && data[0]) {
                item = await m.insertMany(data);
            } else {
                item = await m.create(data);
            }
            res.send({ statusCode: 200, config: { data }, item });
        } catch (err) {
            res.apiError(err);
        }
    }
    async updateOne(req, res, next) {
        try {
            let { objectId, upsert } = validateQueries(req.query);
            const data = req.body || {};
            const mdl = Object.keys(req.params)[0];
            const m = model(req.params[mdl]);
            let item = null;
            item = await m.updateOne({ _id: objectId }, data, {
                upsert: upsert || false
            });
            res.send({ statusCode: 200, config: { data }, item });
        } catch (err) {
            res.apiError(err);
        }
    }
    async updateMany(req, res, next) {
        try {
            let { upsert } = validateQueries(req.query);
            const { criteria, update } = req.body || {};
            const mdl = Object.keys(req.params)[0];
            const m = model(req.params[mdl]);
            let item = null;
            if (!criteria) throw "Need Criteria Object!";
            if (!update) throw "Need Update Object!";
            if (typeof criteria !== "object")
                throw "Criteria Must be an Object";
            if (typeof update !== "object") throw "Update Must be an Object";
            item = await m.updateOne(criteria, update, {
                upsert: upsert || false
            });
            res.send({ statusCode: 200, config: { criteria, update }, item });
        } catch (err) {
            res.apiError(err);
        }
    }
    async deleteOne(req, res, next) {
        try {
            let { objectId } = validateQueries(req.query);
            const query = objectId ? { _id: objectId } : req.body;
            if (Object.keys(query).length === 0)
                throw "Need Body Object or objectId(query)";
            const mdl = Object.keys(req.params)[0];
            const m = model(req.params[mdl]);
            const items = await m.deleteOne(query);
            res.send({ statusCode: 200, config: { query }, items });
        } catch (err) {
            res.apiError(err);
        }
    }
    async deleteMany(req, res, next) {
        try {
            const query = req.body;
            if (Object.keys(query).length === 0)
                throw "Need Body Object or objectId(query)";
            const mdl = Object.keys(req.params)[0];
            const m = model(req.params[mdl]);
            const items = await m.deleteMany(query);
            res.send({ statusCode: 200, config: { query }, items });
        } catch (err) {
            res.apiError(err);
        }
    }
    async aggregate(req, res, next) {
        try {
            const aggregate = req.body;
            if (Object.keys(aggregate).length === 0)
                throw "Need Aggregate(Body Object Array)";
            if (!aggregate[0]) throw "Aggregate need Array Object";
            const mdl = Object.keys(req.params)[0];
            const m = model(req.params[mdl]);
            const items = await m.aggregate(aggregate);
            res.send({ statusCode: 200, config: { aggregate }, items });
        } catch (err) {
            res.apiError(err);
        }
    }
}

module.exports = { Controllers };
