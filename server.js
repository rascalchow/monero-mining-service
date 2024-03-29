global.APP_ROOT = __dirname
require('dotenv-safe').config()
const express = require('express')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const compression = require('compression')
const helmet = require('helmet')
const multipart = require('connect-multiparty')
const cors = require('cors')
const cron = require('node-cron')
const passport = require('passport')
const app = express()
// const i18n = require('i18n')
const initMongo = require('./config/mongo')
const { initMonero } = require('./config/monero')
const path = require('path')
const { seedAdminUser } = require('./app/controllers/auth')
const { seedAppConfig } = require('./app/controllers/settings')
// cron job
const utils = require('./app/middleware/utils')
const moment = require('moment')
const mongoose = require('mongoose')
const AppUserSession = require('./app/models/appUserSession')
// Setup express server port from ENV, default: 3000
app.set('port', process.env.PORT || 3000)

// Enable only in development HTTP request logger middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// Redis cache enabled by env variable
if (process.env.USE_REDIS === 'true') {
  const getExpeditiousCache = require('express-expeditious')
  const cache = getExpeditiousCache({
    namespace: 'expresscache',
    defaultTtl: '1 minute',
    engine: require('expeditious-engine-redis')({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT
    })
  })
  app.use(cache)
}

cron.schedule('*/15 * * * *', async () => {
  console.log('updating session every 15 mins')
  // find all sessions lastSeen is older than 10 mins
  // and update duration
  const lastTime = moment()
    .subtract(15, 'minutes')
    .toISOString()
  const terminatedSessions = await AppUserSession.find({
    lastSeen: { $lt: lastTime },
    endAt: null
  })
  terminatedSessions.forEach(async session => {
    utils.onSessionEnded(session)
  })
})

// for parsing json
app.use(
  bodyParser.json({
    limit: '20mb'
  })
)
// for parsing application/x-www-form-urlencoded
app.use(
  bodyParser.urlencoded({
    limit: '20mb',
    extended: true
  })
)

// i18n
// i18n.configure({
//   locales: ['en', 'es'],
//   directory: `${__dirname}/locales`,
//   defaultLocale: 'en',
//   objectNotation: true
// })
// app.use(i18n.init)

// Init all other stuff
app.use(cors())
app.use(passport.initialize())
app.use(compression())
app.use(helmet())
app.use(express.static('uploads'))
app.set('views', path.join(__dirname, 'views'))
app.engine('html', require('ejs').renderFile)
app.set('view engine', 'html')
app.use(multipart({}))

app.use(require('./app/routes'))

const server = require('http').createServer(app)
server.listen(app.get('port'))

// Init MongoDB
initMongo(() => {
  // Setup)
  seedAdminUser()
  seedAppConfig()
})

initMonero()

module.exports = app // for testing
