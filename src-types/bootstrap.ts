import express, { Express, NextFunction, Request, Response } from "express";
import bodyParser from "body-parser";
import Hash from "./libs/Hash";
import config from "./config";
import mongoose from "mongoose";

const app = express();
const {
    app: { port, debug },
    factory,
    models,
    security: { enabled: authEnabled },
} = config;
import Documentation from "./libs/Documentation";
import Database from "./libs/Database";
import Controllers from "./libs/Controllers";
import Logger from "./libs/Logger";
import lodashResult from "lodash.result";
import { ModelSchema } from "./configs/models";
import AuthMiddleware from "./middlewares/authentication";

declare global {
    namespace Express {
        export interface Response {
            logger: Logger;
            apiSuccess: Function;
            apiCollection: Function;
            apiError: Function;
        }
        export interface Request {
            logger: Logger;
        }
    }
}

app.disable("x-powered-by"); // remove default header x-powered-by
app.use(express.json()); // json parser
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(express.static(__dirname + "/swagger")); // static for documentation/swagger
app.use(bodyParser.json()); // handling json raw

// set custom header
app.use(function (req: Request, res: Response, next: NextFunction) {
    res.setHeader("x-powered-by", "NodeFrog Framework");
    next();
});

const passAuth = function (req: Request, res: Response, next: NextFunction) {
    next();
};

export class Bootstrap {
    private currentPort: number;
    private currentTheme: string;
    private logger: Logger;
    private db: Database;
    private app: Express = app;

