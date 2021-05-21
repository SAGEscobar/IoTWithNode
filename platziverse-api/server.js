'use strict'

const http = require('http')
const express = require('express')
const chalk = require('chalk')
const debug = require('debug')('platziverse:api')
const api = require('./api')
const acyncify = require('express-asyncify')

const port = process.env.PORT || 3000
const app = acyncify(express())
const server = http.createServer(app)

app.use('/api', api)

if (!module.main) {
  function handleFatalError (error) {
    console.error(`${chalk.red('[fatal error]')} ${error.message}`)
    console.error(error.stack)
    process.exit(1)
  }

  process.on('uncaughtException', handleFatalError)
  process.on('unhandledRejection', handleFatalError)

  server.listen(port, () => {
    console.log(`${chalk.green('[platziverse-api]')} server is listening on port ${port}`)
  })
}

module.exports = server
