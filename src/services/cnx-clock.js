/* eslint-disable no-undef */
/* eslint-disable no-console */
import moment from 'moment'
let instance = null

export default class CnxClock {
  constructor () {
    if (!instance) {
      instance = this
      this._now = new Date()

      setInterval(() => {
        try {
          this._now = this._now ? moment(this._now).add(1, 'seconds').toDate() : null
        } catch (e) {
          console.log('Error CnxClock:', e)
        }
      }, 1000)
    }
  }

  static get singleton () {
    if (!instance) {
      instance = new CnxClock()
    }
    return instance
  }

  get now () {
    return this._now
  }

  set now (value) {
    this.setNow(value)
  }

  setNow (value) {
    this._now = value ? moment(value).toDate() : null
    return this
  }
}
