
const path = require('path');
const fs = require('fs');

/**
 * The Runtime class provides the following features:
 * 
 * - All required packages and modules are tracked
 * - Watches local projects for changes
 * - Automatically reloads type classes on file changes 
 * - Annotates type classes with package and versions
 */
class Runtime {

  constructor(config) {
    this.config = config;
    this.packs = {};
    this.modules = {};
    this.locals = {};
    this.main = null;
    this.sync();
    this.timer = setInterval(() => this.sync(), 5e3);
    this.timer.unref()
  }

  async sync() {
try {
    // console.log("sync: M2", Runtime.props, Runtime.calc(), this.hello());
    /* Loop through the cache */
    let time = process.hrtime();
    const cache = require.cache;
    for (let file in cache) {
      if (this.modules[file]) continue;
      let module = cache[file], match;
      if (match = file.match(/^((\/.*?)\/node_modules\/[^\/]+)\/(.*)$/)) {
        /* If this is inside a to p/node_modules dir, then register both */
        let parent = this.pack(match[2]);
        let child = this.pack(match[1]);
        parent.dependency(child);
        if (!match[3].includes('/node_modules/')) {
          this.modules[file] = child.module(module);
        }
      } else {
        /* Otherwise, there's no node_modules, so this is a local pkg */
        for (let c = path.dirname(file); c != '/'; c = path.dirname(c)) {
          let parent = this.packs[c];
          if (!parent) {
            if (!fs.existsSync(path.join(c, 'package.json')))
              continue;
            parent = this.pack(c);
          }
          this.modules[file] = parent.module(module);
          break;
        }
      }
    }
    /* Resolve the main */
    if (!this.main) {
      this.main = this.module(require.main.filename);
    }

    time = process.hrtime(time);
    time = time[0]*1e3 + time[1]/1e6;
    // console.log(`Runtime: synced in ${time.toFixed(3)}ms`);

} catch (error) {
  console.log(error.stack)
}
  }
  
  pack(dir) {
    let pack = this.packs[dir];
    if (!pack) {
      pack = this.packs[dir] = new Pack(dir, this)
      if (!dir.includes('/node_modules/')) {
        this.locals[dir] = pack;
        pack.attach();
      }
    }
    return pack;
  }
  
  module(file) {
    let module = this.modules[file];
    return module;
  }
  
}
module.exports = Runtime;

class Pack {

  constructor(dir, runtime) {
    // console.log("Created pack: " + dir);
    this.runtime = runtime;
    this.dir = dir;
    this.name = path.basename(dir);
    const infopath = path.join(this.dir, 'package.json');
    try {
      this.info = require(infopath);
    } catch (error) {
      // console.log("Couldn't require: " + infopath + "\n" + error.stack);
    }
    this.modules = {};
    this.dependencies = {};
  }

  dependency(pack) {
    let dependency = this.dependencies[pack.name];
    if (!dependency) {
      dependency = this.dependencies[pack.name] = pack;
    } else if (dependency !== pack) {
      throw new Error("IMPL: multiple dependencies");
    }
    return dependency;
  }

  module(module) {
    const file = module.filename;
    if (!file.startsWith(this.dir))
      throw new Error("IMPL")
    let subfile = file.substring(this.dir.length + 1);
    return this.modules[subfile] || (this.modules[subfile] = new Module(module, this));
  }

  attach() {
    if (this.watcher)
      throw new Error("IMPL: already attached")
    // console.log("Runtime attach: watching: " + this.dir);
    const self = this;
    this.watcher = fs.watch(this.dir, { recursive:true, persistent:false, encoding:'utf8' }, function(e, f) {
      if (self.watcher !== this)
        throw new Error("IMPL: watcher?");
      self.fileChanged(e, f, this)
    });
    this.watcher.on('close', () => {
      console.log("fileChanged: closed");
    })
    this.watcher.on('error', (error) => {
      console.log("fileChanged: error", error);
    })
  }

  detach() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }

  fileChanged(event, filename) {
    try {
      // console.log(new Date().toISOString() + ": fileChanged: event=" + event + ", file=" + filename);
      const file = path.join(this.dir, filename);
      let module = this.runtime.module(file);
      switch (event) {
        case 'change':
          if (module)
            module.reload();
          break;
        case 'rename': // or delete
          if (module)
            module.renamed = true;
          // try {
          //   let stat = fs.statSync(file);
          //   console.log("stat:", stat, "module=" + module);
          // } catch (error) {
          //   if (error.code === 'ENOENT')
          //     console.log("File removed/renamed, module=" + module)
          //   else
          //     throw error;
          // 
          break;
        default:
          console.log("Unsupported change type");
      }
    } catch (error) {
      console.log("Runtime: IMPL error: ", error.stack);
    }
  }

}
Runtime.Pack = Pack;

class Module {

  constructor(module, pack) {
    this.file = module.filename;
    this.stat = fs.statSync(this.file);
    this.module = module;
    this.pack = pack;
    this.version = 0;
    this.types = Module.exportedTypes(module.exports);
    for (let key in this.types) {
      Object.defineProperty(this.types[key], '$runtime', { value:{module:this, package:this.pack, version:0}, enumerable:false, writable:false, configurable:true });
    }
    this.generations = [];
  }

