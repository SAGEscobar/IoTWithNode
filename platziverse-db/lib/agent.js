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

    const result = agentModel.create(agent)
    return JSON.stringify(result)
  }

  function findById (id) {
    return agentModel.findById(id)
  }

  function findByUuid (uuid) {
    const cond = {
      where: {
        uuid
      }
    }

    return agentModel.findOne(cond)
  }

  function findAll () {
    return agentModel.findAll()
  }

  function findConnected () {
    return agentModel.findAll({
      where: {
        connected: true
      }
    })
  }

  function findByUserName (username) {
    return agentModel.findAll({
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
    findByUserName,
    findConnected,
    findByUuid
  }
}
