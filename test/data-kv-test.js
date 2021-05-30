

// const { it } = require('mocha')
const { expect } = require('chai');

const { kv } = require('../lib/data/util')

describe("kv", () => {

  describe("Basic functionality", () => {

    it("can work with single keys", () => {
      const item = { x:1 };
      expect(kv(item, 'x')).to.be.equal(1);
    })

    it("can work with compound keys", () => {
      const item = { x:{y:2} };
      expect(kv(item, 'x.y')).to.be.equal(2);
    })
 
    it("can work with triple-compound keys", () => {
      const item = { x:{y:{z:3}} };
      expect(kv(item, 'x.y.z')).to.be.equal(3);
    })
 
  })

  describe("Working with arrays", () => {

    it("can work with top array", () => {
      const item = [ 1, 2 ];
      expect(kv(item, '0')).to.be.deep.equal(1);
    })
 
    it("can work with top array plus key", () => {
      const item = [ {x:1}, {x:2} ];
      expect(kv(item, 'x')).to.be.deep.equal([1, 2]);
    })
 
    it("can work with arrays", () => {
      const item = { x:[ {y:1}, {y:2} ] };
      expect(kv(item, 'x.y')).to.be.deep.equal([1, 2]);
    })
 
    it("can work with arrays plus compound keys", () => {
      const item = { x:[ {y:{z:3}}, {y:{z:4}} ] };
      expect(kv(item, 'x.y.z')).to.be.deep.equal([3, 4]);
    })
 
    it("can work with array index keys", () => {
      const item = { x:[ {y:{z:3}}, {y:{z:4}} ] };
      expect(kv(item, 'x.1.y.z')).to.be.deep.equal(4);
    })
 
  })

  describe("Edge cases", () => {

    it("can work null items", () => {
      const item = null;
      expect(kv(item, 'x.1.y.z')).to.be.deep.equal(null);
    })
 
    it("can work null keys", () => {
      const item = { x:1 };
      expect(kv(item, null)).to.be.deep.equal(item);
    })
 
  })

  describe("Performance", () => {

    it("Working with values", () => {
      const count = 10000;
      const item = { x:{y:{z:1}} };
      kv(item, 'x.y.z');
      let time = process.hrtime();
      for (let i = 0; i < count; i++) {
        kv(item, 'x.y.z');
      }
      time = process.hrtime(time);
      console.log("time: " + time.join(', '));
      time = time[0] + time[1]/1e9;
      console.log(`benchmark: ${count} iterations, ${time.toFixed(6)} ms total time, ${(count/time).toFixed(3)} calls/ms, each ${(time/count).toFixed(9)} ms/call`);
    })
 
    it("can work null keys", () => {
      const item = { x:1 };
      expect(kv(item, null)).to.be.deep.equal(item);
    })
 
  })

})
