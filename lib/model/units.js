
const Type = require('../model/type')
const log = require('logsync')

/**
 * 
 * @since  1.0
 * @author Lo Shih <kloshih@gmail.com>
 * @copyright Copyright 2021 Lo Shih 
 */
class Unit {

  static get consts() {
    return {
      microsecond:  { code:'μs', scale:{ms:1e-3} },
      millisecond:  { code:'ms', scale:{s:1e-3} },
      second:       { code:'s' },
      minute:       { code:'m', scale:{s:60} },
      hour:         { code:'h', scale:{m:60} },
      day:          { code:'d', scale:{h:24} },
      month:        { code:'mn', scale:{'~d':30} },
      year:         { code:'yr', scale:{'~d':365,m:12} },
      bit:          { code:'b' },
      byte:         { code:'B', scale:{b:8} },
      kilobyte:     { code:'kB', scale:{B:1e3} },
      megabyte:     { code:'mB', scale:{kB:1e3} },
      gigabyte:     { code:'gB', scale:{mB:1e3} },
      terabyte:     { code:'tB', scale:{gB:1e3} },
      count:        { code:'#' },
    }
  }

  static get type() {
    return Type.type(this, {
      props: {
        name: {type:'string'},
        code: {type:'string'},
        scale: {type:'object'},
      }
    })
  }

  constructor(config, owner) {
    Type.initialize(this, config, owner);
    this.owner = owner;
  }
  
}
module.exports = Unit;


