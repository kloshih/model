


class List extends Array {

  static get [Symbol.species]() { return Array }

  constructor(...args) {
    super(...args);
    this[kDepth] = 0;
    this[kChanges] = [];
  }

  pop() {
    return this.length == 0 ? undefined : this.splice(this.length - 1, 1)[0];
  }

  push(...items) {
    return this.splice(this.length, 0, ...items), this.length;
  }

  shift() {
    return this.length == 0 ? undefined : this.splice(0, 1)[0];
  }

  unshift(...items) {
    return this.splice(0, 0, ...items), this.length;
  }

  remove(...items) {
    try {
      this._begin();
      items.forEach(item => {
        const index = this.indexOf(item);
        if (~index) this.splice(index, 1);
      })
      return this.length
    } finally {
      this._end();
    }
  }

  mark() {
    return new Mark(this);
  }

  splice(start, deleteCount, ...items) {
    try {
      this._begin();
      this.slice(start, start+deleteCount).forEach(item => this._delete(item));
      items.forEach(item => this._insert(item))
      super.splice(start, deleteCount, ...items);
      this._end();
    } catch (error) {
      this._rollback();
      throw error;
    }
  }

  reverse() {
    return super.reverse();
  }

  sort() {
    return super.sort();
  }

  copyWithin(target, start, end) {
    throw new Error("IMPL");
  }

  _begin() {
    if (this[kDepth]++ === 0) {
      // first change
    }
  }

  _end() {
    if (--this[kDepth] === 0) {
      // last change
      // console.log("list: changes: ", this[kChanges].join(', '))
      this[kChanges].length = 0;
    } else if (this[kDepth] < 0) {
      throw new Error("IMPL")
    }
  }

  _rollback() {
    if (--this[kDepth] === 0) {
      // last change
      console.log("list: rollback changes: ", this[kChanges])
      this[kChanges].length = 0;
    } else if (this[kDepth] < 0) {
      throw new Error("IMPL")
    }
  }

  _insert(item) {
    this[kChanges].push(['i', item]);
    List.observe(item, this, this._update);
  }

  _update(item, old) {
    this[kChanges].push(['u', item, old]);
  }
  
  _delete(item) {
    this[kChanges].push(['d', item]);
    List.unobserve(item, this, this._update);
  }


  /* Observation */

  static observe(item, observer, method) {
    if (typeof(item) !== 'object')
      return;
    let set = watchers.get(item);
    if (!set) watchers.set(item, set = []);
    set.push([observer, method]);
  }

  static unobserve(item, observer, method) {
    if (typeof(item) !== 'object')
      return;
    let set = watchers.get(item);
    if (!set) return;
    for (let i = 0, ic = set.length; i < ic; i++) {
      if (set[i][0] === observer && (!method || set[i][1] === method))
        set.splice(i, 1), i--, ic--;
    }
  }

  static observers(item) {
    return watchers.get(item);
  }

  static emit(item, old) {
    if (typeof(item) !== 'object')
      return;
    let set = watchers.get(item);
    if (!set) return;
    for (let i = 0, ic = set.length; i < ic; i++) {
      let [observer, method] = set[i];
      method.call(observer, item, old)
    }
  }

}
module.exports = List;

const kDepth = Symbol('kDepth');
const kChanges = Symbol('kChanges');

const watchers = new WeakMap()

class Mark {

  constructor(list) {
    this.list = list;
    this.items = this.list.slice();
  }

  clear(item) {
    const index = this.items.indexOf(item);
    if (~index)
      this.items.splice(index, 1)
  }
  
  sweep() {
    this.items.forEach(item => this.list.remove(item))
  }

}
List.Mark = Mark;