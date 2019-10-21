module.exports = {
    db: {
        mongo: 'mongodb://localhost:27017/blogs'
    },
    models: {
        Users: {
            username: String,
            password: String,
            fullname: String,
            status: Number
        },
        Users2: {
            username: String,
            password: String,
            fullname: String,
            status: Number
        }
    }
}