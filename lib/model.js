
const log = require('logsync');
const runtime = require('reflecter');
const semver = require('semver');

const { _typeof } = require('./data/util');
const json = require('./data/json');
const IndexedList = require('./data/list.indexed');

const Dependency = require('./model/dependency')
const Type = require('./model/type');

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
  static type(cls, config) {
    throw new Error("IMPL")
    let type = cls[kType];
    if (!type) {
      type = cls[kType] = new Type();
    }
    return type;
  }

  /*
   * Model names:
   *   "pets"       - Models == namespace, 
   *   "pets-0.1"   - 
   * Type names:
   *   "pets:Dog"   - 
   */

  constructor(config, owner) {
    this.owner = owner;
    this.dependencies = new IndexedList({indexes:{name:true}});
    this.types = new IndexedList({indexes:{name:true,impl:true}});
    this.phase = 'unresolved';
    if (config) {
      const parser = json.parser(this, config);
      parser.value('url', 'string');
      parser.value('name', 'string!');
      parser.value('version', 'semver!');
      parser.many('dependencies', Dependency, {key:'name'});
      parser.many('types', Type, {key:'name'});
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
   * Returns the type for the given *name* or as a code or as a 
   * implementation class. If the type does not exist, one is created for you
   * and returned.
   * @param {string} name The name of the type
   * @returns {Type} the type or null if not found
   */
  type(name) {
    if (_typeof(name) == 'class') {
      // do something with the class
      let cls = name;
      name = cls.name;
    }
    let type;
    if (type = this.types.get('name', name))
      return type;
    if (type = this.types.get('code', name))
      return type;
    return null;
    // Use this as a lookup and not a creator
    // type = new Type(null, this);
    // type.name = name;
    // this.types.push(type);
    // return type;
  }
 
  validate() {
    const validator = json.validator(this, {}, this.owner);
    validator.value('name', 'string!');
    validator.value('version', 'semver!');
    validator.many('dependencies', Dependency, {key:'name'});
    validator.many('types', Type, {key:'name'});
    return validator.done();
  }

  toJSON(owner=null) {
    const formatter = json.formatter(this, {}, owner);
    formatter.value('name', 'string!');
    formatter.value('version', 'semver!');
    formatter.many('dependencies', Dependency, {key:'name'});
    formatter.many('types', Type, {key:'name'});
    return formatter.done();
  }



  /* ---------------------- Implementation Support ------------------------- */

  /**
   * Resolves the model all of its types as well as all of its properties
   */
  resolve() {
    if (this.phase == 'resolved')
      return;
    phases.forEach(phase => {
      this.phase = phase;
      switch (phase) {
        case 'validate':
          this.validate();
          break;
      }
      this.dependencies.forEach(dep => dep.resolve(phase));
      this.types.forEach(type => type.resolve(phase));
    })
  }

  _addType(type) {
    this.types.push(type);
    for (let i = phases.indexOf(type.phase) + 1, 
            ix = phases.indexOf(this.phase); i <= ix; i++) {
      type.resolve(phases[i])
    }
  }

  _clear() {
    this.types.length = 0;
  }

  /**
   * 
   * @param {} impl 
   */
  static modelForImpl(impl, opts) {
    let model = impl[kModel];
    if (model)
      return model;

    log('info', "#wh[Runtime: #gr[%s]]", runtime);      

    /* Use the runtime to find models for this package. */
    if (!impl.$runtime)
      runtime.sync()
    let pack;
    if (impl.$runtime) {
      pack = impl.$runtime.package;
    } else if (opts && opts.package) {
      pack = runtime.package(opts.package);
    } else {
      throw new Error("Reflecter runtime not loaded for class: " + impl.name);
    }
    
    // alternatively search 'providers.model' for a model that includes
    // this class. See modelsForPackage(). For now, we'll simply create 
    // one based on the base class. 

    /* Search for the type by looking through all of the package models */
    const models = this.modelsForPackage(pack);
    for (let dir in models) {
      const mod = models[dir];
      const type = mod.type(impl);
      if (type) {
        model = mod;
        break;
      }
    }
    if (!model) {
      const modelsByName = packageModels[pack.dir];
      model = modelsByName[pack.name];
      if (!model)
        throw new Error("IMPL: can't find implicit model for: " + pack.name);
    }
    return impl[kModel] = model;
  }

  /**
   * Returns the Ad-hoc model for the given package. An ad-hoc model is used 
   * for any implementations that aren't loaded explicit through metadata in
   * the 'package.json' file of a package or loaded from a model file, or 
   * loaded from other source. Ad-hoc models are usually used for testing 
   * and development purposes. 
   * @param {string} pack The path to the package or a file within a package
   * @return The Ad-hoc model
   */
  static adhocModelForPackage(file) {
    const pack = runtime.package(file);
    const models = this.modelsForPackage(pack);
    const adhocModel = models[pack.name];
    if (!adhocModel) throw new Error("IMPL: can't find ad hoc model for path: " + file)
    return adhocModel;
  }

  /**
   * Automatically 
   * @param {reflecter.Package} pack The package 
   * @return {array} An array of models
   */
  static modelsForPackage(pack) {
    let models = packageModels[pack.dir];
    if (models)
      return models;
    models = packageModels[pack.dir] = {};

    /* Get a list of definitions */
    let defns = pack.providers('model') || {};

    // in package.json: ...providers:{ models:{ [name]: (path | {name, version, dependencies:{[name]:semver}, types:(path|{[name]:...}) } } }
    for (let name in defns) {
      let defn = defns[name];
      let model;
      switch (typeof(defn)) {
        case 'string': // relative model path, eg. './conf/model.json'
          const file = path.join(pack.dir, defn);
          const doc = require(file);
          doc.package = pack;
          model = new Model(doc);
          model.package = pack;
          models[model.name] = model;
          break;
        case 'object':
          defn.name || (defn.name = name);
          defn.version || (defn.version = pack.version);
          defn.package = pack;
          model = new Model(defn);
          break;
        default: throw new Error(`${pack.name}/package.json 'providers.model.${name}' defines a model must be a model path or an object definition`);
      }
    }
    
    /* Ensure there's an implicit model, the model that includes all of the 
     * ad-hoc concrete types contained in this pack. See Type.type() */
    let implicitModel = models[pack.name];
    if (!implicitModel) {
      implicitModel = new Model({ name:pack.name, version:pack.version });
      models[pack.name] = implicitModel;
    }

    return models;
  }

}
module.exports = Model;


/**
 * Local definition of implementation models, i.e. those defined in-process
 * from any of the loaded packages, either formally defined (listed in package.
 * json) or defined ad-hoc like in test classes that get glommed onto 
 * the package.
 * 
 * packageModels: { [name]: { [version]:model } } }
 */
const packageModels = {};

/* Key on impl classes, to map impls to their model, usually a package model */
const kModel = Symbol('kModel');

/* Resolve phases */
const phases = ['validate', 'binding', 'types', 'resolved'];
