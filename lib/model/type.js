
const IndexedList = require('../data/list.indexed');
const json = require('../data/json');
const { _typeof, _merge, superclass } = require('../data/util');

/**
 * 
 * @since  1.0
 * @author Lo Shih <kloshih@gmail.com>
 * @copyright Copyright 2021 Lo Shih 
 */
class Type {

  constructor(config, model) {
    this.model = model;
    this.props = new IndexedList({indexes:{name:true}});
    this.phase = 'unresolved';
    if (config) {
      const parser = json.parser(this, config);
      parser.value('name', 'string!', {key:true});
      parser.value('extends', 'class');
      parser.value('impl', 'class', {default:this.name});
      parser.many('props', Prop, {key:'name'});
      parser.many('indexes', Index, {key:'name'});
      parser.done();
    }
  }

  toString() {
    return `${this.constructor.name}(${this.model && this.model.name || '-'}:${this.name})`;
  }

  /**
   * Returns the prop for the given *name* or as a code. If the prop does not 
   * exist, one is created for you and returned.
   * @param {string} name The name of the prop
   * @returns {Prop} the prop or null if not found
   */
  prop(name) {
    let prop;
    if (prop = this.props.get('name', name))
      return prop;
    if (prop = this.props.get('code', name))
      return prop;
    prop = new Prop(null, this);
    prop.name = name;
    this.props.push(prop);
    return prop;
  }

  validate() {
    const validator = json.validator(this, {}, this.owner);
    validator.value('name', 'string!', {key:true});
    validator.value('extends', 'class');
    validator.value('impl', 'class');
    validator.many('props', Prop, {key:'name'});
    validator.many('indexes', Index, {key:'name'});
    return validator.done();
  }

  toJSON(owner=null) {
    const doc = {};
    const formatter = json.formatter(this, doc, owner);
    formatter.value('name', 'string!', {key:true});
    formatter.value('extends', 'class');
    formatter.value('impl', 'class', {default:this.name});
    formatter.many('props', Prop, {key:'name'});
    formatter.many('indexes', Index, {key:'name'});
    return formatter.done();
  }


  /* ---------------------- Implementation Support ------------------------- */

  /**
   * Resolves the model all of its types as well as all of its properties
   */
  resolve(phase) {
    this.phase = phase;
    
    switch (phase) {
      case 'validate':
        this.validate();
        break;
      case 'binding':
        if (this.extends) {
          if (_typeof(this.extends) != 'class')
            throw new Error("STUBBED");
          this.extendsType = Type.type(this.extends, {model:this.model});
        }
        if (this.impl) {
          if (_typeof(this.impl) != 'class')
            throw new Error("STUBBED");
        }
        this.props.forEach(prop => {
          if (prop.key && !this.keyProp) 
            this.keyProp = prop;
          if (prop.impls && !this.implsProp) 
            this.implsProp = prop;
          if (prop.parent && !this.parentProp) 
            this.parentProp = prop;
        })
        break;
      case 'types':
        break;
      case 'resolved':
        break;
    }
    this.props.forEach(prop => prop.resolve(phase))


    // if (this.state == 'resolved')
    //   return;
    // try {
    //   this.state = 'pending';
    //   this.validate();
    //   if (this.extends) {
    //     if (_typeof(this.extends) != 'class')
    //       throw new Error("STUBBED");
    //     this.extendsType = Type.type(this.extends, {model:this.model});
    //   }
    //   if (this.impl) {
    //     if (_typeof(this.impl) != 'class')
    //       throw new Error("STUBBED");
    //   }
    //   this.props.forEach(prop => {
    //     prop.resolve();
    //     if (prop.key && !this.keyProp) 
    //       this.keyProp = prop;
    //     if (prop.impls && !this.implsProp) 
    //       this.implsProp = prop;
    //     if (prop.parent && !this.parentProp) 
    //       this.parentProp = prop;
    //   })

    //   this.state = 'resolved';
    // } catch (error) {
    //   this.state = 'partial';
    //   throw error
    // }
  }

  get stack() {
    return this.extendsType ? [...this.extendsType.stack, this] : [this];
  }

