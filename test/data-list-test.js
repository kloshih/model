

// const { it } = require('mocha')
const { expect } = require('chai');

const List = require('../lib/data/list')

describe("List", () => {

  describe("Basic functionality", () => {

    it("can be an array", () => {
      const list = new List();
      expect(list).to.be.an('array');
    })

    it("can be created with a dimension", () => {
      const list = new List(1);
      expect(list).to.deep.equal([ undefined ]);
    })

    it("can take a single item", () => {
      const list = new List();
      list.push(1);
      expect(list).to.deep.equal([1]);
    })

    it("can take multiple items", () => {
      const list = new List();
      list.push(1);
      list.push(2);
      list.remove(2);
      list.push(3, 4, 5)
      expect(list).to.deep.equal([1, 3, 4, 5]);
    })

  })

})
