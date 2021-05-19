'use strict'

const debug = require('debug')('platziverse:mqtt')
const mosca = require('mosca')
const redis = require('mosca')
const chalk = require('chalk')
const { db } = require('platziverse-db')
const { parsePayload } = require('./utils')

const backend = {
  type: 'redis',
  redis,
  return_buffers: true
}

const settings = {
  port: 1883,
  backend
}

const config = {
  database: process.env.DB_NAME || 'platziverse',
  username: process.env.DB_USER || 'platzi',
  password: process.env.DB_PASS || 'platzi',
  host: process.env.DB_HOST || 'localhost',
  dialect: 'postgres',
  logging: s => debug(s)
}

const server = new mosca.Server(settings)
const clients = new Map()

let Agent, Metric

server.on('clientConnected', client => {
  debug(`Client connected: ${client.id}`)

  clients.set(client.id, null)
})

server.on('clientDisconnected', async client => {
  debug(`Client disconnected: ${client.id}`)
  const agent = clients.get(client.id)

  if (agent) {
    agent.connected = false

    try {
      await Agent.createOrUpdate(agent)
    } catch (error) {
      return handleError(error)
    }

    clients.delete(client.id)

    server.publish({
      topic: 'agent/disconnecteed',
      payload: JSON.stringify({
        uuid: agent.uuid
      })
    })
    debug(`Client (${client.id}) associated with Agent (${agent.id}) marked as disconnected`)
  }
})

server.on('published', async (packet, client) => {
  debug(`Received: ${packet.topic}`)

  switch (packet.topic) {
    case 'agent/connected':
    case 'agent/disconnected':
      debug(`Payload: ${packet.payload}`)
      break
    case 'agent/message':
      debug(`Payload: ${packet.payload}`)
      const payload = parsePayload(packet.payload)
      if (payload) {
        payload.agent.connected = true
        let agent
        try {
          agent = await Agent.createOrUpdate(payload.agent)
        }catch (error){
          return handleError(error)
        }
        debug(`Agent ${agent.uuid} saved`)

        // Notify if agent connected
        if (!clients.get(client.id)) {
          clients.set(client.id, agent)
          server.publish({
            topic: 'agent/connected',
            payload: JSON.stringify({
              uuid: agent.uuid,
              name: agent.name,
              hostname: agent.hostname,
              pid: agent.pid,
              connected: agent.connected
            })
          })
        }

        // Store Metrics
        for (const metric of payload.metrics) {
          let m

          try {
            m = await Metric.create(agent.uuid, metric)
          } catch (error) {
            return handleError(error)
          }

          debug(`Metric ${m.id} saved on agent ${agent.uuid}`)
        }
      }
      break
  }
})

server.on('ready', async () => {
  const services = await db(config).catch(handleFatalError)

  Agent = services.Agent
  Metric = services.Metric

  console.log(`${chalk.green('[platziverse-mqtt]')} server is running`)
})

function handleFatalError (error) {
  console.error(`${chalk.red('[Error]')} ${error.message}`)
  console.error(error.stack)
  process.exit(1)
}

function handleError (error) {
  console.error(`${chalk.red('[Fatal error]')} ${error.message}`)
  console.error(error.stack)
}

server.on('error', handleFatalError)

server.on('uncaughtException', handleFatalError)
server.on('uncaughtRejection', handleFatalError)
