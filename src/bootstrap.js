"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const { hashEncode } = require("./libs/Hash");
const { passAuth } = require("./libs/Utilities");
const app = express();
const config = require("./configs");
const {
    app: { port, debug },
    factory,
    models,
    security: { enabled: authEnabled }
} = config;
const documentation = require("./documentation");
const { Database } = require("./libs/Database");
const { Controllers } = require("./libs/Controller");
const { Logger, logInfo, errorlog } = require("./libs/Logger");

app.disable("x-powered-by"); // remove default header x-powered-by
app.use(express.json()); // json parser
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(express.static(__dirname + "/swagger")); // static for documentation/swagger
app.use(bodyParser.json()); // handling json raw

// set custom header
app.use(function (req, res, next) {
    res.setHeader("x-powered-by", "NodeFrog Framework");
    req.config = {
        processId: hashEncode(`${new Date().getTime()}`)
    };
    next();
});

/*
 * class Server => berisi semua fungsi untuk kebutuhan server
 */
class Server {
    init() {
        this.currentPort = 3000;
        this.currentTheme = "default";
        this.logger = new Logger();
        this.db = new Database();
        return this;
    }
    port(port) {
        this.currentPort = port || 3000;
        return this;
    }
    theme(theme) {
        this.currentTheme = theme || "default";
        return this;
    }
    isSecure(authRoutes, key) {
        return authEnabled && authRoutes.indexOf(key) > -1;
    }
    registerResponseMacros() {
        logInfo("Registering Response Macros");
        app.response.logger = this.logger;
        app.response.apiSuccess = function (message = "Success") {
            this.status(200).send({ message });
        };
        app.response.apiCollection = function (data = {}) {
            this.status(200).send(data);
        };
        app.response.apiError = function (err) {
            this.status(200).send({ message: err.data });
            this.logger.logErrorStream(err, "api.error");
        };
    }
    routes() {
        const c = new Controllers();
        app.use((req, res, next) => {
            logInfo(
                `|.. ${req.method}`,
                req.originalUrl,
                debug ? JSON.stringify(req.body || {}) : ""
            );
            next();
        });
        app.get("/", function (req, res) {
            res.send({});
        });
        app.get("/docs", function (req, res) {
            res.send(documentation.view);
        });
        app.get("/swagger.json", function (req, res) {
            res.send(documentation.paths);
        });
        app.post("/authentication/login", c.login);
        app.post("/authentication/register", c.register);
        const allModels = { ...factory.models, ...models };
        let index = 1;
        for (let m in allModels) {
            if (allModels[m]["api"]) {
                logInfo(`|. registering route: (#${index})`, m.toLowerCase());

                const authRoutes = allModels[m]["auth"]["routes"];
                const paths = allModels[m]["paths"];
                let authfind = this.isSecure(authRoutes, "find")
                    ? authentication
                    : passAuth;
                let authfindOne = this.isSecure(authRoutes, "findOne")
                    ? authentication
                    : passAuth;
                let authcreate = this.isSecure(authRoutes, "create")
                    ? authentication
                    : passAuth;
                let authupdateOne = this.isSecure(authRoutes, "updateOne")
                    ? authentication
                    : passAuth;
                let authupdateMany = this.isSecure(authRoutes, "updateMany")
                    ? authentication
                    : passAuth;
                let authdeleteOne = this.isSecure(authRoutes, "deleteOne")
                    ? authentication
                    : passAuth;
                let authdeleteMany = this.isSecure(authRoutes, "deleteMany")
                    ? authentication
                    : passAuth;
                let authaggregate = this.isSecure(authRoutes, "aggregate")
                    ? authentication
                    : passAuth;

                if (paths.indexOf("find") > -1) {
                    app.post(`/:${m.toLowerCase()}/find`, [
                        authfind,
                        c.find.bind({
                            config,
                            Database,
                            Controllers,
                            logger: this.logger
                        })
                    ]);
                    logInfo(
                        `|... /:${m.toLowerCase()}/findOne`,
                        this.isSecure(authRoutes, "find")
                            ? "@secure-route"
                            : "pass"
                    );
                }
                if (paths.indexOf("findOne") > -1) {
                    app.post(`/:${m.toLowerCase()}/findOne`, [
                        authfindOne,
                        c.findOne.bind({
                            config,
                            Database,
                            Controllers,
                            logger: this.logger
                        })
                    ]);
                    logInfo(
                        `|... /:${m.toLowerCase()}/findOne`,
                        this.isSecure(authRoutes, "findOne")
                            ? "@secure-route"
                            : "pass"
                    );
                }
                if (paths.indexOf("create") > -1) {
                    app.post(`/:${m.toLowerCase()}/create`, [
                        authcreate,
                        c.create.bind({
                            config,
                            Database,
                            Controllers,
                            logger: this.logger
                        })
                    ]);
                    logInfo(
                        `|... /:${m.toLowerCase()}/create`,
                        this.isSecure(authRoutes, "create")
                            ? "@secure-route"
                            : "pass"
                    );
                }
                if (paths.indexOf("updateOne") > -1) {
                    app.post(`/:${m.toLowerCase()}/updateOne`, [
                        authupdateOne,
                        c.updateOne.bind({
                            config,
                            Database,
                            Controllers,
                            logger: this.logger
                        })
                    ]);
                    logInfo(
                        `|... /:${m.toLowerCase()}/updateOne`,
                        this.isSecure(authRoutes, "updateOne")
                            ? "@secure-route"
                            : "pass"
                    );
                }
                if (paths.indexOf("updateMany") > -1) {
                    app.post(`/:${m.toLowerCase()}/updateMany`, [
                        authupdateMany,
                        c.updateMany.bind({
                            config,
                            Database,
                            Controllers,
                            logger: this.logger
                        })
                    ]);
                    logInfo(
                        `|... /:${m.toLowerCase()}/updateMany`,
                        this.isSecure(authRoutes, "updateMany")
                            ? "@secure-route"
                            : "pass"
                    );
                }
                if (paths.indexOf("deleteOne") > -1) {
                    app.post(`/:${m.toLowerCase()}/deleteOne`, [
                        authdeleteOne,
                        c.deleteOne.bind({
                            config,
                            Database,
                            Controllers,
                            logger: this.logger
                        })
                    ]);
                    logInfo(
                        `|... /:${m.toLowerCase()}/deleteOne`,
                        this.isSecure(authRoutes, "deleteOne")
                            ? "@secure-route"
                            : "pass"
                    );
                }
                if (paths.indexOf("deleteMany") > -1) {
                    app.post(`/:${m.toLowerCase()}/deleteMany`, [
                        authdeleteMany,
                        c.deleteMany.bind({
                            config,
                            Database,
                            Controllers,
                            logger: this.logger
                        })
                    ]);
                    logInfo(
                        `|... /:${m.toLowerCase()}/deleteMany`,
                        this.isSecure(authRoutes, "deleteMany")
                            ? "@secure-route"
                            : "pass"
                    );
                }
                if (paths.indexOf("aggregate") > -1) {
                    app.post(`/:${m.toLowerCase()}/aggregate`, [
                        authaggregate,
                        c.aggregate.bind({
                            config,
                            Database,
                            Controllers,
                            logger: this.logger
                        })
                    ]);
                    logInfo(
                        `|... /:${m.toLowerCase()}/aggregate`,
                        this.isSecure(authRoutes, "aggregate")
                            ? "@secure-route"
                            : "pass"
                    );
                }
            }
            index += 1;
        }
        app.all("*", function (req, res, next) {
            res.status(404).send({
                statusCode: 404,
                message: "Not Found"
            });
        });
        this.registerResponseMacros();
        return this;
    }
    start() {
        return new Promise((resolve, reject) => {
            app.listen(this.currentPort, (err, res) => {
                if (err) reject(err);
                logInfo("server listen", this.currentPort);
            });
        });
    }
}
