'use strict'

const setupDatabase = require('./lib/db')
const setupAgentModel = require('./models/agent')
const setupMetricModel = require('./models/metric')
const setupAgent = require('./lib/agent')
const setupMetric = require('./lib/metric')
const defaults = require('defaults')
const debug = require('debug')('patziverse:db')

module.exports = {
  db: async function (config) {
    config = defaults(config, {
      dialect: 'sqlite',
      pool: {
        max: 10,
        min: 0,
        idle: 10000
      },
      query: {
        raw: true
      }
    })

    const sequelize = setupDatabase(config)
    const agentModel = setupAgentModel(config)
    const metricModel = setupMetricModel(config)

    agentModel.hasMany(metricModel)
    metricModel.belongsTo(agentModel)

    await sequelize.authenticate()

    if (config.setup) {
      await sequelize.sync({ force: true })
    }

    const Agent = setupAgent(agentModel)
    const Metric = setupMetric(metricModel, agentModel)

    return {
      Agent,
      Metric
    }
  }
}
