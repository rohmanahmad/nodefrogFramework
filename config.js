module.exports = {
    app: {
        session: {
            exp: '1h'
        },
        encryption: {
            type: 'aes-256-cbc',
            key: 'helloworld',
        },
        port: 5050
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
                    email: '<string>',
                    username: '<string>',
                    password: '<string>',
                    fullname: '<string>',
                    status: '<number>'
                },
                paths: [
                    // 'find',
                    'findOne',
                    // 'create',
                    'updateOne',
                    // 'updateMany',
                    'deleteOne',
                    // 'deleteMany',
                    // 'aggregate'
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
                accountId: '<objectId>',
                groupId: '<objectId>',
                accountName: '<string>',
                total: '<number>',
                isIncludeTotal: '<boolean>',
                status: '<number>'
            },
            paths: [
                // 'find',
                // 'findOne',
                // 'create',
                // 'updateOne',
                // 'updateMany',
                // 'deleteOne',
                // 'deleteMany',
                'aggregate'
            ], 
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
                categoryId: '<objectId>',
                categoryName: '<string>',
                categoryType: '<string>',
                status: '<number>'
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
                'updateMany',
                'deleteOne',
                'deleteMany',
                'aggregate'
            ], 
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
    }
}