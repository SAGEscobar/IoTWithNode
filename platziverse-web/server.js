'use strict'

const debug = require('debug')('platziverse:web')
const chalk = require('chalk')
const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const PlatziverseAgent = require('platziverse-agent')
const proxy = require('./proxy')
const { pipe } = require('./utils')
const syncify = require('express-asyncify')

const port = process.env.PORT || 8080
const app = syncify(express())
const server = http.createServer(app)
const io = socketio(server)
const agent = new PlatziverseAgent()

app.use(express.static(path.join(__dirname, 'public')))
app.use('/', proxy)

// Express Error handler
app.use((err, req, res, next) => {
  debug(`Error: ${err.message}`)

  if (err.message.match(/not found/)) {
    return res.status(404).send({error: err.message})
  }

  res.status(500).send({error: err.message})
})

io.on('connect', socket => {
  debug(`Connected ${socket.id}`)

  pipe(agent, socket)
})

function handleFatalError (error) {
  console.error(`${chalk.red('[Fatal error]')} ${error.message}`)
  console.error(error.stack)
  process.exit(1)
}

process.on('uncaughtException', handleFatalError)
process.on('unhandledRejection', handleFatalError)

server.listen(port, () => {
  console.log(`${chalk.green(['platziverse-web'])} server listening on port ${port}`)
  agent.connect()
})
