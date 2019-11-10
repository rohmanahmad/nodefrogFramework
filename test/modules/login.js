const assert = require('assert')
const { sendRequest } = require('../functions')

const usernameTest = 'ab1'
const passwordTest = 'mantavjiwa'

describe('Login Scenario', function () {
    describe('- Sukses', function () {
        it('harusnya return sukses dengan response token dengan nilai tertentu', async () => {
            try {
                const { body: { statusCode, data: { token } }, header } = await sendRequest({
                    type: 'post',
                    endpoint: '/authentication/login',
                    headers: { accept: 'application/json' },
                    form: { username: usernameTest, password: passwordTest }
                })
                assert(statusCode, 200)
                assert((token || token !== ''), true)
            } catch (err) {
                throw err
            }
        })
    })
})
