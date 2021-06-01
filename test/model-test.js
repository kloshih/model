
const { expect } = require('chai');

const Type = require('../lib/model/type');
const Model = require('../lib/model')

describe("Model", () => {

  // class Animal {
  //   static get props() {
  //     return {
  //       name: { key:'string' },
  //       gender: { enum:['female', 'male'] },
  //     }
  //   }
  // }

  // class Dog extends Animal {
  //   static get props() {
  //     return {
  //       breed: { type:'string' },
  //     }
  //   }
  // }

  describe("Parsing JSON", () => {

    it("can create a model from a config", () => {
      let model = new Model({
        name: 'pets',
        version: '1.0.0',
        dependencies: {
          'people': '^1.0.0',
        },
        types: {
          'Person':       {props:{
            'name':       {type:'string'},
            'pets':       {many:'Pet'},
          }},
          'Pet':          {props:{
            'name':       {type:'string'},
          }},
        }
      })
      expect(model).to.have.property('name', 'pets');
      expect(model).to.have.property('version', '1.0.0');

      const people = model.dependency('people');
      expect(people).to.have.property('name', 'people');
      expect(people).to.have.property('version', '^1.0.0');

      const person = model.type('Person');
      expect(person).to.have.property('name', 'Person');

      const personName = person.prop('name');
      expect(personName).to.have.property('name', 'name');
      expect(personName).to.have.property('kind', 'value');
      expect(personName).to.have.property('type', 'string');

      const personPets = person.prop('pets');
      expect(personPets).to.have.property('name', 'pets');
      expect(personPets).to.have.property('kind', 'many');
      expect(personPets).to.have.property('type', 'Pet');

      const pet = model.type('Pet');
      expect(pet).to.have.property('name', 'Pet');

      const petName = pet.prop('name');
      expect(petName).to.have.property('name', 'name');
      expect(petName).to.have.property('kind', 'value');
      expect(petName).to.have.property('type', 'string');
    })

    it("can format a parsed model", () => {
      let model = new Model({
        name: 'pets',
        version: '1.0.0',
        dependencies: {
          'people': '^1.0.0',
        },
        types: {
          'Person':       {props:{
            'name':       {type:'string'},
            'pets':       {many:'Pet'},
          }},
          'Pet':          {props:{
            'name':       {type:'string'},
          }},
        }
      })
      const doc = model.toJSON();
      expect(doc).to.deep.equal({
        name: 'pets',
        version: '1.0.0',
        dependencies: {
          'people': '^1.0.0',
        },
        types: {
          'Person':       {props:{
            'name':       {type:'string'},
            'pets':       {kind:'many', type:'Pet'},
          }},
          'Pet':          {props:{
            'name':       {type:'string'},
          }},
        }
      });

    })

  })


  describe("Initialize create models from classes", () => {

    class Person {
      static get props() {
        return {
          name: { key:'string' },
          pets: { many:Pet },
        }
      }
      constructor(config, owner) {
        Type.initialize(this, config, owner);
      }
      toJSON(owner) { return Type.formatJson(this, {}, owner) }
    }
  
    class Pet {
      static get props() {
        return {
          owner: { parent:Person },
          name: { key:'string' },
          gender: { enum:['female', 'male'] },
          type: { type:'string', impls:{'dog':'Dog', 'cat':Cat} },
        }
      }
      constructor(config, owner) {
        Type.initialize(this, config, owner);
      }
      toJSON(owner) { return Type.formatJson(this, {}, owner) }
    }
  
    class Dog extends Pet {
      static get props() {
        return {
          bark: { type:'string' },
        }
      }
    }
  
    class Cat extends Pet {
      static get props() {
        return {
          meow: { type:'string' },
        }
      }
    }

    it("can create a model from a impl classes", () => {
      const model = Model.adhocModelForPackage(__filename);
      model._clear();
      const dogType = Type.type(Dog, {model});
      const personType = Type.type(Person, {model});
      const catType = Type.type(Cat, {model});
      model.resolve();

      const doc = model.toJSON();
      // console.log(JSON.stringify(doc, null, 2));
      expect(doc).to.deep.include({
        name: 'model',
        version: '1.0.0',
        // dependencies: {
        //   'people': '^1.0.0',
        // },
        types: {
          'Person':       {props:{
            'name':       {type:'string', key:true},
            'pets':       {kind:'many', type:'Pet'},
          }},
          'Pet':          {props:{
            'owner':      {kind:'one', type:'Person', parent:true},
            'name':       {type:'string', key:true},
            'gender':     {type:'string', enum:['female','male']},
            'type':       {type:'string', 
                             impls:{dog:'Dog', cat:'Cat'},
                          },
          }},
          'Dog':          {extends:'Pet', props:{
            'bark':       {type:'string'},
          }},
          'Cat':          {extends:'Pet', props:{
            'meow':       {type:'string'},
          }},
        }
      });
      
    })

    it("can parse people and pets", () => {
      const model = Model.adhocModelForPackage(__filename);
      const personType = Type.type(Person, {model});
      const dogType = Type.type(Dog, {model});
      const catType = Type.type(Cat, {model});
      model.resolve();

      const sarah = new Person({
        name: 'Sarah',
        pets: {
          Jack: { type:'dog', gender:'male', bark:'Woof!' },
          Penelope: { type:'cat', gender:'female', meow:'Purr!' },
        }
      });
      expect(sarah).to.be.of.instanceof(Person);
      expect(sarah.pets.Jack).to.be.of.instanceof(Dog);
      expect(sarah.pets.Penelope).to.be.of.instanceof(Cat);

      const doc = sarah.toJSON();
      expect(doc).to.deep.equal({
        name: 'Sarah',
        pets: {
          Jack: { type:'dog', gender:'male', bark:'Woof!' },
          Penelope: { type:'cat', gender:'female', meow:'Purr!' },
        }
      });
    })

  })

})
