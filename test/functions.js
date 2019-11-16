'use strict'

require('dotenv').config({path: __dirname + '/.env'})
// const {join} = require('path')
// const {requlre} = require('lodash')
const superagent = require('superagent')

const {
    factory: {
        models: {
            Users: {
                schema: modelUsers,
                paths: userPaths
            }
        }
    },
    models
} = require('../src/config')

const credential = {
    username: process.env.TEST_USERNAME,
    password: process.env.TEST_PASSWORD
}

const schemas = {
    Users: modelUsers,
    // user defined models
    Accounts: models['Accounts'].schema,
    Categories: models['Categories'].schema,
    Transaction: models['Transaction'].schema,
    // end user defined models
}

const paths = {
    Users: userPaths,
    // user defined models
    Accounts: models['Accounts'].paths,
    Categories: models['Categories'].paths,
    Transaction: models['Transaction'].paths,
    // end user defined models
}

const sendRequest = async ({type, endpoint, form, query, headers}) => {
    try {
        if (!type || type == '' || !endpoint || endpoint == '') throw 'Invalid type or endpoint.'
        const url = process.env.TEST_DOMAIN + endpoint
        let client = superagent.get(url)
        if (type == 'post') client = superagent.post(url)
        if (query && typeof query == 'object') client = client.query(query)
        if (form && typeof form == 'object') client = client.send(form)
        if (headers && typeof headers == 'object') {
            for (let x in headers) {
                if (x) client = client.set(x, headers[x])
            }
        }
        // client
        //     .then(function (body) {
        //         console.log(body)
        //     })
        const res = await client
        return res
    } catch (err) {
        throw err
    }
}

const login = async function ({username, password}) {
    const { body: { statusCode, data: { token } }, header } = await sendRequest({
        type: 'post',
        endpoint: '/authentication/login',
        headers: { accept: 'application/json' },
        form: { username, password }
    })
    return token
}

module.exports = { sendRequest, login, schemas, paths, credential }
