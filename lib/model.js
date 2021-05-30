const IndexedList = require('../../proper/list.indexed');
const json = require('../../json');

const Dependency = require('./dependency')
const Typedef = require('./typedef');
const { _typeof } = require('../../proper/util');

/**
 * 
 * @since  1.0
 * @author Lo Shih <kloshih@gmail.com>
 * @copyright Copyright 2021 Lo Shih 
 */
 class Model {

  /**
   * 
   * @param {constructor} cls The type class
   */
  static for(cls) {
    
  }

  constructor(config, owner) {
    this.owner = owner;
    this.dependencies = new IndexedList({indexes:{name:true}});
    this.typedefs = new IndexedList({indexes:{name:true,impl:true}});

    if (config) {
      const parser = json.parser(this, config);
      parser.set('name', 'string!');
      parser.set('version', 'semver!');
      parser.many('dependencies', Dependency);
      parser.many('typedefs', Typedef);
      parser.done();
    }
  }

  /**
   * When the *version* is not provided, returns the dependency with the given
   * *name* if it exists. When provided, adds or reassigns the version number
   * for the dependency
   * @param {string} name The name of the dependent model
   * @param {string} version The version of the dependent model
   * @returns The dependency
   */
  dependency(name, version=null) {
    let dep = this.dependencies.get('name', name);
    if (version !== null) {
      if (!dep) {
        dep = new Dependency({ name, version }, this);
        this.dependencies.push(dep);
      } else if (dep.version !== version) {
        dep.version = version;
      }
    }
    return dep;
  }

  /**
   * Returns the typedef for the given *name* or as a code or as a 
   * implementation class. If the type does not exist, one is created for you
   * and returned.
   * @param {string} name The name of the typedef
   * @returns {Typedef} the typedef or null if not found
   */
  typedef(name) {
    if (_typeof(name) == 'class') {
      // do something with the class
      let cls = name;
      name = cls.name;
    }
    let typedef;
    if (typedef = this.typedefs.get('name', name))
      return typedef;
    if (typedef = this.typedefs.get('code', name))
      return typedef;
    typedef = new Typedef(null, this);
    typedef.name = name;
    this.typedefs.push(typedef);
    return typedef;
  }
 
  toJSON(owner=null) {
    const formatter = json.formatter(this, {}, owner);
    formatter.set('name', 'string!');
    formatter.set('version', 'string!');
    formatter.many('dependencies', Dependency);
    formatter.many('typedefs', Typedef);
    return formatter.done();
  }

}
module.exports = Model;