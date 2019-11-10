'use strict'

const {join} = require('path')
const superagent = require('superagent')

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

module.exports = { sendRequest }