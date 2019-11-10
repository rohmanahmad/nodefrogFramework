process.env.TESTING = true
process.env.TEST_DOMAIN = 'http://localhost:5005'

// const Server = require('../src/index')

// beforeEach((done) => {
//     new Server()
//         .init()
//         .port(5006)
//         .theme('default')
//         .routes()
//         .start()
//             .then(done)
//             .catch(done)
// })

const scenarioTests = [
    'login'
]

if (scenarioTests.indexOf('login') > -1) require('./modules/login')
