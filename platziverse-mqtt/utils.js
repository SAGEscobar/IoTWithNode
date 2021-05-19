'use strict'

function parsePayload (payload) {
  if (payload instanceof Buffer) {
    payload = payload.toString('utf-8')
  }

  try {
    payload = JSON.parse(payload)
  } catch (err) {
    payload = null
  }

  return payload
}

module.exports = {
  parsePayload
}
