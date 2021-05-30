
/**
 * 
 * @since  1.0
 * @author Lo Shih <kloshih@gmail.com>
 * @copyright Copyright 2021 Lo Shih 
 */
module.exports = {

  parser(target, doc, opts={}) {
    return new Parser(target, doc, opts)
  },

  formatter(target, doc, opts) {
    return new Formatter(target, doc, opts);
  },

  coerce(value, type, def) {
  },
  
};

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
    if (!type) return value;
    let [_, datatype, req] = type.match(/^(.*?)(\!|\?|\*|\+)?$/)
    const valuetype = typeof(value);
    if (datatype === valuetype) return value;
    switch (datatype) {
      case 'number': 
      case 'int':
      case 'string':
    }
    return value;
  }

  set(key, type, opts={}) {
    delete(this.rest[key]);
    if (this.doc[key] !== undefined) 
      this.target[key] = this.coerce(this.doc[key], type);
    else if (opts.key && this.doc.$key)
      this.target[key] = this.doc.$key;
    else if (opts.implicit && this.doc.$implicit)
      this.target[key] = this.doc.$implicit;
    else if (this.target[key] == null && opts.default)
      this.target[key] = opts.default
    else if (this.target[key] == null && this.complete || type.endsWith('!'))
      throw new Error(this.typeName + "'s " + key + " is required");
    return this
  }

  one(key, type) {
    delete(this.rest[key]);
    let subdoc = this.doc[key];
    if (typeof(subdoc) !== 'object') subdoc = {$implicit:subdoc};
    type.normalizeConfig && (subdoc = type.normalizeConfig(subdoc));
    this.target[key] = type.create ? type.create(subdoc, this) : new type(subdoc, this);
    return this
  }

  many(key, type) {
    delete(this.rest[key]);
    const list = this.target[key] || (this.target[key] = {});
    const doc = this.doc[key];
    if (typeof(doc) == 'object') {
      for (let key in doc) {
        let subdoc = doc[key];
        if (typeof(subdoc) !== 'object') subdoc = {$implicit:subdoc};
        subdoc.$key = key;
        type.normalizeConfig && (subdoc = type.normalizeConfig(subdoc));
        let sub = type.create ? type.create(subdoc, this) : new type(subdoc, this);
        if (Array.isArray(list)) {
          list.push(sub);
        } else {
          list[key] = sub;
        }
      }
    } else if (Array.isArray(doc)) {
      throw new Error("STUBBED")
    }
    return this
  }

  done() {
    return this.target;
  }
  
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
    const valuetype = typeof(value);
    if (datatype === valuetype) return value;
    switch (datatype) {
      case 'number': 
      case 'int':
      case 'string':
    }
    return value;
  }

  set(key, type, opts={}) {
    if (opts.implicit) this.implicit = key;
    if (opts.key) this.key = key;
    if (this.target[key] !== undefined)
      this.doc[key] = this.target[key];
    return this
  }

  one(key, type) {
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

  many(key, type) {
    // object or array?, let's go with object
    const doc = {};
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
      } else {
        throw new Error("Cannot get JSON from: " + item);
      }
      if (subdoc.$key)
        subkey = subdoc.$key, delete(subdoc.$key);
      doc[subkey] = subdoc.$implicit || subdoc;
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