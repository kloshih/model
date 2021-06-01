
const { expect } = require('chai');
const log = require('logsync')

const Type = require('../lib/model/type');
const Model = require('../lib/model');
const ResourceUsage = require('./fixtures/resource-usage');

describe("Model", () => {

  describe("Working with a class-less type", () => {

    it("can generate a type", () => {

      let doc = ResourceUsage.capture();
      log('info', "#wh[resource usage: #gr[%s]]", doc);

      const usage = new ResourceUsage(doc);
      const doc2 = usage.toJSON();
      expect(doc2).to.be.deep.equal(doc);
      // const type = ResourceUsage.type();
      // expect(type).to.be.an('object');


      // let count = 1000;
      // let time = process.hrtime.bigint();
      // for (let i = 0, ic = 1000; i < ic; i++) {
      //   const usage = new ResourceUsage(doc);
      //   const doc2 = usage.toJSON();
      // }
      // time = Number(process.hrtime.bigint() - time) / 1e6;
      
      // log('info', "#wh[parse and formatted #gr[%s]ms]", time / count);

    })

  })

})
