

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

module.exports = {
  _typeof,
  kv
};