    constructor() {
        this.currentPort = 3000;
        this.currentTheme = "default";
        this.logger = new Logger();
        this.db = new Database({ Logger });
    }
    init() {
        return this;
    }
    port(port: number) {
        this.currentPort = port || 3000;
        return this;
    }
    theme(theme: string) {
        this.currentTheme = theme || "default";
        return this;
    }
    isSecure(authRoutes: string[], key: string) {
        return authEnabled && authRoutes.indexOf(key) > -1;
    }
    registerResponseMacros() {
        this.logger.logInfo("Registering Response Macros");
        app.response.logger = this.logger;
        app.response.apiSuccess = function (message = "Success") {
            this.status(200).send({ message });
        };
        app.response.apiCollection = function (data = {}) {
            this.status(200).send(data);
        };
        app.response.apiError = function (err: Error) {
            this.status(200).send({ message: err.message });
            this.logger.logErrorStream(err, "api.error");
        };
    }
    registerRequestMacros() {
        this.logger.logInfo("Registering Response Macros");
        app.request.logger = this.logger;
    }
    routes() {
        const allModels: { [key: string]: ModelSchema } = Object.assign(
            {},
            factory.models,
            models,
        );
        const c = new Controllers({ Logger, models: mongoose.models });
        app.use(function (req: Request, res: Response, next: NextFunction) {
            res.logger.logInfo(
                `|.. ${req.method}`,
                req.originalUrl,
                debug ? JSON.stringify(req.body || {}) : "",
            );
            next();
        });
        app.get("/", function (req: Request, res: Response) {
            res.send({});
        });
        app.get("/docs", function (req: Request, res: Response) {
            res.send(Documentation.view);
        });
        app.get("/swagger.json", function (req: Request, res: Response) {
            res.send(Documentation.paths);
        });
        app.post("/authentication/login", c.login);
        app.post("/authentication/register", c.register);
        let index = 1;
        for (const modelName in allModels) {
            const selectedModel = lodashResult(allModels, modelName);
            const isExposeAPI: boolean = lodashResult(
                selectedModel,
                "api",
                false,
            );
            if (isExposeAPI) {
                this.logger.logInfo(
                    `|. registering route: (#${index})`,
                    modelName,
                );

                const authRoutes: string[] = lodashResult(
                    selectedModel,
                    "auth.routes",
                    [],
                );
                const paths: ModelSchema["paths"] = lodashResult(
                    selectedModel,
                    "paths",
                    [],
                );

                if (paths.indexOf("find") > -1) {
                    const authfind = this.isSecure(authRoutes, "find")
                        ? AuthMiddleware
                        : passAuth;
                    app.post(`/:${modelName}/find`, [
                        authfind,
                        c.find.bind({
                            config,
                            Database,
                            Controllers,
                            logger: this.logger,
                        }),
                    ]);
                    this.logger.logInfo(
                        `|... /:${modelName}/findOne`,
                        this.isSecure(authRoutes, "find")
                            ? "@secure-route"
                            : "pass",
                    );
                }
                if (paths.indexOf("findOne") > -1) {
                    const authfindOne = this.isSecure(authRoutes, "findOne")
                        ? AuthMiddleware
                        : passAuth;
                    app.post(`/:${modelName}/findOne`, [
                        authfindOne,
                        c.findOne.bind({
                            config,
                            Database,
                            Controllers,
                            logger: this.logger,
                        }),
                    ]);
                    this.logger.logInfo(
                        `|... /:${modelName}/findOne`,
                        this.isSecure(authRoutes, "findOne")
                            ? "@secure-route"
                            : "pass",
                    );
                }
                if (paths.indexOf("create") > -1) {
                    const authcreate = this.isSecure(authRoutes, "create")
                        ? AuthMiddleware
                        : passAuth;
                    app.post(`/:${modelName}/create`, [
                        authcreate,
                        c.create.bind({
                            config,
                            Database,
                            Controllers,
                            logger: this.logger,
                        }),
                    ]);
                    this.logger.logInfo(
                        `|... /:${modelName}/create`,
                        this.isSecure(authRoutes, "create")
                            ? "@secure-route"
                            : "pass",
                    );
                }
                if (paths.indexOf("updateOne") > -1) {
                    const authupdateOne = this.isSecure(authRoutes, "updateOne")
                        ? AuthMiddleware
                        : passAuth;
                    app.post(`/:${modelName}/updateOne`, [
                        authupdateOne,
                        c.updateOne.bind({
                            config,
                            Database,
                            Controllers,
                            logger: this.logger,
                        }),
                    ]);
                    this.logger.logInfo(
                        `|... /:${modelName}/updateOne`,
                        this.isSecure(authRoutes, "updateOne")
                            ? "@secure-route"
                            : "pass",
                    );
                }
                if (paths.indexOf("updateMany") > -1) {
                    const authupdateMany =
                        this.isSecure(authRoutes, "updateMany")
                            ? AuthMiddleware
                            : passAuth;
                    app.post(`/:${modelName}/updateMany`, [
                        authupdateMany,
                        c.updateMany.bind({
                            config,
                            Database,
                            Controllers,
                            logger: this.logger,
                        }),
                    ]);
                    this.logger.logInfo(
                        `|... /:${modelName}/updateMany`,
                        this.isSecure(authRoutes, "updateMany")
                            ? "@secure-route"
                            : "pass",
                    );
                }
                if (paths.indexOf("deleteOne") > -1) {
                    const authdeleteOne = this.isSecure(authRoutes, "deleteOne")
                        ? AuthMiddleware
                        : passAuth;
                    app.post(`/:${modelName}/deleteOne`, [
                        authdeleteOne,
                        c.deleteOne.bind({
                            config,
                            Database,
                            Controllers,
                            logger: this.logger,
                        }),
                    ]);
                    this.logger.logInfo(
                        `|... /:${modelName}/deleteOne`,
                        this.isSecure(authRoutes, "deleteOne")
                            ? "@secure-route"
                            : "pass",
                    );
                }
                if (paths.indexOf("deleteMany") > -1) {
                    const authdeleteMany =
                        this.isSecure(authRoutes, "deleteMany")
                            ? AuthMiddleware
                            : passAuth;
                    app.post(`/:${modelName}/deleteMany`, [
                        authdeleteMany,
                        c.deleteMany.bind({
                            config,
                            Database,
                            Controllers,
                            logger: this.logger,
                        }),
                    ]);
                    this.logger.logInfo(
                        `|... /:${modelName}/deleteMany`,
                        this.isSecure(authRoutes, "deleteMany")
                            ? "@secure-route"
                            : "pass",
                    );
                }
                if (paths.indexOf("aggregate") > -1) {
                    const authaggregate = this.isSecure(authRoutes, "aggregate")
                        ? AuthMiddleware
                        : passAuth;
                    app.post(`/:${modelName}/aggregate`, [
                        authaggregate,
                        c.aggregate.bind({
                            config,
                            Database,
                            Controllers,
                            logger: this.logger,
                        }),
                    ]);
                    this.logger.logInfo(
                        `|... /:${modelName}/aggregate`,
                        this.isSecure(authRoutes, "aggregate")
                            ? "@secure-route"
                            : "pass",
                    );
                }
            }
            index += 1;
        }
        app.all("*", function (req, res, next) {
            res.status(404).send({
                statusCode: 404,
                message: "Not Found",
            });
        });
        this.registerResponseMacros();
        this.registerRequestMacros();
        return this;
    }
    start() {
        return new Promise((resolve, reject) => {
            try {
                this.logger.logInfo("server listen", this.currentPort);
                app.listen(this.currentPort);
            } catch (err) {
                throw err;
            }
        });
    }
}
