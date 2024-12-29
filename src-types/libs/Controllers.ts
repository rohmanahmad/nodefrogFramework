"use strict";

import { NextFunction, Request, Response } from "express";
import models from "../configs/models";
import Logger from "./Logger";
import mongoose from "mongoose";

const { Hash } = require("./Hash");
const { Services } = require("./Services");
const {
    security: { acl },
    app: {
        session: { exp },
    },
} = require("../configs");

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
type Models = typeof models;
class Controllers {
    protected logger: typeof Logger;
    protected models: typeof mongoose.modelNames;
    constructor({ Log, models }: { Log: typeof Logger; models: Models }) {
        this.logger = Log;
        this.models = mongoose.modelNames;
    }
    async login(req: Request, res: Response, next: NextFunction) {
        try {
            let { username, password } = req.body;
            if (!username || (username && username.length === "")) {
                throw new Error("Invalid Username or Password");
            }
            const usersModel = this.models.Accounts;
            let loginInformation = await usersModel.findOne({ username });
            if (!loginInformation) {
                throw new Error("Invalid Username or Password");
            }
            if (loginInformation.status === 0) {
                throw new Error("User Inactive. Please Reactivate");
            }
            const decodedPass = new Hash().decode(loginInformation.password);
            if (password !== decodedPass) {
                throw new Error("Invalid Username or Password");
            }
            const ttl = new Date().getTime() + sessionExp;
            res.apiCollection({
                statusCode: 200,
                data: {
                    token: new Hash()
                        .des(
                            JSON.stringify({
                                username: loginInformation.username,
                                ttl,
                            }),
                        )
                        .toUpperCase(),
                    expired: ttl,
                    basicInformation: {
                        id: loginInformation._id.toString().toUpperCase(),
                        fullname: loginInformation.fullname,
                    },
                },
            });
        } catch (err) {
            res.apiError(err);
        }
    }
    async register(req: Request, res: Response, next: NextFunction) {
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
    async find(req: Request, res: Response, next: NextFunction) {
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
                    query: { limit, page, query },
                },
                items,
            });
        } catch (err) {
            res.apiError(err);
        }
    }
    async findOne(req: Request, res: Response, next: NextFunction) {
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
    async create(req: Request, res: Response, next: NextFunction) {
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
    async updateOne(req: Request, res: Response, next: NextFunction) {
        try {
            let { objectId, upsert } = validateQueries(req.query);
            const data = req.body || {};
            const mdl = Object.keys(req.params)[0];
            const m = model(req.params[mdl]);
            let item = null;
            item = await m.updateOne({ _id: objectId }, data, {
                upsert: upsert || false,
            });
            res.send({ statusCode: 200, config: { data }, item });
        } catch (err) {
            res.apiError(err);
        }
    }
    async updateMany(req: Request, res: Response, next: NextFunction) {
        try {
            let { upsert } = validateQueries(req.query);
            const { criteria, update } = req.body || {};
            const mdl = Object.keys(req.params)[0];
            const m = model(req.params[mdl]);
            let item = null;
            if (!criteria) throw "Need Criteria Object!";
            if (!update) throw "Need Update Object!";
            if (typeof criteria !== "object") {
                throw "Criteria Must be an Object";
            }
            if (typeof update !== "object") throw "Update Must be an Object";
            item = await m.updateOne(criteria, update, {
                upsert: upsert || false,
            });
            res.send({ statusCode: 200, config: { criteria, update }, item });
        } catch (err) {
            res.apiError(err);
        }
    }
    async deleteOne(req: Request, res: Response, next: NextFunction) {
        try {
            let { objectId } = validateQueries(req.query);
            const query = objectId ? { _id: objectId } : req.body;
            if (Object.keys(query).length === 0) {
                throw "Need Body Object or objectId(query)";
            }
            const mdl = Object.keys(req.params)[0];
            const m = model(req.params[mdl]);
            const items = await m.deleteOne(query);
            res.send({ statusCode: 200, config: { query }, items });
        } catch (err) {
            res.apiError(err);
        }
    }
    async deleteMany(req: Request, res: Response, next: NextFunction) {
        try {
            const query = req.body;
            if (Object.keys(query).length === 0) {
                throw "Need Body Object or objectId(query)";
            }
            const mdl = Object.keys(req.params)[0];
            const m = model(req.params[mdl]);
            const items = await m.deleteMany(query);
            res.send({ statusCode: 200, config: { query }, items });
        } catch (err) {
            res.apiError(err);
        }
    }
    async aggregate(req: Request, res: Response, next: NextFunction) {
        try {
            const aggregate = req.body;
            if (Object.keys(aggregate).length === 0) {
                throw "Need Aggregate(Body Object Array)";
            }
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

export default Controllers;
