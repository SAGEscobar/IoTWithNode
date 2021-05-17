'use strict'

module.exports = function setupMetric (metricModel, agentModel) {
  async function create (uuid, metric) {
    const agent = await agentModel.findOne({
      where: {
        uuid
      }
    })
    if (agent) {
      Object.assign(metric, { agentId: agent.id })
      const result = await metricModel.create(metric)
      return JSON.stringify(result)
    }
  }

  async function findByAgentUuid (uuid) {
    return metricModel.findAll({
      attributes: ['type'],
      group: ['type'],
      include: [{
        attributes: [],
        model: agentModel,
        where: {
          uuid
        }
      }],
      raw: true
    })
  }

  async function findByTypeAgentUuid(type, uuid){
    return metricModel.findAll({
      attributes: [ 'id', ' type', 'value', 'createdAt'],
      where: {
        type
      },
      limit: 20,
      order: [[ 'createdAt', 'DESC']],
      include:[{
        attributes: [],
        model: agentModel,
        where: {
          uuid
        }
      }],
      raw: true
    })
  }

  return {
    create,
    findByAgentUuid,
    findByTypeAgentUuid
  }
}
