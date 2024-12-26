module.exports = {
    models: {
        Users: {
            api: true,
            schema: {
                // _id: '<objectId>',
                email: "<string>",
                username: "<string>",
                password: "<string>",
                firstname: "<string>",
                lastname: "<string>",
                activeUntil: "<date>",
                verificationCode: "<string>",
                createdAt: "<date>",
                updatedAt: "<date>",
                isVerified: "<boolean>",
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
                create: ["username", "email", "password", "fullname"],
                updateOne: ["_id"],
                updateMany: [],
                deleteOne: ["_id"],
                deleteMany: []
            },
            auth: {
                status: true,
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
        ACL: {
            api: true,
            schema: {
                _id: "<objectId>",
                userId: "<objectId>",
                accessType: "<string>",
                accessObject: "<string>",
                description: "<string>",
                status: "<number>"
            },
            requiredFields: {
                find: [],
                findOne: [],
                create: [
                    "username",
                    "accessType",
                    "accessObject",
                    "description"
                ],
                updateOne: ["_id"],
                updateMany: [],
                deleteOne: ["_id"],
                deleteMany: ["username"]
            },
            paths: [
                "find",
                "findOne",
                "create",
                "updateOne",
                "updateMany",
                "deleteOne",
                "deleteMany",
                "aggregate"
            ],
            auth: {
                status: true,
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
    }
};
