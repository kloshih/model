
const IndexedList = require('../data/list.indexed');
const json = require('../data/json');
const { _typeof } = require('../data/util');

const Prop = require('./prop');
const Index = require('./index');

/**
 * 
 * @since  1.0
 * @author Lo Shih <kloshih@gmail.com>
 * @copyright Copyright 2021 Lo Shih 
 */
 class Typedef {

  constructor(config, model) {
    this.model = model;
    this.props = new IndexedList({indexes:{name:true}});
    if (config) {
      const parser = json.parser(this, config);
      parser.set('name', 'string!', {key:true});
      parser.set('extends', 'string');
      parser.set('impl', 'class');
      parser.many('props', Prop);
      parser.many('indexes', Index);
      parser.done();
    }
  }

  /**
   * Returns the prop for the given *name* or as a code. If the prop does not 
   * exist, one is created for you and returned.
   * @param {string} name The name of the prop
   * @returns {Prop} the prop or null if not found
   */
   prop(name) {
    let prop;
    if (prop = this.props.get('name', name))
      return prop;
    if (prop = this.props.get('code', name))
      return prop;
    prop = new Prop(null, this);
    prop.name = name;
    this.props.push(prop);
    return prop;
  }

  toJSON(owner=null) {
    const formatter = json.formatter(this, {}, owner);
    formatter.set('name', 'string!', {key:true});
    formatter.set('extends', 'string');
    formatter.set('impl', 'class');
    formatter.many('props', Prop);
    formatter.many('indexes', Index);
    return formatter.done();
  }

}
module.exports = Typedef;
