

const { _typeof } = require('../data/util');
const json = require('../data/json');

/**
 * 
 * @since  1.0
 * @author Lo Shih <kloshih@gmail.com>
 * @copyright Copyright 2021 Lo Shih 
 */
 class Dependency {

  constructor(config, owner) {
    this.owner = owner;
    this.state = 'unresolved';

    if (config) {
      const parser = json.parser(this, config);
      parser.value('name', 'string!', {key:true});
      parser.value('version', 'semverspec!', {implicit:true});
    }
  }

  toJSON(owner=null) {
    const formatter = json.formatter(this, {}, owner);
    formatter.value('name', 'string!', {key:true});
    formatter.value('version', 'semverspec!', {implicit:true});
    return formatter.done();
  }

  validate() {
    json.validate(this, 'name', {type:'string!'});
    json.validate(this, 'version', {type:'semverspec!'});
  }

  /* ---------------------- Implementation Support ------------------------- */

  /**
   * Resolves the model all of its types as well as all of its properties
   */
   resolve() {
    if (this.state == 'resolved')
      return;
    try {

      this.state = 'resolved';
    } catch (error) {
      this.state = 'partial';
      throw error
    }
  }

}
module.exports = Dependency;