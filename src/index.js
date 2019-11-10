'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const crypto = require('crypto')
const app = express()
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const { app: { port, debug }, factory, models, db, app: { encryption: { type, key }, session: { exp } } } = require('./config')
const documentation = require('./documentation')
app.disable('x-powered-by') // remove default header x-powered-by
app.use(express.json()) // json parser
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use(express.static(__dirname + '/swagger'))
app.use(bodyParser.json())

// set custom header
app.use(function (req, res, next) {
    res.setHeader('x-powered-by', 'NodeFrog Framework')
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

function debuglog (...data) {
    if (['E_ALL', 'E_ERR'].indexOf(debug) > -1) console.log(...data)
}
function errorlog (...data) {
    if (['E_ALL', 'E_ERR'].indexOf(debug) > -1) console.error(...data)
}
class Hash {
    des (data) {
        try {
            const cipher = crypto.createCipher('des-ede3', key)
            let encrypted = cipher.update(data, 'utf8', 'hex')
            encrypted += cipher.final('hex')
            return encrypted
        } catch (err) {
            throw err
        }
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

class ModelControls {
    getFormatSchema (sc) {
        let schema = {}
        for (let s in sc) {
            let type = String
            if (sc[s] === '<number>') type = Number
            if (sc[s] === '<objectId>') type = mongoose.Types.ObjectId
            schema[s] = type
        }
        return schema
    }
    register () {
        for (let m in models) {
            const sch = new Schema(this.getFormatSchema(models[m]['schema']))
            mongoose.model(m, sch, m.toLowerCase())
        }
        for (let m in factory.models) {
            const sch = new Schema(this.getFormatSchema(factory.models[m]['schema']))
            mongoose.model(m, sch, m.toLowerCase())
        }
    }
}

class Database extends ModelControls {
    constructor () {
        super()
        this.checkConnection()
    }
    connect () {
        if (!db.mongo) throw 'Invalid Mongodb URI Config!'
        mongoose
            .connect(db.mongo, { keepAlive: 1, useNewUrlParser: true, useUnifiedTopology: true })
            .catch(errorlog)
    }
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

const modelMapping = {
    users: 'Users',
    accounts: 'Accounts',
    categories: 'Categories',
    transaction: 'Transaction'
}
function model (m) {
    m = modelMapping[m]
    const models = mongoose.models
    if (models[m]) return models[m]
    throw 'Model Not Found'
}

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

function authentication (req, res, next) {
    try {
        debuglog(req.header('api_key'))
        next()
    } catch (err) {
        res.status(402).send({
            statusCode: 402,
            message: 'Bad Auth Token!',
            error: err.message
        })
    }
}

class Controllers {
    async login (req, res, next) {
        try {
            const error = 'Invalid Username or Password'
            let { username, password } = req.body
            if (!username || (username && username.length === '')) throw new Error(error)
            const m = model('users')
            let information = await m.findOne({
                username,
                status: 1
            })
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
    async find (req, res, next) {
        try {
            const mdl = Object.keys(req.params)[0]
            let {limit, skip, page} = validateQueries(req.query)
            const query = req.body || {}
            const m = model(req.params[mdl])
            const items = await m.find(query).skip(skip).limit(limit)
            res.send({ statusCode: 200, config: {limit, page, query}, items })
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

function passAuth (req, res, next) {
    debuglog('|.. passing authentication')
    next()
}

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
        const allModels = {...factory.models, ...models}
        let index = 1
        for (let m in allModels) {
            if (allModels[m]['api']) {
                debuglog(`|. registering route: (#${index})`, m.toLowerCase())

                const authRoutes = allModels[m]['auth']['routes']
                const paths = allModels[m]['paths']
                let authfind = (authRoutes.indexOf('find') > -1) ? authentication : passAuth
                let authfindOne = (authRoutes.indexOf('findOne') > -1) ? authentication : passAuth
                let authcreate = (authRoutes.indexOf('create') > -1) ? authentication : passAuth
                let authupdateOne = (authRoutes.indexOf('updateOne') > -1) ? authentication : passAuth
                let authupdateMany = (authRoutes.indexOf('updateMany') > -1) ? authentication : passAuth
                let authdeleteOne = (authRoutes.indexOf('deleteOne') > -1) ? authentication : passAuth
                let authdeleteMany = (authRoutes.indexOf('deleteMany') > -1) ? authentication : passAuth
                let authaggregate = (authRoutes.indexOf('aggregate') > -1) ? authentication : passAuth

                if (paths.indexOf('find') > -1) {
                    debuglog(`|... /:${ m.toLowerCase() }/findOne`)
                    app.post(`/:${ m.toLowerCase() }/find`, [authfind, c.find])
                }
                if (paths.indexOf('findOne') > -1) {
                    app.post(`/:${ m.toLowerCase() }/findOne`, [authfindOne, c.findOne])
                    debuglog(`|... /:${ m.toLowerCase() }/findOne`)
                }
                if (paths.indexOf('create') > -1) {
                    app.post(`/:${ m.toLowerCase() }/create`, [authcreate, c.create])
                    debuglog(`|... /:${ m.toLowerCase() }/create`)
                }
                if (paths.indexOf('updateOne') > -1) {
                    app.post(`/:${ m.toLowerCase() }/updateOne`, [authupdateOne, c.updateOne])
                    debuglog(`|... /:${ m.toLowerCase() }/updateOne`)
                }
                if (paths.indexOf('updateMany') > -1) {
                    app.post(`/:${ m.toLowerCase() }/updateMany`, [authupdateMany, c.updateMany])
                    debuglog(`|... /:${ m.toLowerCase() }/updateMany`)
                }
                if (paths.indexOf('deleteOne') > -1) {
                    app.post(`/:${ m.toLowerCase() }/deleteOne`, [authdeleteOne, c.deleteOne])
                    debuglog(`|... /:${ m.toLowerCase() }/deleteOne`)
                }
                if (paths.indexOf('deleteMany') > -1) {
                    app.post(`/:${ m.toLowerCase() }/deleteMany`, [authdeleteMany, c.deleteMany])
                    debuglog(`|... /:${ m.toLowerCase() }/deleteMany`)
                }
                if (paths.indexOf('aggregate') > -1) {
                    app.post(`/:${ m.toLowerCase() }/aggregate`, [authaggregate, c.aggregate])
                    debuglog(`|... /:${ m.toLowerCase() }/aggregate`)
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

if (!process.env.TESTING) {
    new Server()
        .init()
        .port(parseInt(port || 3000))
        .theme('default')
        .routes()
        .start()
            .then(debuglog)
            .catch(errorlog)
}
module.exports = Server

