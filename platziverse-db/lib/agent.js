'use strict'

module.exports = function setupAgent (agentModel) {
  async function createOrUpdate (agent) {
    const cond = {
      where: {
        uuid: agent.uuid
      }
    }

    const existAgent = await agentModel.findOne(cond)

    if (existAgent) {
      const updated = await agentModel.update(agent, cond)
      return updated ? agentModel.findOne(cond) : existAgent
    }

    const result = await agentModel.create(agent)
    return result.dataValues
  }

  async function findById (id) {
    return await agentModel.findById(id)
  }

  async function findByUuid (uuid) {
    const cond = {
      where: {
        uuid
      }
    }

    return await agentModel.findOne(cond)
  }

  async function findAll () {
    return await agentModel.findAll()
  }

  async function findConnected () {
    return await agentModel.findAll({
      where: {
        connected: true
      }
    })
  }

  async function findByUsername (username) {
    return await agentModel.findAll({
      where: {
        username,
        connected: true
      }
    })
  }

  return {
    createOrUpdate,
    findById,
    findAll,
    findByUsername,
    findConnected,
    findByUuid
  }
}