  /**
   * Returns the type derived from the record implementation class. 
   * Implementation classes are concrete or synthetic subclasses of {Record}.
   * Which define their own model using static getters such as {#props()}. 
   * By default, these types are packaged along with all other models defined
   * in a package. 
   * @param {class} impl The record class
   * @return {Type} The defined type
   */
  static type(impl, opts) {
    // let type = impl[kType];
    let type = typeByImpl.get(impl);
    if (type) return type;
    const model = opts && opts.model || Model.modelForImpl(impl, opts);
    if (!model)
      throw new Error("IMPL");
    type = model.type(impl);
    if (!type) {
      /* Define a type for this implementation model */
      let superimpl = superclass(impl);
      if (superimpl && !superimpl.hasOwnProperty('props'))
        superimpl = undefined;
      type = new Type({
        name: impl.name,
        impl: impl,
        extends: superimpl,
        props: this.props(impl),
      }, model);
      model._addType(type);
      // model.types.push(type);
      // if (model.phase !== 'unresolved')
        // type.resolve();
    }
    // return impl[kType] = type;
    typeByImpl.set(impl, type);
    return type;
  }

  static props(impl) {
    let props = propsByType.get(impl);
    if (!props) {
      propsByType.set(impl, props = {});
      for (let c = impl; c && c !== Object; c = superclass(c)) {
        _merge(props, c.props/*this.coerceProps(t.props)*/)
        break;
      }
    }
    return props;
  }
  
  static initialize(record, config, owner) {
    this.parseJson(record, config, owner);
  }

  // static parseJson_gen(record, config, owner) {
  //   const type = this.type(record.constructor);
  //   type.model.resolve();
  //   const gen = Gen.get(type, 'parseJson');
  //   const parser = json.parser(record, config);
  //   type.stack.forEach(t => {
  //     t.props.forEach(prop => {
  //       switch (prop.kind) {
  //         case 'value': 
  //           gen.call(parser, 'value', {[prop.name]:prop.name, [prop.type]:prop.type, prop});
  //           break;
  //         case ''
  //     })
  //   })
    
  // }

  static parseJson(record, config, owner) {
    const type = this.type(record.constructor);
    type.model.resolve();
    const parser = json.parser(record, config);
    type.stack.forEach(t => {
      t.props.forEach(prop => {
        switch (prop.kind) {
          case 'value': 
            parser.value(prop.name, prop.type, prop);
            break;
          case 'one':
            if (prop.parent) {
              record[prop.name] = owner;
            } else {
              parser.one(prop.name, prop.type);
            }
            break;
          case 'many':
            const targetType = prop.targetType;
            const keyProp = targetType.keyProp;
            const key = keyProp && keyProp.name;
            const implsProp = targetType.implsProp;
            const impls = implsProp && { key:implsProp.name, map:implsProp.impls };
            parser.many(prop.name, prop.type, {key, impls});
            break;
        }
      })
    });
    parser.done();


    // // const parser = json.parser(record, config);
    //     // const parser = new json.Parser(record, config, {});
    //         const target = record;
    //         const typeName = target.constructor.name;
    //         const doc = config;
    //         const rest = Object.assign({}, this.doc);
    // // parser.value('time', 'time');
    //     delete(rest.time);
    //     const docval = config['time']
    //     // const type = json.types['time'];
    //     // if (!type) throw new Error('Type not supported: time');
    //     if (docval !== undefined)
    //       // record.time = type._parse(docval);
    //         // let v, d = docval, t = _typeof(docval);
    //         // if (t == 'number') { v = parseInt(docval) }
    //         //   else { v = parseInt(d); if (isNaN(docval)) throw 'NaN' }
    //         record.time = throwIfNaN(parseInt(docval));
    // parser.value('processUptime', 'float');
    //     delete(rest.processUptime);
    //     const docval = config['processUptime']
    //     // const type = json.types['float'];
    //     // if (!type) throw new Error('Type not supported: float');
    //     if (docval !== undefined)
    //       // record.processUptime = type._parse(docval);
    //         record.processUptime = throwIfNaN(parseInt(docval));

    // parser.value('userCPUTime', 'int');
    // parser.many('cpus', ResourceUsage.CPU);
    // parser.done();
  }

  static formatJson(record, config, owner) {
    const type = this.type(record.constructor);
    type.model.resolve();
    const formatter = json.formatter(record, config, owner);
    type.stack.forEach(t => {
      t.props.forEach(prop => {
        switch (prop.kind) {
          case 'value':
            formatter.value(prop.name, prop.type, prop);
            break;
          case 'one':
            const parent = prop.parent;
            if (owner && parent)
              break;
            formatter.one(prop.name, prop.type.impl, {parent});
            break;
          case 'many':
            const keyProp = prop.targetType.keyProp;
            const key = keyProp && keyProp.name;
            formatter.many(prop.name, prop.type, {key});
            break;
        }
      })
    })
    return formatter.done();
  }

}
module.exports = Type;

const Prop = require('./prop');
const Index = require('.');
const Model = require('../model');
const ResourceUsage = require('../../test/fixtures/resource-usage');


const kType = Symbol('kType');
const typeByImpl = new Map();
const propsByType = new Map();

