'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const { models, db } = require('./config')

// app.use(express.json()) // json parser
// app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use(bodyParser.json())

const debug = true

class ModelControls {
    register () {
        for (let m in models) {
            const sch = new Schema(models[m])
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
            .catch(console.error)
    }
    checkConnection () {
        if (mongoose.connection.readyState === 0) this.connect()
        mongoose.connection
            .on('error', (err) => console.error(err))
            .on('disconnected', e => {
                console.log('mongo disconnected!')
                this.connect()
            })
            .on('close', e => {
                console.log('mongo closed!')
                this.connect()
            })
            .on('connected', () => {
                this.register()
                console.log('|. mongodb connected')
            })
    }
}

function model (m) {
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
class Controllers {
    async find (req, res, next) {
        try {
            let {limit, skip, page} = validateQueries(req.query)
            const query = req.body || {}
            const m = model(req.params['model'])
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
            const m = model(req.params['model'])
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
            const m = model(req.params['model'])
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
            const m = model(req.params['model'])
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
            const m = model(req.params['model'])
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
            const m = model(req.params['model'])
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
            const m = model(req.params['model'])
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
            const m = model(req.params['model'])
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
            console.log(`|.. ${req.method}`, req.originalUrl, (debug ? JSON.stringify(req.body || {}) : ''))
            next()
        })
        app.post('/:model/find', c.find)
        app.post('/:model/findOne', c.findOne)
        app.post('/:model/create', c.create)
        app.post('/:model/updateOne', c.updateOne)
        app.post('/:model/updateMany', c.updateMany)
        app.post('/:model/deleteOne', c.deleteOne)
        app.post('/:model/deleteMany', c.deleteMany)
        app.post('/:model/aggregate', c.aggregate)
        return this
    }
    start () {
        return new Promise((resolve, reject) => {
            app.listen(this.currentPort, (err, res) => {
                if (err) reject(err)
                console.log('server listen', this.currentPort)
            })
        })
    }
}

new Server()
    .init()
    .port(3000)
    .theme('default')
    .routes()
    .start()
        .then(console.log)
        .catch(console.error)