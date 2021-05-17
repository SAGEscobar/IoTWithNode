'use strict'

const { db } = require('../')

async function  run (){
  const config = {
    database: process.env.DB_NAME || 'platziverse',
    username: process.env.DB_USER || 'platzi',
    password: process.env.DB_PASS || 'platzi',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres'
  }

  const {Agent, Metric} = await db(config).catch(handleFatalError)

  const agent = await Agent.createOrUpdate({
    uuid: 'yyy',
    name: 'Zag',
    username: 'chronos',
    hostname: 'test',
    pid: 1,
    connected: true,
  }).catch(handleFatalError)

  console.log('--Agent--')
  console.log(agent)
}

function handleFatalError(err){
  console.error(err.message)
  console.error(err.stack)
  precess.exit(1)
}

run()