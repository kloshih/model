const { gen } = require("./gen");
const { _typeof, kv } = require("./util");

/**
 * 
 * @since  1.0
 * @author Lo Shih <kloshih@gmail.com>
 * @copyright Copyright 2021 Lo Shih 
 */
const json = module.exports = {

  /**
   * Creates a parser for a parsing the *target* from the given *doc*. 
   * @param {object} target The object to parse
   * @param {object} doc The JSON object to parse
   * @param {object} opts Options
   * @returns The parser
   */
  parser(target, doc, opts={}) {
    return new Parser(target, doc, opts)
  },

  /**
   * Creates a formatter for a formatting the *target* into the given *doc*. 
   * 
   * ```js
   * let pet = ...;
   * pet.name = 'Jack';
   * pet.breed = 'Terrier';
   * pet.owner = new Person('Julie');
   * pet.toys = [{type:'ball', color:'green'}, {type:'rope', color:'red'}];
   * const formatter = json.formatter(pet, null);
   * formatter.value('name', 'string!')
   * formatter.value('breed', 'string');
   * formatter.one('owner', Person);
   * formatter.many('toys', Toy);
   * ```
   * 
   * @param {object} target The object to parse
   * @param {object} doc The JSON object to format into or `null` 
   * @param {object} opts Options
   * @returns The formatter 
   */
  formatter(target, doc, opts) {
    return new Formatter(target, doc, opts);
  },

  validator(target, opts) {
    return new Validator(target, opts);
  },

  coerce(value, type, def) {
  },

  types: {
    'base':           { required:false, array:false, type:null,
      _parse(d)       { if (d == null && !this.required) return null;
                        if (this.array) {
                          if (Array.isArray(d)) {
                            const ary = Array(d.length);
                            for (let i = 0, ic = d.length; i < ic; i++)
                              ary[i] = this.parse(d[i], _typeof(d[i]))
                            return ary
                          } else {
                            return [this.parse(d, _typeof(d))];
                          }
                        } else {
                          return this.parse(d, _typeof(d));
                        }
                      },
      // _parse$gen(d)   {
      //                   if (this.required) 
      //                     gen.code(`if (${d.k} == null) throw "required"`);
      //                   if (this.array) {
      //                     gen.code(`
      //                       const ary = ${d.k};
      //                       if (Array.isArray(ary)) {
      //                         const res = Array(ary.length);
      //                         for (let i = 0, ic = ary.length; i < ic; i++){
      //                           res[i] = ${gen.call(this, 'parse$gen', 
      //                               {'ary[i]':'ary[i]', '_typeof(ary[i])':'_typeof(ary[i])'})};
      //                         }
      //                         return res;
      //                       } else {
      //                         return [${gen.call(this, 'parse$gen', {ary:'ary', '_typeof(ary)':'_typeof(ary)'})}];
      //                       }
      //                     `);
      //                   } else {
      //                     gen.code(`${gen.call(this, 'parse$gen', {[d.k]:d.k, ['_typeof('+d.k+')']:'_typeof('+d.k+')'})}`)
      //                   }
      //                 },
      _format(v)      { if (v == null && !this.required) return null;
                        if (this.array) {
                          if (Array.isArray(v)) {
                            const ary = Array(v.length);
                            for (let i = 0, ic = v.length; i < ic; i++)
                              ary[i] = this.format(v[i], _typeof(v[i]))
                            return ary
                          } else {
                            return [this.format(v, _typeof(v))];
                          }
                        } else {
                          return this.format(v, _typeof(v));
                        }
                      },
      _validate(v)    { if (v == null && !this.required) return;
                        if (this.array) {
                          if (Array.isArray(v)) {
                            let vs;
                            for (let i = 0, ic = v.length; i < ic; i++) {
                              const err = this.validate(v[i], _typeof(v[i]))
                              if (err)
                                (vs||(vs=[])).push({ value:v[1], error:err })
                            }
                            return vs
                          } else {
                            const err = this.validate(v, _typeof(v));
                            return err && [{ value:v, error:err }];
                          }
                        } else {
                          return this.validate(v, _typeof(v));
                        }
                      },
      _match(s)       { if (!this.matcher) return s;
                        let [regexp, ...keys] = this.matcher;
                        let m = s.match(regexp), v = {}; 
                        if (!m) {
                          const tokens = keys.map(k => '<' + k + '>');
                          const format = regexp.source.replace(/\([^\(\)]*\)/g, () => tokens.shift()).replace(/\(\?:(.*?)\)\?/g, '[$1]').replace(/(?<!\\)\./g, '*').replace(/\\|\^|\$/g, '');
                          throw new Error(`unrecognized ${this.name}, '${s}', must be of the format: ${format}`);
                        }
                        return true;
                        // return keys.forEach((key, i) => v[key] = m[i + 1]), v;
                      },
    },
    'any':            { type:'any',
      parse(d, t)     { return d },
      format(v, t)    { return v },
      validate(v, t)  { },
    },
    'string':         { type:'string',
      parse(d, t)     { return t == 'string' ? d : String(d) },
      format(v, t)    { return t == 'string' ? v : String(v) },
      validate(v, t)  { if (t != 'string') return 'invalid' }
    },
    'string!':        { base:'string', required:true },
    'string*':        { base:'string', array:true },

    /* Number types */
    'number':         { type:'number',
      parse(d, t)     { if (t == 'number') return d; const v = Number(d); 
                        if (isNaN(v)) throw new Error('NaN');
                        return v 
                      },
      format(v, t)    { if (t == 'number') return v; const d = Number(v); 
                        if (isNaN(v)) throw new Error('NaN');
                        return v 
                      },
      validate(v, t)  { if (t != 'number' || isNaN(Number(v)))
                          return 'invalid' 
                      }
    },
    'number!':        { base:'number', required:true },
    'number*':        { base:'number', array:true },
    'int':            {
      parse(d, t)     { if (t == 'number') return parseInt(d); const v = parseInt(d); 
                        if (isNaN(v)) throw new Error('NaN');
                        return v
                      },
      format(v, t)    { if (t == 'number') return parseInt(v); const d = parseInt(v); 
                        if (isNaN(v)) throw new Error('NaN');
                        return v
                      },
      validate(v, t)  { if (t != 'number' || isNaN(Number(v)))
                          return 'invalid' 
                      }
    },
    'int!':           { base:'int', required:true },
    'int*':           { base:'int', array:true },
    'float':          {
      parse(d, t)     { if (t == 'number') return d; const v = parseFloat(d); 
                        if (isNaN(v)) throw new Error('NaN');
                        return v
                      },
      format(v, t)    { if (t == 'number') return v; const d = parseFloat(v); 
                        if (isNaN(v)) throw new Error('NaN');
                        return v
                      },
      validate(v, t)  { if (t != 'number' || isNaN(Number(v)))
                          return 'invalid' 
                      }
    },
    'float!':         { base:'float', required:true },
    'float*':         { base:'float', array:true },

    'boolean':        {
      parse(d, t)     { if (t == 'boolean') return d;
                        if (t == 'number') return !!d;
                        if (t == 'string' && d.match(/^(n(o)|f(alse)|0)$/i))
                          return false;
                        if (t == 'string' && d.match(/^(y(es)|t(rue)|1)$/i))
                          return true;
                        throw new Error('not-a-boolean');
                      },
      format(v, t)    { return !!v; },
      validate(v, t)  { if (t != 'boolean') return 'invalid' }
    },
    'boolean!':       { base:'boolean', required:true },
    'boolean*':       { base:'boolean', array:true },
    'bool':           { base:'boolean' },
    'bool!':          { base:'boolean!' },
    'bool*':          { base:'boolean*' },

    /* Date types */
    'date':           {
      parse(d, t)     { if (t == 'date') return d; const v = new Date(d); 
                        if (isNaN(v)) throw new Error('NaN');
                        return v
                      },
      format(v, t)    { if (t == 'date') return d.toISOString();
                        throw new Error("not a date");
                      },
      validate(v, t)  { if (t != 'date' || isNaN(Number(v)))
                          return 'invalid' 
                      }
    },
    'date!':          { base:'date', required:true },
    'date*':          { base:'date', array:true },
    'time':           { base:'int' },
    'time!':          { base:'time', required:true },

    /* Composed types */
    'url':            { 
      matcher:        [ /^(?:([\w\+-]+):)?(?:(?:(?:\/\/(?:([^\|\/:@\?\#]+)?(?::([^\|\/:@\?\#]+))?@)?([^\|\/\?\#]+)?)?(\/[^\|\?#]*)?|([^\|\?\#]+))(?:\?([^\|#]*)?)?(?:#([^\|]*)?)?)?(?:\|(.*))?$/, 'scheme', 'user', 'pass', 'hosts', 'path', 'opaque', 'query', 'fragment', 'next'],
      parse(d, t)     { if (t !== 'string') throw new Error("invalid");
                        if (!this.match(d)) throw new Error("malformed");
                        return d
                      },
      format(v, t)    { return v;
                      },
      validate(v, t)  { if (t != 'string' || !this.match(v)) return 'invalid'
                      }
    },
    'url!':           { base:'url', required:true },
    'url*':           { base:'url', array:true },
    'uri':            { base:'url' },
    'uri!':           { base:'url!' },
    'uri*':           { base:'url*' },
    'semver':         { 
      matcher:        [ /^(\d+)\.(\d+)\.(\d+)(?:-([\w-]+))?(?:\+([\w-]+))?$/,
                        'major', 'minor', 'patch', 'prerelease', 'build'],
      parse(d, t)     { if (t !== 'string') throw new Error("invalid");
                        if (!this._match(d)) throw new Error("malformed");
                        return d
                      },
      format(v, t)    { return v;
                      },
      validate(v, t)  { if (t != 'string' || !this._match(v)) return 'invalid'
                      }
    },
    'semver!':        { base:'semver', required:true },
    'semver*':        { base:'semver', array:true },
    'semverspec':     { base:'string' },
    'semverspec!':    { base:'semverspec', required:true },
    'semverspec*':    { base:'semverspec', array:true },
    'class':          { 
      parse(d, t)     { 
                        if (t == 'class') return d;
                        if (t !== 'string')
                          throw new Error("invalid class: " + d);
                        /* try to resolve the class */
                        return d
                      },
      format(v, t)    { 
                        if (t == 'class') return v.name;
                        if (t == 'string') return v;
                          throw new Error("invalid class: " + v);
                      },
      validate(v, t)  { if (t != 'class' && t != 'string') return 'invalid'
                      }
    },
    'class!':         { base:'class', required:true },
    'class*':         { base:'class', array:true },
    'object':          { 
      parse(d, t)     { 
                        if (t == 'object') return d;
                          throw new Error("invalid object: " + d);
                      },
      format(v, t)    { if (t == 'object') return d;
                          throw new Error("invalid object: " + v);
                      },
      validate(v, t)  { if (t != 'object' && t != 'string') return 'invalid'
                      }
    },
    'object!':        { base:'object', required:true },
    'object*':        { base:'object', array:true },
    '[string]:class': { 
      parse(d, t)     { 
                        return d
                      },
      format(v, t)    { let d = {}; 
                        for (let k in v) 
                          d[k] = json.types.class._format(v[k]);
                        return d;
                      },
      validate(v, t)  { if (t != 'object') return 'invalid'
                      }
    },


  },
  
};

function initTypes() {
  const types = json.types
  types.base.resolved = true;
  for (let name in types)
    types[name].name = name;
  for (let name in types)
    resolve(types[name]);
  function resolve(type) {
    if (type.resolved) return;
    let baseName = type.base || 'base', base = types[baseName];
    if (!base) throw new Error(`IMPL: no base named ${baseName}`);
    resolve(base);
    for (let key in base)
      if (!(key in type)) type[key] = base[key];
    type.resolved = true /* not necesary */;
    return type;
  }
}
initTypes();

/**
 * 
 */
class Parser {

  constructor(target, doc, { complete }) {
    this.target = target;
    this.typeName = this.target.constructor.name;
    this.doc = doc;
    this.rest = Object.assign({}, this.doc);
    this.complete = complete;
  }

  coerce(value, type) {
    throw "DEPRECATED";
    if (!type) return value;
    let [_, datatype, req] = type.match(/^(.*?)(\!|\?|\*|\+)?$/)
    const valuetype = _typeof(value);
    if (datatype === valuetype) return value;
    switch (datatype) {
      case 'number': 
      case 'int':
      case 'string':
    }
    return value;
  }

  value(key, typename, opts={}) {
    delete(this.rest[key]);
    const dockey = opts.json || key, docval = kv(this.doc, dockey);
    const type = json.types[typename];
    if (!type) throw new Error(`Type not supported: ${typename}`);
    if (docval !== undefined) 
      this.target[key] = type._parse(docval);
    else if (opts.key && this.doc.$key)
      this.target[key] = type._parse(this.doc.$key);
    else if (opts.implicit && this.doc.$implicit)
      this.target[key] = type._parse(this.doc.$implicit);
    else if (this.target[key] == null && opts.default)
      this.target[key] = type._parse(opts.default);
    else if (this.target[key] == null && this.complete || type.required)
      throw new Error(this.typeName + "'s " + key + " is required");
    return this
  }

  one(key, type, opts) {
    delete(this.rest[key]);
    let subdoc = this.doc[key];
    if (!subdoc) return this;
    if (_typeof(subdoc) !== 'object') subdoc = {$implicit:subdoc};
    type.normalizeConfig && (subdoc = type.normalizeConfig(subdoc));
    this.target[key] 
        = type.create ? type.create(subdoc, this.target) 
        : type.provider ? type.provider(subdoc, this.target) 
        : opts && opts.provider ? opts.provider(subdoc, this.target)
        : new type(subdoc, this.target);
    return this
  }

  many(key, type, opts={}) {
    delete(this.rest[key]);
    let list = this.target[key];
    if (!list) { /* If there's no keyProp, we have nothing to key, use array */
      list = this.target[key] = opts.key ? {} : [];
    }
    const doc = this.doc[key];
    if (!doc)
      return;
    const entries = Array.isArray(doc) ? doc.map(it => [null, it]) : Object.entries(doc);
    if (entries.length == 0)
      return;
    for (let i = 0, ic = entries.length; i < ic; i++) {
      let [subkey, subdoc] = entries[i];
      if (_typeof(subdoc) !== 'object') subdoc = {$implicit:subdoc};
      if (subkey) subdoc.$key = subkey;
      type.normalizeConfig && (subdoc = type.normalizeConfig(subdoc));
      if (opts.impls) {
        const { key, map } = opts.impls, val = subdoc[key];
        const impl = map[val];
        if (!impl) throw new Error(`Can't determine best impl for ${type.name} based on ${key} for ${val}`);
        type = impl;
      }
      let sub 
          = type.create ? type.create(subdoc, this.target) 
          : type.provider ? type.provider(subdoc, this.target)
          : opts.provider ? opts.provider(subdoc, this.target)
          : new type(subdoc, this.target);
      if (Array.isArray(list)) {
        list.push(sub);
      } else {
        !subkey && opts.key && (subkey = sub[opts.key]);
        !subkey && (subkey = i);
        list[subkey] = sub;
      }
    }
    return this
  }

  done() {
    return this.target;
  }
  
  // gen_constructor(gen, target, doc) {
  //   gen.code(`const target = ${target}, 
  //                   typeName = ${target}.constructor.name,
  //                   doc = ${doc}, 
  //                   rest = Object.assign({}, doc);`);
  // }

  // gen_value(gen, key, typename, opts) {
  //   gen.code(`delete(rest.${key.v});`);
  //   gen.code(`const dockey = ${gen.quote(opts.v.json, key)},
  //         docval = ${gen.call(kv.kv_gen(gen, 'doc', opts.json || key))}`);
  //   const type = json.types[typename.v];
  //   if (!type) throw new Error(`Type not supported: ${typename.v}`);
  //   gen.code(`if (docval !== undefined)
  //       target.${key} = ${gen.call(type, '_parse_gen', {docval:'docval'})};`);
  //   if (opts.key) {
  //     gen.code(`else if (doc.$key) 
  //         target.${key} = ${gen.call(type, '_parse_gen', {'doc.$key':'doc.$key'})}`);
  //   }
  //   if (opts.implicit) {
  //     gen.code(`else if (doc.$implicit) 
  //         target.${key} = ${gen.call(type, '_parse_gen', {'doc.$implicit':'doc.$implicit'})}`);
  //   }
  //   if (opts.default) {
  //     gen.code(`else if (target.$key == null) 
  //         target.${key} = ${gen.quote(opts.default)}`);
  //   } else if (type.required) {
  //     gen.code(`throw new Error("${typeName}'s ${key} is required");`);
  //   }
  // }

  // gen_done(gen) {
  // }


}

/**
 * 
 */
 class Formatter {

  constructor(target, doc, owner) {
    this.target = target;
    this.typeName = this.target.constructor.name;
    this.doc = doc;
    this.owner = owner;
    // this.opts = opts;
  }

  coerce(value, type) {
    if (!type) return value;
    let [_, datatype, req] = type.match(/^(.*?)(\!|\?|\*|\+)?$/)
    const valuetype = _typeof(value);
    if (datatype === valuetype) return value;
    switch (datatype) {
      case 'number': 
      case 'int':
      case 'string':
    }
    return value;
  }

  value(key, typename, opts={}) {
    if (opts.implicit) this.implicit = key;
    if (opts.key) this.key = key;
    const type = json.types[typename];
    const dockey = opts.json || key;
    if (this.target[key] !== undefined) {
      let value = type._format(this.target[key]);
      if (!opts || opts.default !== value)
        kv.set(this.doc, dockey, value);
    }
    return this
  }

  one(key, type, opts) {
    let item = this.target[key];
    if (!item)
      return;
    let subdoc = {};
    if (item.format) {
      subdoc = item.format(this.target)
    } else if (item.toJSON) {
      subdoc = item.toJSON(this.target);
    } else {
      throw new Error("Cannot get JSON from: " + item);
    }
    this.doc[subdoc.$key || key] = subdoc.$implicit || subdoc;
    return this;
  }

  many(key, type, opts) {
    // object or array?, let's go with object
    const doc = opts.key ? {} : [];
    const list = this.target[key];
    const entries = Array.isArray(list) ? list.map(it => [null, it]) : Object.entries(list);
    if (entries.length == 0)
      return;
    for (let i = 0, ic = entries.length; i < ic; i++) {
      let [subkey, item] = entries[i];
      let subdoc;
      if (item.format) {
        subdoc = item.format(this.target)
      } else if (item.toJSON) {
        subdoc = item.toJSON(this.target)
        if (!subdoc) throw new Error(`${item.constructor.name}.toJSON() did not return a doc`);
      } else {
        throw new Error("Cannot get JSON from: " + item);
      }
      if (subdoc.$key) subkey = subdoc.$key, delete(subdoc.$key);
      if (subdoc.$implicit) subdoc = subdoc.$implicit;
      if (Array.isArray(doc))
        doc.push(subdoc)
      else
        doc[subkey] = subdoc;
    }
    this.doc[key] = doc;
    return this
  }

  done() {
    if (this.owner) {
      if (this.key) {
        if (this.doc[this.key] != null) {
          this.doc.$key = this.doc[this.key];
          delete(this.doc[this.key]);
        }
      }
      if (this.implicit) {
        const keys = Object.keys(this.doc).filter(k => k != '$key' && k != this.implicit);
        if (keys.length == 0) {
          this.doc.$implicit = this.doc[this.implicit];
          delete(this.doc[this.implicit]);
        }
      }
    }
    return this.doc;
  }
  
}

class Validator {

  constructor(target, owner, opts) {
    this.target = target;
    this.typeName = this.target.constructor.name;
    this.owner = owner;
    this.opts = opts;
    this.errors = null;
  }

  value(key, typename, opts) {
    const type = json.types[typename];
    if (!type) throw new Error(`Type not supported: ${typename}`);
    const value = this.target[key];
    const error = type._validate(value);
    if (error)
      (this.errors || (this.errors = {}))[key] = { value, error, type:typename };
    return this;
  }

  one(key, type, opts) {
  }

  many(key, type, opts) {
  }

  done() {
    if (this.errors) {
      const msg = [`Validation failed for ${this.target}`];
      for (let key in this.errors) {
        let error = this.errors[key];
        msg.push(`${key} (${error.type}) is ${error.error}: ${error.value}`)
      }
      throw new ValidationError(msg.join(', '), { this:this, errors:this.errors });
    }
    return this
  }
  
}

class ValidationError extends Error {

  constructor(message, errors) {
    super(message);
    this.errors = errors;
  }

}