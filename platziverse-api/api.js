'use strict'

const debug = require('debug')('platziverse:api:routes')
const express = require('express')
const { db } = require('platziverse-db')
const config = require('./config')
const acyncify = require('express-asyncify')
const auth = require('express-jwt')
// const guard = require('express-jwt-permissions')()

const api = acyncify(express.Router())

let services, Agent, Metric

api.use('*', async (req, res, next) => {
  if (!services) {
    debug('Connecting to database')
    try {
      services = await db(config.db)
    } catch (err) {
      return next(err)
    }
    Agent = services.Agent
    Metric = services.Metric
  }
  next()
})

api.get('/agents', auth(config.auth), async (req, res, next) => {
  debug('Request to /agents')

  const { user } = req

  if (!user || !user.username) {
    return next(new Error('Not authorized'))
  }

  let agents = []
  try {
    if (user.admin) {
      agents = await Agent.findConnected()
    } else {
      agents = await Agent.findByUsername(user.username)
      console.log(user.username)
    }
  } catch (error) {
    next(error)
  }
  res.send(agents)
})

api.get('/agent/:uuid', async (req, res, next) => {
  const { uuid } = req.params

  debug(`Request to /api/agent/${uuid}`)

  let agent
  try {
    agent = await Agent.findByUuid(uuid)
  } catch (error) {
    next(error)
  }

  if (!agent) {
    next(new Error(`Agent with uuid ${uuid} not found`))
  }

  res.send(agent)
})

// guard(['metrics:read']) ,

api.get('/metrics/:uuid', auth(config.auth), async (req, res, next) => {
  const { uuid } = req.params
  let metrics

  debug(`Request to /api/metrics/${uuid}`)

  try {
    metrics = await Metric.findByAgentUuid(uuid)
  } catch (error) {
    next(error)
  }

  if (!metrics || metrics.length === 0) {
    next(new Error(`Metrics not found to agent with uuid ${uuid}`))
  }

  res.send(metrics)
})

api.get('/metrics/:uuid/:type', async (req, res, next) => {
  const { uuid, type } = req.params
  let metrics

  debug(`Request to /api/metrics/${uuid}/${type}`)

  try {
    metrics = await Metric.findByTypeAgentUuid(type, uuid)
  } catch (error) {
    next(error)
  }

  if (!metrics || metrics.length === 0) {
    next(new Error(`Metrics with type ${type} not found to agent with uuid ${uuid}`))
  }

  res.send(metrics)
})

module.exports = api
