

// const { it } = require('mocha')
const { expect } = require('chai');

const IndexedList = require('../lib/data/list.indexed');

describe("IndexedList", () => {

  describe("IndexedList with unique indexes", () => {

    it("can be added", () => {
      const list = new IndexedList();
      list.push(
        { name:'Sam', age:30 },
        { name:'Art', age:27 },
        { name:'Kim', age:27 },
        { name:'Cat', age:36 },
        { name:'Tim', age:33 },
        { name:'Pat', age:29 },
      )
      let watchers = IndexedList.observers(list[1]);
      // console.log("watchers: ", watchers);

      list.index('name', {unique:true});
      const kim = list.get('name', 'Kim');
      expect(kim).to.be.deep.equal({ name:'Kim', age:27 })
      // console.log("Kim: ", kim);

    })

    it("can lookup items using a unique index (after)", () => {
      const list = new IndexedList();
      list.push(
        { name:'Sam', age:30 },
        { name:'Art', age:27 },
        { name:'Kim', age:27 },
      )
      list.index('name', {unique:true});
      const kim = list.get('name', 'Kim');
      expect(kim).to.be.deep.equal({ name:'Kim', age:27 })
    })

    it("can lookup items using a unique index (before)", () => {
      const list = new IndexedList();
      list.index('name', {unique:true});
      list.push(
        { name:'Sam', age:30 },
        { name:'Art', age:27 },
        { name:'Kim', age:27 },
      )
      const kim = list.get('name', 'Kim');
      expect(kim).to.be.deep.equal({ name:'Kim', age:27 })
    })

    it("can look up using compound keys", () => {
      const list = new IndexedList();
      list.index('name.first', {unique:true});
      list.push(
        { name:{first:'Sam'}, age:30 },
        { name:{first:'Art'}, age:27 },
        { name:{first:'Kim'}, age:27 },
      )
      const kim = list.get('name.first', 'Kim');
      expect(kim).to.be.deep.equal({ name:{first:'Kim'}, age:27 })
    })

    it("can get a map using a unique index", () => {
      const list = new IndexedList();
      list.index('name', {unique:true});
      list.push(
        { name:'Sam', age:30 },
        { name:'Art', age:27 },
        { name:'Kim', age:27 },
      )
      const map = list.map('name');
      expect(Object.keys(map)).to.include('Sam')
    })

    it("can handle updates to single items", () => {
      const list = new IndexedList();
      list.index('age');
      list.push(
        { name:'Sam', age:30 },
        { name:'Art', age:27 },
        { name:'Kim', age:27 },
      )

      expect(list.get('name', 'Sam')).to.be.deep.equal({ name:'Sam', age:30 })
      expect(list.get('name', 'Eve')).to.be.deep.equal(undefined)

      list[0].name = 'Eve';
      IndexedList.emit(list[0], {name:'Sam'});

      expect(list.get('name', 'Sam')).to.be.deep.equal(undefined)
      expect(list.get('name', 'Eve')).to.be.deep.equal({ name:'Eve', age:30 })
    })

    it("can do a bare get() with a unique index", () => {
      const list = new IndexedList({identity:true, indexes:{name:true}});
      list.push(
        { name:'Sam', age:30 },
        { name:'Art', age:27 },
        { name:'Kim', age:27 },
      )
      const kim = list.get('Kim');
      expect(kim).to.be.deep.equal({ name:'Kim', age:27 })
      expect(list.Kim).to.be.deep.equal({ name:'Kim', age:27 })
    })

  })

  describe("IndexedList with non-unique indexes", () => {

    it("can get a single item with non-unique indexes", () => {
      const list = new IndexedList();
      list.index('age');
      list.push(
        { name:'Sam', age:30 },
        { name:'Art', age:27 },
        { name:'Kim', age:27 },
      )
      const age27 = list.get('age', 27);
      expect(age27).to.be.deep.equal({ name:'Art', age:27 })
    })

    it("can get all items with non-unique indexes", () => {
      const list = new IndexedList();
      list.index('age');
      list.push(
        { name:'Sam', age:30 },
        { name:'Art', age:27 },
        { name:'Kim', age:27 },
      )
      const age27s = list.all('age', 27);
      expect(age27s).to.be.deep.equal([{ name:'Art', age:27 }, { name:'Kim', age:27 }])
    })

    it("can handle updates to items", () => {
      const list = new IndexedList();
      list.index('age');
      list.push(
        { name:'Sam', age:30 },
        { name:'Art', age:27 },
        { name:'Kim', age:27 },
      )

      expect(list.all('age', 30)).to.be.deep.equal([
        { name:'Sam', age:30 },
      ])
      expect(list.all('age', 27)).to.be.deep.equal([
        { name:'Art', age:27 }, 
        { name:'Kim', age:27 }
      ])

      list[1].age = 30;
      IndexedList.emit(list[1], {age:27});

      expect(list.all('age', 30)).to.be.deep.equal([
        { name:'Sam', age:30 },
        { name:'Art', age:30 }, 
      ])
      expect(list.all('age', 27)).to.be.deep.equal([
        { name:'Kim', age:27 }
      ])
    })

    // it("can wait", (done) => {
    //   setTimeout(done, 3600e3)
    // })

  })

  describe("Using calcs", () => {

    // it("can calculate", () => {
    //   let cache = require.cache;

    //   const list = new IndexedList({indexes:{id:true}});
    //   list.push(...xns(100));
    //   // {id:76, rg:'americas', cl:'c2', tp:'txn', px:20.61, qt:30.25, tx:1.28}
    //   /* Group by rg and calculate {vltl:sum(px*qt), cn:count(*), tx:sum(tx)} */
    //   const calc = list.calc({
    //     project: { 
    //       vl: (it) => it.px * it.qt,
    //     },
    //     group: {
    //       id:   '$rg',
    //       vltl: { $sum:'$vl' },
    //       cn:   { $count:1 },
    //       avpx: { $avg:'$px' },
    //       tx:   { $sum:'$tx' },
    //     },
    //   })

    //   calc.on('update', {});
      
    // })

    
    function xns(count=100) {
      const rgs = ['americas', 'asia', 'europe', 'africa', 'australia'];
      const cls = ['c1', 'c2', 'c3', 'c4'];
      const tps = ['fee', 'int', 'rec', 'txn'];
      const pick = ary => ary[~~(ary.length*Math.random())]
      const fixed = (num, dec) => Math.floor(num * Math.pow(10, dec)) / Math.pow(10, dec)
      // for (let i = 0, ic = 100; i < ic; i++) { console.log(`{ id: ${i}, rg:'${rnd(rgs)}', cl:'${rnd(cls)}', tp:'${rnd(tps)}', px:${(Math.random()*15+15).toFixed(2)}, qt:${(Math.random()*25+25).toFixed(2)}, tx:${(Math.random()*.5+1).toFixed(2)} }`) }
      const xns = [];
      for (let i = 0; i < count; i++) { 
        xns.push({ id:$i, rg:pick(rgs), cl:pick(cls), tp:pick(tps), px:(Math.pickom()*15+15).toFixed(2), qt:fixed(Math.random()*25+25, 2), tx:fixed(Math.random()*.5+1) });
      }
      return xns
    }
    
  })

})
