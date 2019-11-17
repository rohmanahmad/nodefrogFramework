'use strict'

const { factory, models, documentation, security: {enabled: authEnabled} } = require('./config')
let { servers } = documentation
const { version, name, description, license, contacts: {email, website} } = require('../package.json')
const p = [
    { name: 'find', method: 'POST', body: true },
    { name: 'findOne', method: 'POST', body: true },
    { name: 'create', method: 'POST', body: true },
    { name: 'updateOne', method: 'POST', body: true },
    { name: 'updateMany', method: 'POST', body: true },
    { name: 'deleteOne', method: 'POST', body: true },
    { name: 'deleteMany', method: 'POST', body: true },
    { name: 'aggregate', method: 'POST', body: true } 
]

if (!servers) servers = 'http://localhost:5050'
servers = servers.split(',').map(url => ({ url }))

const info = {
    description,
    version,
    title: name,
    contact: {
        email,
        website
    },
    license: {
        name: license,
        url: 'http://www.apache.org/licenses/LICENSE-2.0.html'
    }
}

const schemes = [
    'http',
    'https'
]

const securityDefinitions = {
    api_key: {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header'
    }
}

const tags = [
]

const response = {
    // consumes: [
    //     "application/x-www-form-urlencoded"
    // ],
    produces: [ "application/json" ],
    responses:{
        200: {
            description: 'success',
            schema: {
                type: 'object'
            }
        }
    }
}

const paths = function () {
    const m = {...factory.models, ...models}
    const objPath = {
        '/authentication/login': {
            'post': {
                tags: ['Auth'],
                summary: 'login',
                parameters: [
                    {
                        name: 'username',
                        in: 'formData',
                        description: 'username',
                        required: true
                    },
                    {
                        name: 'password',
                        in: 'formData',
                        description: 'password',
                        required: true
                    }
                ],
                ...response
            }
        },
        '/authentication/register': {
            'post': {
                tags: ['Auth'],
                summary: 'register',
                parameters: [
                    {
                        name: 'email',
                        in: 'formData',
                        description: 'email',
                        required: true
                    },
                    {
                        name: 'firsname',
                        in: 'formData',
                        description: 'firsname',
                        required: true
                    },
                    {
                        name: 'lastname',
                        in: 'formData',
                        description: 'lastname',
                        required: true
                    },
                    {
                        name: 'username',
                        in: 'formData',
                        description: 'username',
                        required: true
                    },
                    {
                        name: 'password',
                        in: 'formData',
                        description: 'password',
                        required: true
                    }
                ],
                ...response
            }
        }
    }
    let index = 1
    for (let modelName in m) {
        const {api, paths, requiredFields} = m[modelName]
        if (api) {
            for (let pth of p) {
                if (paths.indexOf(pth.name) > -1) {
                    const cPath = {}
                    const method = pth.method.toLocaleLowerCase()
                    if (['get', 'post'].indexOf(method) === -1) {
                        throw 'Invalid Method. Only GET or POST.'
                    }
                    let queries = []
                    const modelObj = m[modelName]['schema']
                    let requestBody = {
                        in: 'body',
                        description: 'Body',
                        required: false
                    }
                    if (pth.name === 'updateMany') {
                        queries = []
                        requestBody['example'] = {
                            criteria: 'object',
                            update: 'object'
                        }
                        queries.push(requestBody)
                    } else {
                        for (const name in modelObj) {
                            // debugger
                            const required = requiredFields && requiredFields[pth.name] ? requiredFields[pth.name] : []
                            const o = {
                                in: 'query',
                                name,
                                description: `[String] value of ${name}`,
                                required: required.indexOf(name) > -1
                            }
                            if (pth.name === 'create') o['in'] = 'formData'
                            // debugger
                            if (modelObj[name] === '<string>') {
                                o['schema'] = {
                                    type: 'string'
                                }
                            } else if (modelObj[name] === '<number>') {
                                o['schema'] = {
                                    type: 'number'
                                }
                            } else if (modelObj[name] === '<boolean>') {
                                o['schema'] = {
                                    type: 'boolean'
                                }
                            } else {
                                o['schema'] = {
                                    type: 'string',
                                    description: `[${modelObj[name]}] accepted.`
                                }
                            }
                            const isNotCreate = (pth.name !== 'create')
                            const isNotId = (['_id', 'createdAt', 'updatedAt'].indexOf(name) < 0)
                            // console.log(pth.name, name, isNotCreate, isNotId)
                            if (isNotCreate && isNotId) queries.push(o)
                            // debugger
                        }
                    }
                    // debugger
                    let security = {}
                    if (authEnabled && m[modelName]['auth']['status']) {
                        if ((m[modelName]['auth']['routes']).indexOf(pth.name) > -1) security = { security: [{ 'api_key': [] }] }
                    }
                    cPath[method] = {
                        tags: [`#${index} ${modelName}`],
                        summary: modelName,
                        parameters: queries,
                        ...security,
                        ...response
                    }
                    // debugger
                    objPath[`/${modelName.toLowerCase()}/${pth.name}`] = cPath
                }
            }
        }
        index += 1
    }
    return {
        swagger: '2.0',
        info,
        servers,
        tags,
        paths: objPath,
        schemes,
        securityDefinitions
    }
}
const view = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Documentation</title><link rel="stylesheet" type="text/css" href="./swagger-ui.css" ><link rel="icon" type="image/png" href="./favicon-32x32.png" sizes="32x32" /><link rel="icon" type="image/png" href="./favicon-16x16.png" sizes="16x16" /><style>html{box-sizing: border-box;overflow: -moz-scrollbars-vertical;overflow-y: scroll;}*,*:before,*:after{box-sizing: inherit;}body{margin:0;background: #fafafa;}</style></head><body><div id="swagger-ui"></div><script src="./swagger-ui-bundle.js"> </script><script src="./swagger-ui-standalone-preset.js"> </script><script>window.onload = function() { const ui = SwaggerUIBundle({ url: "swagger.json", dom_id: '#swagger-ui', deepLinking: true, presets: [ SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset ], plugins: [ SwaggerUIBundle.plugins.DownloadUrl ], layout: "StandaloneLayout" }); window.ui = ui; }</script></body></html>`

module.exports = {
    paths: paths(),
    view
}
