'use strict'
const debug = require('debug')('platzierse:agent')
const mqtt = require('mqtt')
const os = require('os')
const util = require('util')
const defaults = require('defaults')
const { parsePayload } = require('./utils')
const uuid = require('uuid')

const EventEmiter = require('events')

const options = {
  name: "untitled",
  username: "platzi",
  interval: 5000,
  mqtt: {
    host: 'mqtt://localhost'
  }
}

class PlatziverseAgent extends EventEmiter {
  constructor(opts) {
    super()

    this._options = defaults(opts, options)
    this._started = false
    this._timer = null
    this._client = null
    this._agentId = null
    this._metrics = new Map()
  }

  addMetric(type, fn) {
    this._metrics.set(type, fn)
  }

  removeMetric(type) {
    this._metrics.delete(type)
  }

  connect() {
    if (!this._started) {
      const opts = this._options
      this._client = mqtt.connect(opts.mqtt.host)

      this._client.subscribe('agent/message')
      this._client.subscribe('agent/connected')
      this._client.subscribe('agent/disconnected')

      this._client.on('connect', () => {
        this._agentId = uuid.v4()

        this.emit('connected', this._agentId)
        this._timer = setInterval(async () => {
          if (this._metrics.size > 0) {
            let message = {
              agent: {
                uuid: this._agentId,
                username: opts.username,
                name: opts.name,
                hostname: os.hostname() || 'localhost',
                pid: process.pid
              },
              metrics: [],
              timestamps: new Date().getTime()
            }

            for (let [metric, fn] of this._metrics) {
              if (fn.length == 1) {
                fn = util.promisify(fn)
              }
              message.metrics.push({
                type: metric,
                value: await Promise.resolve(fn())
              })
            }

            debug(`Sending: ${message}`)

            this._client.publish('agent/message', JSON.stringify(message))
            this.emit('message', message)

          }
          this.emit('agent/message', 'hello world')
        }, opts.interval)
        this._started = true

      })

      this._client.on('message', (topic, payload) => {
        payload = parsePayload(payload)

        let broadcast = false

        switch (topic) {
          case 'agent/connected':
          case 'agent/disconnected':
          case 'agent/message':
            broadcast = payload && payload.agent && payload.agent.uuid !== this._agentId
            break
        }

        if (broadcast) {
          this.emit(topic, payload)
        }
      })

      this._client.on('error', () => this.disconnect())
    }
  }

  disconnect() {
    if (this._started) {
      clearInterval(this._timer)
      this._started = false
      this.emit('disconnected', this._agentId)
      this._client.end()
    }
  }
}

module.exports = PlatziverseAgent