  check() {

  }

  /**
   * Reloads this module and redefines symbols as needed, writing previous 
   * definitions based on
   */
  reload() {
    /* To prevent from double-loading, check to see if mtime is too 
     * short */
    const oldStat = this.stat;
    this.stat = fs.statSync(this.file);
    const age = this.stat.mtimeMs - oldStat.mtimeMs;
    if (age == 0)
      return;

    /* Don't reload files that have no types defined. */
    if (Object.keys(this.types).length == 0) {
      console.log(`Runtime: package '${this.pack.name}' not reloading, no types in module '${this.file}'`);
      return;
    }

    // console.log(`  - ${this.stat.mtimeMs - oldStat.mtimeMs}ms ago`);

    /* Record the previous generation */
    this.generations.push(this.types);

    /* Reload the module and capture the new types */
    delete(require.cache[this.file]);
    const exports = require(this.file);
    this.module = require.cache[this.file];
    const newTypes = this.types = Module.exportedTypes(exports);
    for (let key in this.types) {
      Object.defineProperty(this.types[key], '$runtime', { value:{module:this, package:this.pack, version:0}, enumerable:false, writable:false, configurable:true });
    }

    /* Each previous generation needs to be rewritten to be identical to the 
     * new one, since each of them could have been instantiated */
    for (let oldTypes of this.generations) {
      for (let exportKey in oldTypes) {
        let oldType = oldTypes[exportKey], newType = newTypes[exportKey];
        if (!newType) continue;
        // console.log(`Module(${this.file}): Annotate ${newType.name} type`);
        /* Version bump, annotate previous vesrions? */
        newType.$runtime.version = oldType.$runtime.version + 1;

        const oldTypeProps = Object.getOwnPropertyDescriptors(oldType);
        const newTypeProps = Object.getOwnPropertyDescriptors(newType);
        for (let key in newTypeProps) {
          if (reserved.includes(key)) continue;
          let oldProp = oldTypeProps[key], newProp = newTypeProps[key];
          if (oldProp && !oldProp.configurable) continue;
          // console.log(`  + ${newType.name}.${key}`);
          Object.defineProperty(oldType, key, newProp);
        }

        /* Convert all of the prototype methods to call the new one */
        const oldProto = oldType.prototype, newProto = newType.prototype;
        const oldProtoProps = Object.getOwnPropertyDescriptors(oldProto);
        const newProtoProps = Object.getOwnPropertyDescriptors(newProto);
        for (let key in newProtoProps) {
          if (reserved.includes(key)) continue;
          let oldProp = oldProtoProps[key], newProp = newProtoProps[key];
          let oldPropType = _typeof(oldProp), newPropType = _typeof(newProp);
          if (oldProp && !oldProp.configurable) continue;
          // console.log(`  - ${newType.name}.${key}`);
          Object.defineProperty(oldProto, key, newProp);

          // if (oldPropType === 'function' && newPropType === 'function') {
          //   /* */
          //   console.log(`  - ${newType.name}.${key}()...`);
          //   // const desc = Object.getOwnPropertyDescriptor(oldProto, key);
          //   // console.log(`    old: `, desc);
          //   oldProto[key] = newProp;
          //   // const desc2 = Object.getOwnPropertyDescriptor(oldProto, key);
          //   // console.log(`    new: `, desc2);

          //   console.log(`    Runtime.sync? `);

          // }
        }

      }
    }
    const entries = Object.entries(this.types);
    if (entries.length > 0)
      console.log(`Runtime: package '${this.pack.name}' reloaded module '${this.file}' (${entries.map(([k,t]) => this.types[''].name+(k?'.'+k:'')+/*' "'+t.name+'"*/'@'+t.$runtime.version+'').join(', ')})`);
  }

  /**
   * Returns map of exported types by depth key.
   */
  static exportedTypes(exports) {
    const types = {};
    for (let entry, queue = [['', exports]], seen = new Map(); 
         entry = queue.shift(); ) {
      let [kp, symbol] = entry;
      if (seen.has(symbol)) continue;
      seen.set(symbol, true);
      switch (_typeof(symbol)) {
        case 'class':
          types[kp] = symbol;
          // fall through
        case 'object':
          for (let key in symbol) {
            const s = symbol[key], subtype = _typeof(s);
            if (/*subtype == 'object' ||*/ subtype == 'class')
              queue.push([kp ? kp+'.'+key : key, s])
          }
          break;
      }
    }
    return types;
  }

}
Runtime.Module = Module;

/* Using a global runtime allows us to detach from multiple loading versions of 
 * the runtime. This is the best way to go for singletons, since class 
 * definition is fluid. */
if (!global.runtime)
  global.runtime = new Runtime();

const reserved = ['constructor', 'prototype', 'length', 'arguments'];

function _typeof(value) {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  let type = typeof(value), ctor, name;
  if (type === 'object') {
    if (Array.isArray(value)) return 'array';
    if ((ctor = value.constructor) && (name = ctor.name))
      return name.toLowerCase();
  } else if (type === 'function') {
    if (!value.hasOwnProperty('arguments') && value.hasOwnProperty('prototype'))
      return 'class';
  }
  return type;
}
