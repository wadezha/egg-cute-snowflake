'use strict';

const os = require('os');

module.exports = {

  getHostName() {
    return os.hostname();
  },

  getIPAddress() {
    let interfaces = require('os').networkInterfaces();
    for (var devName in interfaces) {
	    var iface = interfaces[devName];
	    for (var i = 0; i < iface.length; i++) {
        let alias = iface[i];
        if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
          return alias.address;
        }
      }
　　}
    return '';
  },

  randomRange(min, max) {
    const range = max - min;
    return min + Math.round(Math.random() * range);
  },

  toCodePoints(str) {
    return str.split('').map(m => m.charCodeAt());
  },

  mathSum(arr) {
    return arr.reduce((prev, current) => prev + Number.parseFloat(current), 0);
  },
};
