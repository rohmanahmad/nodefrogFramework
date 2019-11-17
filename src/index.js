'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const crypto = require('crypto')
const mongoose = require('mongoose')

const app = express()
const Schema = mongoose.Schema
const { app: { port, debug, env }, factory, models, db, app: { encryption: { type, key }, session: { exp } }, security: { acl, enabled: authEnabled } } = require('./config')
const documentation = require('./documentation')
app.disable('x-powered-by') // remove default header x-powered-by
app.use(express.json()) // json parser
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use(express.static(__dirname + '/swagger')) // static for documentation/swagger
app.use(bodyParser.json()) // handling json raw

const hashEncode = function (data) {
    try {
        const cipher = crypto.createCipher('des-ede3', (new Date().getTime()).toString())
        let encrypted = cipher.update(data, 'utf8', 'hex')
        encrypted += cipher.final('hex')
        return encrypted.toLocaleLowerCase()
    } catch (err) {
        throw err
    }
}
// set custom header
app.use(function (req, res, next) {
    res.setHeader('x-powered-by', 'NodeFrog Framework')
    req.config = {
        processId: hashEncode(`${new Date().getTime()}`)
    }
    next()
})

// session config
const sessionNumber = parseInt(exp)
let sessionLong = 60 // default menit
if (exp.indexOf('s') > -1) sessionLong = 1
else if (exp.indexOf('m') > -1) sessionLong = 60
else if (exp.indexOf('h') > -1) sessionLong = 60 * 60
else if (exp.indexOf('d') > -1) sessionLong = 60 * 60 * 24

const sessionExp = sessionNumber * sessionLong
// end session

// mongoose debug mode actived when the environment not in production mode
if (['development', 'uat', 'performance-test', 'stress-test'].indexOf(env) > -1) {
    mongoose.set('debug', true)
}

