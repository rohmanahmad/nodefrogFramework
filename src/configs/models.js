module.exports = {
    Accounts: {
        api: true, // true: publish api, false: disable api
        schema: {
            _id: "<objectId>",
            groupId: "<objectId>",
            accountName: "<string>",
            total: "<number>",
            isIncludeTotal: "<boolean>",
            status: "<number>"
        },
        paths: [
            "find",
            "findOne",
            "create",
            "updateOne",
            // 'updateMany',
            "deleteOne",
            // 'deleteMany',
            "aggregate"
        ],
        requiredFields: {
            find: [],
            findOne: [],
            create: ["groupId", "accountName", "total", "isIncludeTotal"],
            updateOne: ["_id"],
            updateMany: [],
            deleteOne: ["_id"],
            deleteMany: ["username"]
        },
        auth: {
            status: true, // false : disabled
            routes: [
                "find",
                "findOne",
                "create",
                "updateOne",
                "updateMany",
                "deleteOne",
                "deleteMany",
                "aggregate"
            ]
        }
    },
    Categories: {
        api: true,
        schema: {
            _id: "<objectId>",
            categoryName: "<string>",
            categoryType: "<string>",
            status: "<number>"
        },
        paths: [
            "find",
            "findOne",
            "create",
            "updateOne",
            // 'updateMany',
            "deleteOne",
            // 'deleteMany',
            "aggregate"
        ],
        requiredFields: {
            find: [],
            findOne: [],
            create: ["categoryName", "categoryType"],
            updateOne: ["_id"],
            updateMany: [],
            deleteOne: ["_id"],
            deleteMany: ["username"]
        },
        auth: {
            status: true, // false : disabled
            routes: [
                "find",
                "findOne",
                "create",
                "updateOne",
                "updateMany",
                "deleteOne",
                "deleteMany",
                "aggregate"
            ]
        }
    },
    Transaction: {
        api: true,
        schema: {
            _id: "<objectId>",
            fromAccountId: "<objectId>",
            toAccountId: "<objectId>",
            categoryId: "<objectId>",
            transactionType: "<string>", // in, out, transfer
            nominal: "<number>",
            note: "<string>"
        },
        paths: [
            "find",
            "findOne",
            "create",
            "updateOne",
            // 'updateMany',
            "deleteOne",
            // 'deleteMany',
            "aggregate"
        ],
        requiredFields: {
            find: [],
            findOne: [],
            create: [
                "fromAccountId",
                "toAccountId",
                "categoryId",
                "transactionType",
                "nominal"
            ],
            updateOne: ["_id"],
            updateMany: [],
            deleteOne: ["_id"],
            deleteMany: ["username"]
        },
        auth: {
            status: true, // false : disabled
            routes: [
                "find",
                "findOne",
                "create",
                "updateOne",
                "updateMany",
                "deleteOne",
                "deleteMany",
                "aggregate"
            ]
        }
    }
};
