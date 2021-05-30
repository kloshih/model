
const { _typeof, kv } = require('./util');

const IndexedList = require('./list.indexed')

/**
 * The TypedList
 */
class TypedList extends IndexedList {

  constructor(type, owner, key) {
    super();
    this.type = type; // _typeof(type) == 'class' ? Type.of(type) : type;
    this.owner = owner;
    this.key = key;

    /* Defines */
  }

  
 
}
module.exports = TypedList;