// zona logger
function debuglog (...data) {
    if (['E_ALL', 'E_ERR'].indexOf(debug) > -1) console.log(...data)
}
function errorlog (...data) {
    if (['E_ALL', 'E_ERR'].indexOf(debug) > -1) console.error(...data)
}
// end zona logger
/* 
 * class Hash => untuk kebutuhan encryption termasuk didalamnya 
*/
class Hash {
    des (data) {
        return hashEncode(data)
    }
    encode (data) {
        try {
            const cipher = crypto.createCipher(type, key)
            let encrypted = cipher.update(data, 'utf8', 'hex')
            encrypted += cipher.final('hex')
            return encrypted
        } catch (err) {
            throw err
        }
    }
    decode (encrytpedString = '') {
        try {
            const decipher = crypto.createDecipher(type, key)
            let decrypted = decipher.update(encrytpedString, 'hex', 'utf8')
            decrypted += decipher.final('utf8')
            return decrypted
        } catch (err) {
            throw err
        }
    }
}
/* class Services => untuk membantu logic2 yg lebih komplex */
class Services {
    isValidEmail (email) {
        if (!email) return false
        if (email && email.length < 5) return false
        if (email && email.indexOf('@') < 2) return false
        return true
    }
    async checkExistsUser ({username, email}) {
        try {
            const m = model('users')
            const exists = await m.findOne({
                $or: [
                    {
                        username
                    },
                    {
                        email
                    }
                ]
            })
            if (exists) throw new Error('User or Email Already Exists')
        } catch (err) {
            throw err
        }
    }
    async validateUserRegister ({username, email, firstname, lastname, password}) {
        try {
            // check all input are valid
            if (!username || (username && username.length < 5)) throw new Error('Invalid Username. Min 5 Characters.')
            if (!this.isValidEmail(email)) throw new Error('Invalid Email')
            if (!firstname || (firstname && firstname.length < 1)) throw new Error('Invalid First Name.')
            if (!lastname || (lastname && lastname.length < 1)) throw new Error('Invalid Last Name.')
            if (!password || (password && password.length < 6)) throw new Error('Invalid Password or Password Too Weak.')
            await this.checkExistsUser({email, username})
            const code = `${new Date().getTime() + new Date().getHours() + new Date().getDay()}`.substr(7, 6)
            // debugger
            return {
                email,
                username,
                firstname,
                lastname,
                password: new Hash().encode(password),
                createdAt: new Date(),
                updatedAt: null,
                isVerified: false,
                activeUntil: new Date(new Date().getTime() + (15 * 24 * 60 * 60 * 1000)), // 15hari trial
                verificationCode: `NF-${code}`,
                status: 0
            }
        } catch (err) {
            throw err
        }
    }
}
/* 
 * class ModelControls => untuk kebutuhan controlling models yg sudah di definisikan
*/
class ModelControls {
    /* 
    * getFormatSchema -> digunakan untuk mengambil dan mensetting tipe data dari setiap field dalam sebuah schema model
    */
    getFormatSchema (sc) {
        let schema = {}
        for (let s in sc) {
            let type = String
            if (sc[s] === '<number>') type = Number
            if (sc[s] === '<date>') type = Date
            if (sc[s] === '<objectId>') type = mongoose.Types.ObjectId
            schema[s] = type
        }
        return schema
    }
    /* 
    * register -> untuk meregistrasi semua config model yg sudah di definisikan pada config.js
    *             baik dari user defined maupun factory.
    */
    register () {
        // registrasi model yg sudah anda definisikan
        for (let m in models) {
            const sch = new Schema(this.getFormatSchema(models[m]['schema']))
            mongoose.model(m, sch, m.toLowerCase())
        }
        // registrasi model bawaan/factory sudah definisikan
        for (let m in factory.models) {
            const sch = new Schema(this.getFormatSchema(factory.models[m]['schema']))
            mongoose.model(m, sch, m.toLowerCase())
        }
    }
}
/* 
 * class Database => untuk kebutuhan Database connection dan segala yg berhubungan dengan database
*/
class Database extends ModelControls {
    constructor () {
        super()
        this.checkConnection()
    }
    /* 
     * connect -> digunakan untuk mengkoneksikan api dengan database
     *  - semua config dapat disetting secara manual pada config.js pada bagian db.mongo    
    */
    connect () {
        if (!db.mongo) throw 'Invalid Mongodb URI Config!'
        mongoose
            .connect(db.mongo, { keepAlive: 1, useNewUrlParser: true, useUnifiedTopology: true })
            .catch(errorlog)
    }
    /*
     * checkConnection -> dipanggil pada constructor, sehingga semua query yang akan dilakukan
     *                    akan melakukan pengecekan koneksi ke server database.
     *   - bila koneksi putus/closed maka akan otomatis memanggil fungsi connect()
     * 
    */
    checkConnection () {
        if (mongoose.connection.readyState === 0) this.connect()
        mongoose.connection
            .on('error', (err) => errorlog(err))
            .on('disconnected', e => {
                debuglog('mongo disconnected & reconnecting in 10s...')
                setTimeout(() => {
                    this.connect()
                }, 10 * 1000)
            })
            .on('close', e => {
                debuglog('mongo closed!')
                this.connect()
            })
            .on('connected', () => {
                this.register()
                debuglog('|. mongodb connected')
            })
    }
}
/* 
 * aliases => berfungsi sebagai alias dari model/ bisa dibilang 
*/
const aliases = {
    acl: 'ACL',
    users: 'Users',
    accounts: 'Accounts',
    categories: 'Categories',
    transaction: 'Transaction'
}
/* 
 * model => tujuannya untuk mencari model yg sudah di mapping pada variable alias
*/
function model (m) {
    m = aliases[m]
    const models = mongoose.models
    if (models[m]) return models[m]
    throw 'Model Not Found'
}
/* 
 * validateQueries => digunakan untuk memvalidasi semua query yg masuk dan akan di validasi sesuai dengan yang terdefinisi pada config/documentation
*/
function validateQueries (queries = {}) {
    let valid = {}
    let {limit, page, objectId, upsert} = queries
    if (limit) {
        limit = parseInt(limit || 10)
        if (limit < 0) limit = 10
        valid['limit'] = limit
    }
    if (page) {
        page = parseInt(page || 1)
        if (page > 0) page -= 1
        const skip = (limit * page) - page
        valid['page'] = page + 1
        valid['skip'] = skip
    }
    if (objectId) {
        try {
            valid['objectId'] = mongoose.Types.ObjectId(objectId)
        } catch (err) {
            throw 'Invalid ID (Object)'
        }
    }
    if (upsert) {
        valid['upsert'] = upsert === 'true' || upsert === 'yes'
    }
    return valid
}
/* 
 * authentication => digunakan untuk mengaktifkan fungsi auth dari setiap request yg dituju.
*/
function authentication (req, res, next) {
    try {
        const token = req.header('x-api-key') || req.query['x-token']
        if (!token) throw new Error('The Token Required For This Endpoint')
        next()
    } catch (err) {
        res.status(402).send({
            statusCode: 402,
            message: 'Bad Auth Token!',
            error: err.message
        })
    }
}
function authAccessControll (req, res, next) {
    try {

    } catch (err) {
        res
            .status(403)
            .send({
                statusCode: 403,
                message: 'Not Permitted',
                error: err.message
            })
    }
}
/* 
 * class Controllers => digunakan untuk mengontrol semua fungsi yg dipanggil dari setiap rute yang terdaftar.
*/
class Controllers {
    async login (req, res, next) {
        try {
            const error = 'Invalid Username or Password'
            let { username, password } = req.body
            if (!username || (username && username.length === '')) throw new Error(error)
            const usersModel = model('users')
            let information = null
            if (acl) {
                information = await usersModel.aggregate([
                    {
                        $match: {
                            username,
                            status: 1
                        }
                    }, {
                        $lookup: {
                            from: 'acl',
                            localField: '_id',
                            foreignField: 'userId',
                            as: 'access'
                        }
                    }
                ])
            } else {
                information = await usersModel.findOne({
                    username,
                    status: 1
                })
            }
            if (!information) throw new Error(error)
            if (password !== new Hash().decode(information.password)) throw new Error(error)
            const ttl = new Date().getTime() + sessionExp
            res.send({
                statusCode: 200,
                data: {
                    token: new Hash().des(
                        JSON.stringify({
                            username: information.username,
                            ttl
                        })
                    ).toUpperCase(),
                    expired: ttl,
                    basicInformation: {
                        id: (information._id.toString()).toUpperCase(),
                        fullname: information.fullname
                    }
                }
            })
        } catch (err) {
            errorlog(err)
            res.status(400).send({
                statusCode: 400,
                message: 'bad request',
                error: err.message || err
            })
        }
    }
    async register (req, res, next) {
        try {
            const body = req.body || {}
            const m = model('users')
            const data = await new Services().validateUserRegister(body)
            // console.log(data)
            let item = await m.create(body)
            res.send({ statusCode: 200, config: {data} })
        } catch (err) {
            res.status(400).send({
                statusCode: 400,
                message: 'bad request',
                error: err.message || err
            })
        }
    }
    async find (req, res, next) {
        try {
            const mdl = Object.keys(req.params)[0]
            let {limit, skip, page} = validateQueries(req.query)
            const query = req.body || {}
            const m = model(req.params[mdl])
            let items = await m.find(query).skip(skip).limit(limit)
            if (req.params[mdl] === 'users') {
                items = items.map(x => {
                    x.password = '[hidden]'
                    return x
                })
            }
            res.send({ statusCode: 200, config: {processId: req.config.processId, query: {limit, page, query}}, items })
        } catch (err) {
            res.status(400).send({
                statusCode: 400,
                message: 'bad request',
                error: err.message || err
            })
        }
    }
    async findOne (req, res, next) {
        try {
            let {limit, skip, page} = validateQueries(req.query)
            const query = req.body || {}
            const mdl = Object.keys(req.params)[0]
            const m = model(req.params[mdl])
            const item = await m.findOne(query).skip(skip).limit(limit)
            res.send({ statusCode: 200, config: {limit, page, query}, item })
        } catch (err) {
            res.status(400).send({
                statusCode: 400,
                message: 'bad request',
                error: err.message || err
            })
        }
    }
    async create (req, res, next) {
        try {
            const data = req.body || {}
            const mdl = Object.keys(req.params)[0]
            const m = model(req.params[mdl])
            let item = null
            if (data && data[0]) {
                item = await m.insertMany(data)
            } else {
                item = await m.create(data)
            }
            res.send({ statusCode: 200, config: {data}, item })
        } catch (err) {
            res.status(400).send({
                statusCode: 400,
                message: 'bad request',
                error: err.message || err
            })
        }
    }
    async updateOne (req, res, next) {
        try {
            let { objectId, upsert } = validateQueries(req.query)
            const data = req.body || {}
            const mdl = Object.keys(req.params)[0]
            const m = model(req.params[mdl])
            let item = null
            item = await m.updateOne({_id: objectId}, data, { upsert: upsert || false })
            res.send({ statusCode: 200, config: {data}, item })
        } catch (err) {
            res.status(400).send({
                statusCode: 400,
                message: 'bad request',
                error: err.message || err
            })
        }
    }
    async updateMany (req, res, next) {
        try {
            let { upsert } = validateQueries(req.query)
            const {criteria, update} = req.body || {}
            const mdl = Object.keys(req.params)[0]
            const m = model(req.params[mdl])
            let item = null
            if (!criteria) throw 'Need Criteria Object!'
            if (!update) throw 'Need Update Object!'
            if (typeof criteria !== 'object') throw 'Criteria Must be an Object'
            if (typeof update !== 'object') throw 'Update Must be an Object'
            item = await m.updateOne(criteria, update, { upsert: upsert || false })
            res.send({ statusCode: 200, config: {criteria, update}, item })
        } catch (err) {
            res.status(400).send({
                statusCode: 400,
                message: 'bad request',
                error: err.message || err
            })
        }
    }
    async deleteOne (req, res, next) {
        try {
            let {objectId} = validateQueries(req.query)
            const query = objectId ? {_id: objectId} : req.body
            if (Object.keys(query).length === 0) throw 'Need Body Object or objectId(query)'
            const mdl = Object.keys(req.params)[0]
            const m = model(req.params[mdl])
            const items = await m.deleteOne(query)
            res.send({ statusCode: 200, config: {query}, items })
        } catch (err) {
            res.status(400).send({
                statusCode: 400,
                message: 'bad request',
                error: err.message || err
            })
        }
    }
    async deleteMany (req, res, next) {
        try {
            const query = req.body
            if (Object.keys(query).length === 0) throw 'Need Body Object or objectId(query)'
            const mdl = Object.keys(req.params)[0]
            const m = model(req.params[mdl])
            const items = await m.deleteMany(query)
            res.send({ statusCode: 200, config: {query}, items })
        } catch (err) {
            res.status(400).send({
                statusCode: 400,
                message: 'bad request',
                error: err.message || err
            })
        }
    }
    async aggregate (req, res, next) {
        try {
            const aggregate = req.body
            if (Object.keys(aggregate).length === 0) throw 'Need Aggregate(Body Object Array)'
            if (!aggregate[0]) throw 'Aggregate need Array Object'
            const mdl = Object.keys(req.params)[0]
            const m = model(req.params[mdl])
            const items = await m.aggregate(aggregate)
            res.send({ statusCode: 200, config: {aggregate}, items })
        } catch (err) {
            res.status(400).send({
                statusCode: 400,
                message: 'bad request',
                error: err.message || err
            })
        }
    }
}
/* 
 * passAuth => fungsi yang digunakan untuk bypass semua authentikasi
*/
function passAuth (req, res, next) {
    debuglog('|.. passing authentication')
    next()
}
/* 
 * class Server => berisi semua fungsi untuk kebutuhan server
*/
class Server {
    init () {
        this.currentPort = 3000
        this.currentTheme = 'default'
        this.db = new Database()
        return this
    }
    port (port) {
        this.currentPort = port || 3000
        return this
    }
    theme (theme) {
        this.currentTheme = theme || 'default'
        return this
    }
    isSecure (authRoutes, key) {
        return authEnabled && authRoutes.indexOf(key) > -1
    }
    routes () {
        const c = new Controllers()
        app.use((req, res, next) => {
            debuglog(`|.. ${req.method}`, req.originalUrl, (debug ? JSON.stringify(req.body || {}) : ''))
            next()
        })
        app.get('/', function (req, res) {
            res.send({})
        })
        app.get('/docs', function (req, res) {
            res.send(documentation.view)
        })
        app.get('/swagger.json', function (req, res) {
            res.send(documentation.paths)
        })
        app.post('/authentication/login', c.login)
        app.post('/authentication/register', c.register)
        const allModels = {...factory.models, ...models}
        let index = 1
        for (let m in allModels) {
            if (allModels[m]['api']) {
                debuglog(`|. registering route: (#${index})`, m.toLowerCase())

                const authRoutes = allModels[m]['auth']['routes']
                const paths = allModels[m]['paths']
                let authfind = (this.isSecure(authRoutes, 'find')) ? authentication : passAuth
                let authfindOne = (this.isSecure(authRoutes, 'findOne')) ? authentication : passAuth
                let authcreate = (this.isSecure(authRoutes, 'create')) ? authentication : passAuth
                let authupdateOne = (this.isSecure(authRoutes, 'updateOne')) ? authentication : passAuth
                let authupdateMany = (this.isSecure(authRoutes, 'updateMany')) ? authentication : passAuth
                let authdeleteOne = (this.isSecure(authRoutes, 'deleteOne')) ? authentication : passAuth
                let authdeleteMany = (this.isSecure(authRoutes, 'deleteMany')) ? authentication : passAuth
                let authaggregate = (this.isSecure(authRoutes, 'aggregate')) ? authentication : passAuth

                if (paths.indexOf('find') > -1) {
                    app.post(`/:${ m.toLowerCase() }/find`, [authfind, c.find])
                    debuglog(`|... /:${ m.toLowerCase() }/findOne`, this.isSecure(authRoutes, 'find') ? '@secure-route' : 'pass')
                }
                if (paths.indexOf('findOne') > -1) {
                    app.post(`/:${ m.toLowerCase() }/findOne`, [authfindOne, c.findOne])
                    debuglog(`|... /:${ m.toLowerCase() }/findOne`, this.isSecure(authRoutes, 'findOne') ? '@secure-route' : 'pass')
                }
                if (paths.indexOf('create') > -1) {
                    app.post(`/:${ m.toLowerCase() }/create`, [authcreate, c.create])
                    debuglog(`|... /:${ m.toLowerCase() }/create`, this.isSecure(authRoutes, 'create') ? '@secure-route' : 'pass')
                }
                if (paths.indexOf('updateOne') > -1) {
                    app.post(`/:${ m.toLowerCase() }/updateOne`, [authupdateOne, c.updateOne])
                    debuglog(`|... /:${ m.toLowerCase() }/updateOne`, this.isSecure(authRoutes, 'updateOne') ? '@secure-route' : 'pass')
                }
                if (paths.indexOf('updateMany') > -1) {
                    app.post(`/:${ m.toLowerCase() }/updateMany`, [authupdateMany, c.updateMany])
                    debuglog(`|... /:${ m.toLowerCase() }/updateMany`, this.isSecure(authRoutes, 'updateMany') ? '@secure-route' : 'pass')
                }
                if (paths.indexOf('deleteOne') > -1) {
                    app.post(`/:${ m.toLowerCase() }/deleteOne`, [authdeleteOne, c.deleteOne])
                    debuglog(`|... /:${ m.toLowerCase() }/deleteOne`, this.isSecure(authRoutes, 'deleteOne') ? '@secure-route' : 'pass')
                }
                if (paths.indexOf('deleteMany') > -1) {
                    app.post(`/:${ m.toLowerCase() }/deleteMany`, [authdeleteMany, c.deleteMany])
                    debuglog(`|... /:${ m.toLowerCase() }/deleteMany`, this.isSecure(authRoutes, 'deleteMany') ? '@secure-route' : 'pass')
                }
                if (paths.indexOf('aggregate') > -1) {
                    app.post(`/:${ m.toLowerCase() }/aggregate`, [authaggregate, c.aggregate])
                    debuglog(`|... /:${ m.toLowerCase() }/aggregate`, this.isSecure(authRoutes, 'aggregate') ? '@secure-route' : 'pass')
                }
            }
            index += 1
        }
        app.all('*', function (req, res, next) {
            res.status(404).send({
                statusCode: 404,
                message: 'Not Found'
            })
        })
        return this
    }
    start () {
        return new Promise((resolve, reject) => {
            app.listen(this.currentPort, (err, res) => {
                if (err) reject(err)
                debuglog('server listen', this.currentPort)
            })
        })
    }
}

if (!process.env.TEST) {
    new Server()
        .init()
        .port(parseInt(port || 3000))
        .theme('default')
        .routes()
        .start()
            .then(debuglog)
            .catch(errorlog)
} else {
    module.exports = Server
}
