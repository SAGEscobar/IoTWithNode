'use strict'

const debug = require('debug')('platziverse:db:setup')
const inquirer = require('inquirer')
const chalk = require('chalk')
const minimist = require('minimist')
const { db } = require('./index')

const args = minimist(process.argv)
const prompt = inquirer.createPromptModule()

async function setup () {
  if (!args.yes) {
    const answer = await prompt([
      {
        type: 'confirm',
        name: 'setup',
        message: 'This will destroy your database, are you sure?'
      }
    ])

    if (!answer.setup) {
      return console.log('Nothing happened :)')
    }
  }

  const config = {
    database: process.env.DB_NAME || 'platziverse',
    username: process.env.DB_USER || 'platzi',
    password: process.env.DB_PASS || 'platzi',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: s => debug(s),
    setup: true
  }

  console.log(db)

  await db(config).catch(handelFatalError)

  console.log('success')
  process.exit(0)
}

function handelFatalError (err) {
  console.log(err.message)
  console.log(err.stack)
  process.exit(1)
}

setup()
