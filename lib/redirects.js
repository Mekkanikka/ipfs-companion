'use strict'

const gw = require('./gateways')

const {Cc, Ci} = require('chrome')

const ioservice = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService)
const observice = Cc['@mozilla.org/observer-service;1'].getService(Ci.nsIObserverService)

const ipfsRequestObserver = {
  observe: function (subject, topic, data) { // eslint-disable-line no-unused-vars
    if (topic === 'http-on-modify-request') {
      let channel = subject.QueryInterface(Ci.nsIHttpChannel)
      let httpUrl = channel.URI.spec
      if (httpUrl.match(gw.publicHosts) && httpUrl.match(gw.IPFS_RESOURCE)) {
        channel.setRequestHeader('x-ipfs-firefox-addon', 'true', false)
        if (gw.redirectEnabled) {
          // console.info('Detected HTTP request to the public gateway: ' + channel.URI.spec)
          let uri = ioservice.newURI(httpUrl.replace(gw.publicHosts, gw.customUri.spec), null, null)
          // console.info('Redirecting to custom gateway: ' + uri.spec)
          channel.redirectTo(uri)
        }
      }
    }
  },
  register: function () {
    if (this.registered) {
      return
    }
    this.registered = true
    observice.addObserver(this, 'http-on-modify-request', false)
  },
  unregister: function () {
    if (!this.registered) {
      return
    }
    this.registered = false
    observice.removeObserver(this, 'http-on-modify-request')
  }
}

gw.onPreferencesChange(() => {
  if (gw.redirectEnabled) {
    ipfsRequestObserver.register()
  } else {
    ipfsRequestObserver.unregister()
  }
})

exports.on = ipfsRequestObserver.register
exports.off = ipfsRequestObserver.unregister

exports.ipfsRequestObserver = ipfsRequestObserver