'use strict'

const test = require('ava')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const agentFixtures = require('./fixtures/agent')
const { single } = require('./fixtures/agent')

const config = {
  database: process.env.DB_NAME || 'platziverse',
  username: process.env.DB_USER || 'platzi',
  password: process.env.DB_PASS || 'platzi',
  host: process.env.DB_HOST || 'localhost',
  dialect: 'postgres',
  logging: function () { }
}

const MetricStub = {
  belongsTo: sinon.spy()
}

const id = 1
const uuid = 'yyy-yyy-yyy'
let AgentStub = null
let db = null
let sandbox = null

const uuidArgs = {
  where: {
    uuid
  }
}

test.beforeEach(async () => {
  sandbox = sinon.createSandbox()
  AgentStub = {
    hasMany: sandbox.spy()
  }

  // Model findById

  AgentStub.findById = sandbox.stub()
  AgentStub.findById.withArgs(id).returns(Promise.resolve(agentFixtures.byId(id)))

  // Model findOne

  AgentStub.findOne = sandbox.stub()
  AgentStub.findOne.withArgs(uuidArgs).returns(Promise.resolve(agentFixtures.byUuid(uuid)))

  // Model Update stub

  AgentStub.update = sandbox.stub()
  AgentStub.update.withArgs(single, uuidArgs).returns(Promise.resolve(single))

  // Model createOrUpdate

  // AgentStub.createOrUpdate = sandbox.stub()

  const { db: setupDatabase } = proxyquire('../', {
    './models/agent': () => AgentStub,
    './models/metric': () => MetricStub
  })

  db = await setupDatabase(config)
})

test.afterEach(() => {
  sandbox && sandbox.restore()
})

test('Agent', t => {
  t.truthy(db.Agent, 'Agent service should exist')
})

test.serial('Setup', t => {
  t.true(AgentStub.hasMany.called, 'AgentModel.hasMany was executed')
  t.true(AgentStub.hasMany.calledWith(MetricStub), 'Argument should be the MetricModel')
  t.true(MetricStub.belongsTo.called, 'MetricModel.belongsTo was executed')
  t.true(MetricStub.belongsTo.calledWith(AgentStub), 'Argument should be the AgentModel')
})

test.serial('Agent#findByID', async t => {
  const agent = await db.Agent.findById(id)

  t.true(AgentStub.findById.called, 'The function should be called by the model')
  t.true(AgentStub.findById.calledOnce, 'The function should be called once')
  t.true(AgentStub.findById.calledWith(id), 'The function should be called with specified id')
  t.deepEqual(agent, agentFixtures.byId(id), 'Should be the same')
})

test.serial('Agent#createOrUpdate', async t => {
  const agent = await db.Agent.createOrUpdate(single)

  t.true(AgentStub.findOne.called, 'findOne should be called')
  t.true(AgentStub.findOne.calledTwice, 'findOne should be called twice')
  t.true(AgentStub.findOne.calledWith(uuidArgs), 'findOne should be called with defined uidArgs')

  t.true(AgentStub.update.called, 'update should be called')
  t.true(AgentStub.update.calledOnce, 'update should be called once')
  t.true(AgentStub.update.calledWith(single, uuidArgs), 'update should be called with defined arguments')

  t.deepEqual(agent, single, 'Agent should be the same')
})
