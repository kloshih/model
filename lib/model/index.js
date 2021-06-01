
const { _typeof } = require('../data/util');
const json = require('../data/json');

/**
 * 
 * @since  1.0
 * @author Lo Shih <kloshih@gmail.com>
 * @copyright Copyright 2021 Lo Shih 
 */
 class Index {

  constructor(config, type) {
    this.type - type;

    if (config) {
      const parser = json.parser(this, config);
      parser.set('name', 'string!', {key:true});
      parser.set('keys', 'string*', {implicit:true});
      parser.set('unique', 'boolean', {default:true});
    }
  }

  toJSON(owner) {
    const formatter = json.formatter(this, {}, owner);
    formatter.set('name', 'string!', {key:true});
    formatter.set('keys', 'string*', {implicit:true});
    formatter.set('unique', 'boolean', {default:true});
    return formatter.done();
  }

}
module.exports = Index;
