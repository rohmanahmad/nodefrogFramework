const scenarioTests = [
    'login',
    'users'
]

if (scenarioTests.indexOf('login') > -1) require('./modules/login')
if (scenarioTests.indexOf('users') > -1) require('./modules/users')
