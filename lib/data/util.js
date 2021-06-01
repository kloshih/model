

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

/**
 * 
 * @param {object} target The target of the merge
 * @param  {...any} args Additional arguments
 */
function _merge(target, ...args) {
  target || (target = {});
  let depth = 0;
  for (let i = 0, ic = args.length; i < ic; i++) {
    if (_typeof(args[i]) === 'object')
      merge(target, args[i]);
  }
  return target;
  function merge(a, b) {
    for (let k in b) {
      if (!b.hasOwnProperty(k)) continue;
      let bv = b[k];
      if (bv == null) {
        delete(a[k]);
      } else {
        let av = a[k];
        const at = _typeof(av), bt = _typeof(bv);
        if (at === 'object' && at === 'object') {
          try {
            if (depth++ == 0)
              av = a[k] = _clone(av, true);
            merge(av, bv);
          } finally {
            depth--;
          }
        } else {
          a[k] = bv;
        }
      }
    }
  }
}

/**
 * Returns
 * @param {any} item Item 
 * @param {string} keypath The key path
 * @returns The value for the given key
 */
function kv(item, keypath) {
  if (item == null) return null;
  if (keypath == null) return item;
  let kveval = kvevals[keypath];
  if (!kveval) {
    const keys = keypath.split('.');
    body = [];
    keys.forEach(key => {
      if (key.length == 0) return;
      if (key.match(/^\d+$/)) {
        body.push(`vl = vl[${key}]; if (vl == null) return vl;\n`);
      } else {
        key = "'" + key.replace("'", "\\'") + "'";
        body.push(`vl = Array.isArray(vl) ? vl.map(v => v[${key}]) : vl[${key}]; if (vl == null) return vl;\n`);
      }
    })
    body.push('return vl;\n')
    kveval = new Function('vl', body.join(''));
    kvevals[keypath] = kveval;
  }
  return kveval(item);
}
const kvevals = {};

kv.set = function kvset(item, keypath, value) {
  if (item == null) return null;
  if (keypath == null) return value;
  if (!~keypath.indexOf('.')) return item[keypath] = value;
  const keys = keypath.split('.');
  for (let it = item, k = 0, kc = keys.length - 1; k <= kc; k++) {
    let key = keys[k];
    if (k < kc) {
      it = it[key] || (it[key] = {});
    } else {
      it[key] = value;
    }
  }
  return value;
}


/**
 * Returns the superclass of *cls*
 * @param {class} c The class or constructor
 * @returns {class} The superclass or null
 */
function superclass(cls) {
  const proto = Object.getPrototypeOf(cls.prototype);
  return proto ? proto.constructor : undefined;
}


module.exports = {
  _typeof,
  _merge,
  superclass,
  kv
};