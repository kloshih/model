
// const Model = require("../../lib/model")



// /**
//  * A Person is 
//  * 
//  * @since  
//  */
// class Person {

//   static get type() {
//     return Model.type(this, {
//       props: {
//         name: { key:'string' },
//         pets: { many:'Pet' },
//         info: { type:'json', sql:{column:'x'} },
//       }
//     })
//   }
  
//   constructor(config, owner) {
//     Model.initialize(this, config, owner);
//     // this.constructor.type.initialize(this, config, owner);
//     // this.owner = owner;
//   }

//   toJSON(owner) {
//     return type.of(this).formatJson(owner);
//   }

// }
// module.exports = Person;


// class Record {

//   static get props() {
//     return {
//       'name':     {type:'string'}
//     }
//   }

//   get type() {
//     return this.constructor.type();
//   }
  
//   constructor() {
//     this._type.initialize();
//   }

//   get(key) {
//   }

//   set(key, value) {
//   }

//   add(key, value) {
//   }

//   remove(key, value) {
//   }

// }

// const person;

// type.of(person).initialize(config, owner);

