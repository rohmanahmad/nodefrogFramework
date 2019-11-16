'use strict'

if (!process.env.TEST) require('dotenv').config({path: __dirname + '/.env'})
function getEnv (key, defaultValue = '') {
    return process.env[key] || defaultValue
}

module.exports = {
    app: {
        debug: getEnv('APP_DEBUG_LEVEL'),
        session: {
            exp: '1h'
        },
        encryption: {
            type: 'aes-256-cbc',
            key: 'helloworld',
        },
        baseUrl: getEnv('APP_BASE_URL'),
        port: getEnv('APP_PORT'),
        env: getEnv('APP_ENV', 'production')
    },
    security: {
        auth: 'jwt'
    },
    db: {
        mongo: 'mongodb://localhost:27017/blogs'
    },
    // do not edit this object
    factory: {
        models: {
            Users: {
                api: true,
                schema: {
                    _id: '<objectId>',
                    email: '<string>',
                    username: '<string>',
                    password: '<string>',
                    fullname: '<string>',
                    status: '<number>'
                },
                paths: [
                    'find',
                    'findOne',
                    'create',
                    'updateOne',
                    // 'updateMany',
                    'deleteOne',
                    // 'deleteMany',
                    'aggregate'
                ], 
                requiredFields: {
                    'find': [],
                    'findOne': [],
                    'create': ['username', 'email', 'password', 'fullname'],
                    'updateOne': ['_id'],
                    'updateMany': [],
                    'deleteOne': ['_id'],
                    'deleteMany': []
                },
                auth: {
                    status: true,
                    routes: [
                        'find',
                        'findOne',
                        'create',
                        'updateOne',
                        'updateMany',
                        'deleteOne',
                        'deleteMany',
                        'aggregate'
                    ]
                }
            },
            ACL: {
                api: true,
                schema: {
                    _id: '<objectId>',
                    username: '<string>',
                    accessType: '<string>',
                    accessObject: '<string>',
                    description: '<string>',
                    status: '<number>'
                },
                requiredFields: {
                    'find': [],
                    'findOne': [],
                    'create': ['username', 'accessType', 'accessObject', 'description'],
                    'updateOne': ['_id'],
                    'updateMany': [],
                    'deleteOne': ['_id'],
                    'deleteMany': ['username']
                },
                paths: [
                    'find',
                    'findOne',
                    'create',
                    'updateOne',
                    'updateMany',
                    'deleteOne',
                    'deleteMany',
                    'aggregate'
                ], 
                auth: {
                    status: true,
                    routes: [
                        'find',
                        'findOne',
                        'create',
                        'updateOne',
                        'updateMany',
                        'deleteOne',
                        'deleteMany',
                        'aggregate'
                    ]
                }
            },
        }
    },
    models: {
        Accounts: {
            api: true, // true: publish api, false: disable api
            schema: {
                _id: '<objectId>',
                groupId: '<objectId>',
                accountName: '<string>',
                total: '<number>',
                isIncludeTotal: '<boolean>',
                status: '<number>'
            },
            paths: [
                'find',
                'findOne',
                'create',
                'updateOne',
                // 'updateMany',
                'deleteOne',
                // 'deleteMany',
                'aggregate'
            ],
            requiredFields: {
                'find': [],
                'findOne': [],
                'create': ['groupId', 'accountName', 'total', 'isIncludeTotal'],
                'updateOne': ['_id'],
                'updateMany': [],
                'deleteOne': ['_id'],
                'deleteMany': ['username']
            },
            auth: {
                status: true, // false : disabled
                routes: [
                    'find',
                    'findOne',
                    'create',
                    'updateOne',
                    'updateMany',
                    'deleteOne',
                    'deleteMany',
                    'aggregate'
                ]
            }
        },
        Categories: {
            api: true,
            schema: {
                _id: '<objectId>',
                categoryName: '<string>',
                categoryType: '<string>',
                status: '<number>'
            },
            paths: [
                'find',
                'findOne',
                'create',
                'updateOne',
                // 'updateMany',
                'deleteOne',
                // 'deleteMany',
                'aggregate'
            ],
            requiredFields: {
                'find': [],
                'findOne': [],
                'create': ['categoryName', 'categoryType'],
                'updateOne': ['_id'],
                'updateMany': [],
                'deleteOne': ['_id'],
                'deleteMany': ['username']
            },
            auth: {
                status: true, // false : disabled
                routes: [
                    'find',
                    'findOne',
                    'create',
                    'updateOne',
                    'updateMany',
                    'deleteOne',
                    'deleteMany',
                    'aggregate'
                ]
            }
        },
        Transaction: {
            api: true,
            schema: {
                _id: '<objectId>',
                fromAccountId: '<objectId>',
                toAccountId: '<objectId>',
                categoryId: '<objectId>',
                transactionType: '<string>', // in, out, transfer
                nominal: '<number>',
                note: '<string>'
            },
            paths: [
                'find',
                'findOne',
                'create',
                'updateOne',
                // 'updateMany',
                'deleteOne',
                // 'deleteMany',
                'aggregate'
            ],
            requiredFields: {
                'find': [],
                'findOne': [],
                'create': ['fromAccountId', 'toAccountId', 'categoryId', 'transactionType', 'nominal'],
                'updateOne': ['_id'],
                'updateMany': [],
                'deleteOne': ['_id'],
                'deleteMany': ['username']
            },
            auth: {
                status: true, // false : disabled
                routes: [
                    'find',
                    'findOne',
                    'create',
                    'updateOne',
                    'updateMany',
                    'deleteOne',
                    'deleteMany',
                    'aggregate'
                ]
            }
        }
    },
    documentation: {
        servers: getEnv('DOCS_SERVERS')
    }
}