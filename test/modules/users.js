const assert = require('assert')
const { sendRequest, login, paths, credential } = require('../functions')

describe('Users Scenario', async () => {
    const token = await login(credential)
    describe('- Sukses', async () => {
        it('should get success response', async () => {
            try {
                const endpoint = '/users/findOne'
                const { body: { statusCode, data }, header } = await sendRequest({
                    type: 'post',
                    endpoint,
                    headers: { accept: 'application/json', 'x-api-keys': token },
                    form: {}
                })
                assert(statusCode, 200)
            } catch (err) {
                throw err
            }
        })
    })
})
