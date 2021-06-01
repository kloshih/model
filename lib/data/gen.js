
const log = require('logsync')

/**
 * 
 * @since  1.0
 * @author Lo Shih <kloshih@gmail.com>
 * @copyright Copyright 2021 Lo Shih 
 */
class Gen {

  static gen(owner, name, subject, ...args) {
    const implName = owner.constructor.name + '.' + name;
    let impls = subjects.get(subject);
    if (!impls)
      subjects.set(subject, impls = {});
    let impl = impls[implName];
    if (impl)
      return impl.apply(owner, args);
    return new Gen(owner, name, subject);
  }

  constructor(owner, name, subject) {
    this.owner = owner;
    this.name = name;
    this.subject = subject;
    this.codes = [];
  }

  code(code) {
    this.codes.push(code);
  }
  
  call(target, method, params) {
    let args = [];
    for (let key in params) {
      args.push({[key]:params[key]});
    }
    return target[method].call(target, this, ...params);
  }

  compile() {
    this.func = new Function('params', this.codes.join('\n'));
    return this.func;
  }
  
}
module.exports = Gen;

const subjects = new WeakMap();