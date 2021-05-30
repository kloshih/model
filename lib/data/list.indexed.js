
const List = require('./list')
const { kv } = require('./util');


class IndexedList extends List {

  constructor(opts) {
    super();
    this[kOpts] = opts || {};
    this[kIndexes] = {};
    this[kUniqueIndex] = null;
    if (this[kOpts].indexes) {
      for (let key in this[kOpts].indexes)
        this.index(key, {unique:!!this[kOpts].indexes[key]})
    }
  }

  index(key, opts) {
    const unique = opts && opts.unique;
    let index = this[kIndexes][key];
    if (index) return index;
    index = this[kIndexes][key] = new Index(this, key, opts);
    if (unique && !this[kUniqueIndex]) {
      this[kUniqueIndex] = index;
      if (index.length == 1)
        index.identity = this[kOpts].identity;
    }
    return index;
  }

  includes(item, from) {
    if (this[kUniqueIndex]) {
      return this[kUniqueIndex].includes(item);
    } else {
      return super.includes(item, from)
    }
  }

  get(key, val) {
    const argcount = arguments.length;
    if (argcount == 1) {
      if (!this[kUniqueIndex]) throw new Error("No unique index")
      return this[kUniqueIndex].get(key)
    }
    if (argcount > 2)
      [, ...val] = arguments;
    return this.index(key).get(val);
  }

  all(key, val) {
    return this.index(key).all(val);
  }

  map(key) {
    if (typeof(key) === 'string')
      return this.index(key).map;
    return super.map(key);
  }

  _insert(item) {
    super._insert(item)
    for (let key in this[kIndexes]) {
      this[kIndexes][key]._insert(item);
    }
  }

  _update(item, old) {
    super._update(item, old)
    for (let key in this[kIndexes]) {
      this[kIndexes][key]._update(item, old);
    }
  }

  _delete(item) {
    super._delete(item)
    for (let key in this[kIndexes]) {
      this[kIndexes][key]._delete(item);
    }
  }

}

const kOpts = Symbol('kOpts');
const kIndexes = Symbol('kIndexes');
const kUniqueIndex = Symbol('kUniqueIndex');

class Index {

  constructor(list, key, opts) {
    this.list = list;
    this.opts = opts || {};
    this.unique = !!this.opts.unique;
    this.key = key;
    this.keys = key.split(',');
    this.length = this.keys.length;
    this.identity = false;
    this.map;
    this.rebuild();
  }

  rebuild() {
    this.map = {};
    for (let i = 0, ic = this.list.length; i < ic; i++) {
      const item = this.list[i];
      const ikey = this.itemKey(item);
      if (this.unique) {
        if (this.map[ikey] != null) throw new Error(`Duplicate item (${this.key}='${ikey}', item:${item})`)
        this.map[ikey] = item;
      } else {
        const set = this.map[ikey] || (this.map[ikey] = new List());
        set.push(item);  
      }
    }
  }

  itemKey(item, old) {
    const count = this.length;
    switch (count) {
      case 1:
        return kv((old && this.key in old) ? old : item, this.key)
        // return (old && this.key in old) ? kv(old, this.key) : kv(item, this.key);
      case 2:
        const v0 = kv((old && this.keys[0] in old) ? old : item, this.keys[0]);
        const v1 = kv((old && this.keys[1] in old) ? old : item, this.keys[1])
        if (v0 == null || v1 == null) return null;
        return v0.concat('%', v1);
      default:
        const ikey = Array(count);
        for (let i = 0; i < count; i++) {
          const v = kv((old && this.keys[i] in old) ? old : item, this.keys[i]);
          if (v == null) return null;
          ikey[i] = v;
        }
        return ikey.join('%');
    }
  }

  includes(item) {
    const ikey = this.itemKey(item);
    if (this.unique) {
      return this.map[ikey] !== null;
    } else {
      let set = this.map[key];
      return set && set.includes(item);
    }
  }

  get(value) {
    const ikey = this.length == 1 ? value : value.join('%')
    if (this.unique) {
      return this.map[ikey];
    } else {
      let set = this.map[ikey];
      return set && set[0];
    }
  }

  all(value) {
    const ikey = this.length == 1 ? value : value.join('%')
    if (this.unique) {
      let item = this.map[ikey];
      return item ? [item] : [];
    } else {
      return this.map[ikey];
    }
  }

  _insert(item) {
    const ikey = this.itemKey(item);
    if (ikey == null)
      return;
    if (this.unique) {
      if (this.map[ikey] != null)
        throw new Error(`Duplicate item (${this.key}='${ikey}', item:${item})`)
      this.map[ikey] = item;
      if (this.identity && !reserved[ikey])
        this.list[ikey] = item;

    } else {
      const set = this.map[ikey] || (this.map[ikey] = new List());
      set.push(item);
    }
  }

  _update(item, old) {
    const okey = this.itemKey(item, old);
    const ikey = this.itemKey(item);
    if (okey != ikey) {
      if (this.unique) {
        if (okey !== null && this.map[okey] === item) {
          delete(this.map[okey]);
          if (this.identity && !reserved[okey] && this.list[okey] == item)
            delete(this.list[okey]);
        }
        if (ikey !== null) {
          if (this.map[ikey] != null) throw new Error(`Duplicate item (${this.key}='${ikey}', item:${item})`)
          this.map[ikey] = item;
          if (this.identity && !reserved[ikey])
            this.list[ikey] = item;
        }
      } else {
        if (okey != null) {
          const oset = this.map[okey];
          oset.remove(item);
        }
        if (ikey != null) {
          const iset = this.map[ikey] || (this.map[ikey] = new List());
          iset.push(item);
        }
      }
    }
  }

  _delete(item) {
    const okey = this.itemKey(item);
    if (okey == null) return;
    if (this.unique) {
      if (this.map[okey] === item) {
        delete(this.map[okey]);
        if (this.identity && !reserved[okey] && this.list[okey] == item)
          delete(this.list[okey]);
      }
    } else {
      const oset = this.map[okey];
      oset.remove(item);
    }
  }

}
module.exports = IndexedList;

const reserved = {};
for (let c = IndexedList; c !== Object; c = Object.getPrototypeOf(c)) {
  Object.getOwnPropertyNames(c.prototype).forEach(k => reserved[k] = true);
  if (c === Array) break;
}

