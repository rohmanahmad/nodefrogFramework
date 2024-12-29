"use strict";

import lodashResult from "lodash.result";
import pkg from "../../package.json";
import documentation from "../configs/documentation";
import factory from "../configs/factory";
import security from "../configs/security";
import models, { ModelSchema } from "../configs/models";

const authEnabled = security.enabled;
let servers: { url: string }[] = [];
const {
    version,
    name: pkgName,
    description,
    license,
    contacts: { email, website },
} = pkg;
type acceptedMethods = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
type P = {
    name: keyof ModelSchema["requiredFields"];
    method: acceptedMethods;
    body: boolean;
};
const p: P[] = [
    { name: "find", method: "POST", body: true },
    { name: "findOne", method: "POST", body: true },
    { name: "create", method: "POST", body: true },
    { name: "updateOne", method: "POST", body: true },
    { name: "updateMany", method: "POST", body: true },
    { name: "deleteOne", method: "POST", body: true },
    { name: "deleteMany", method: "POST", body: true },
    { name: "aggregate", method: "POST", body: true },
];

const serverEnvironment = documentation.servers || "http://localhost:5050";
servers = serverEnvironment.split(",").map((url: string) => ({ url }));

const info = {
    description,
    version,
    title: pkgName,
    contact: {
        email,
        website,
    },
    license: {
        name: license,
        url: "http://www.apache.org/licenses/LICENSE-2.0.html",
    },
};

const schemes = ["http", "https"];

const securityDefinitions = {
    api_key: {
        type: "apiKey",
        name: "x-api-key",
        in: "header",
    },
};

const tags: string[] = [];

type SchemaObject = {
    in: string;
    name?: string;
    required?: boolean;
    description?: string;
    schema?: {
        type: string;
        description?: string;
    };
    example?: string | { [key: string]: string };
};

type RouteSpesifications = {
    [key in acceptedMethods]?: {
        tags?: string[];
        summary: string;
        produces?: string[];
        parameters?: SchemaObject[];
        security?: [];
        responses: typeof response["responses"];
    };
};

const response = {
    // consumes: [
    //     "application/x-www-form-urlencoded"
    // ],
    produces: ["application/json"],
    responses: {
        200: {
            description: "success",
            schema: {
                type: "object",
            },
        },
    },
};

type DocumentationSchema = {
    [key: string]: RouteSpesifications;
};

const paths = function () {
    const m: { [key: string]: ModelSchema } = Object.assign(
        factory.models,
        models,
    );
    const objPath: DocumentationSchema = {
        "/authentication/login": {
            POST: Object.assign({
                tags: ["Auth"],
                summary: "login",
                parameters: [
                    {
                        name: "username",
                        in: "formData",
                        description: "username",
                        required: true,
                    },
                    {
                        name: "password",
                        in: "formData",
                        description: "password",
                        required: true,
                    },
                ],
            }, response),
        },
        "/authentication/register": {
            POST: Object.assign({
                tags: ["Auth"],
                summary: "register",
                parameters: [
                    {
                        name: "email",
                        in: "formData",
                        description: "email",
                        required: true,
                    },
                    {
                        name: "firstname",
                        in: "formData",
                        description: "firstname",
                        required: true,
                    },
                    {
                        name: "lastname",
                        in: "formData",
                        description: "lastname",
                        required: true,
                    },
                    {
                        name: "username",
                        in: "formData",
                        description: "username",
                        required: true,
                    },
                    {
                        name: "password",
                        in: "formData",
                        description: "password",
                        required: true,
                    },
                ],
            }, response),
        },
    };
    let index = 1;
    for (let modelName in m) {
        const { api, paths, requiredFields } = m[modelName];
        if (api) {
            for (let pth of p) {
                const pathName = pth.name;
                if (paths.indexOf(pathName) > -1) {
                    let cPath: RouteSpesifications = {};
                    const method = pth.method;
                    if (["get", "post"].indexOf(method) === -1) {
                        throw "Invalid Method. Only GET or POST.";
                    }
                    let queries = [];
                    const modelObj = m[modelName]["schema"];
                    let requestBody: SchemaObject = {
                        in: "body",
                        description: "Body",
                        required: false,
                    };
                    if (pathName === "updateMany") {
                        queries = [];
                        requestBody["example"] = {
                            criteria: "object",
                            update: "object",
                        };
                        queries.push(requestBody);
                    } else {
                        for (const name in modelObj) {
                            // debugger
                            const required =
                                requiredFields && requiredFields[pathName]
                                    ? requiredFields[pathName]
                                    : [];
                            const o: SchemaObject = {
                                in: "query",
                                name,
                                description: `[String] value of ${name}`,
                                required: (required || []).indexOf(name) > -1,
                            };
                            if (pathName === "create") o["in"] = "formData";
                            // debugger
                            if (modelObj[name] === "<string>") {
                                o["schema"] = {
                                    type: "string",
                                };
                            } else if (modelObj[name] === "<number>") {
                                o["schema"] = {
                                    type: "number",
                                };
                            } else if (modelObj[name] === "<boolean>") {
                                o["schema"] = {
                                    type: "boolean",
                                };
                            } else {
                                o["schema"] = {
                                    type: "string",
                                    description: `[${
                                        modelObj[name]
                                    }] accepted.`,
                                };
                            }
                            const isNotCreate = pathName !== "create";
                            const isNotId =
                                ["_id", "createdAt", "updatedAt"].indexOf(
                                    name,
                                ) < 0;
                            // console.log(pathName, name, isNotCreate, isNotId)
                            if (isNotCreate && isNotId) queries.push(o);
                            // debugger
                        }
                    }
                    // debugger
                    let security = {};
                    const modelStatus = lodashResult(
                        m[modelName],
                        "auth.status",
                        false,
                    );
                    const modelRoutes: string[] = lodashResult(
                        m[modelName],
                        "auth.routes",
                        [],
                    );
                    if (authEnabled && modelStatus) {
                        if (
                            modelRoutes.indexOf(pathName) >
                                -1
                        ) {
                            security = { security: [{ api_key: [] }] };
                        }
                    }
                    cPath[method] = Object.assign(
                        {
                            tags: [`#${index} ${modelName}`],
                            summary: modelName,
                            parameters: queries,
                        },
                        security,
                        response,
                    );
                    // debugger
                    objPath[`/${modelName.toLowerCase()}/${pathName}`] = cPath;
                }
            }
        }
        index += 1;
    }
    return {
        swagger: "2.0",
        info,
        servers,
        tags,
        paths: objPath,
        schemes,
        securityDefinitions,
    };
};
const view =
    `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Documentation</title><link rel="stylesheet" type="text/css" href="./swagger-ui.css" ><link rel="icon" type="image/png" href="./favicon-32x32.png" sizes="32x32" /><link rel="icon" type="image/png" href="./favicon-16x16.png" sizes="16x16" /><style>html{box-sizing: border-box;overflow: -moz-scrollbars-vertical;overflow-y: scroll;}*,*:before,*:after{box-sizing: inherit;}body{margin:0;background: #fafafa;}</style></head><body><div id="swagger-ui"></div><script src="./swagger-ui-bundle.js"> </script><script src="./swagger-ui-standalone-preset.js"> </script><script>window.onload = function() { const ui = SwaggerUIBundle({ url: "swagger.json", dom_id: '#swagger-ui', deepLinking: true, presets: [ SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset ], plugins: [ SwaggerUIBundle.plugins.DownloadUrl ], layout: "StandaloneLayout" }); window.ui = ui; }</script></body></html>`;

export default {
    paths: paths(),
    view,
};