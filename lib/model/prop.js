
const { _typeof } = require('../data/util');
const json = require('../data/json');

/**
 * 
 * @since  1.0
 * @author Lo Shih <kloshih@gmail.com>
 * @copyright Copyright 2021 Lo Shih 
 */
 class Prop {

  /**
   * Normalizes the conf 
   * @param {object} conf The confuration
   */
   static normalizeConfig(conf) {
    if (conf == null) return { kind:'value', type:'any' };
    if (typeof(conf) == 'string') return { kind:'value', type:conf };
    if (!conf.name && conf.$key)
      conf.name = conf.$key;
    for (let key in conf) {
      let val = conf[key], valtype = _typeof(val);
      switch (key) {
        case 'type':    !conf.kind && (conf.kind='value'); 
                        break;
        case 'one':     conf.kind='one', conf.type=val;
                        delete(conf.one); break;
        case 'many':    conf.kind='many', conf.type=val;
                        delete(conf.many); break;
        case 'parent':  if (valtype !== 'boolean') 
                          conf.kind='one', conf.type=val, conf.parent = true;
                        break;
        case 'enum':    conf.kind='value', conf.type='string'; break;
        case 'def':     conf.default=val, delete(conf.def); break;
        case 'key':     conf.kind='value', conf.type=conf.key, 
                        conf.key=true; break;
      }
    }
    return conf;
  }

  static create(conf, owner) {
    switch (conf.kind) {
      case 'value': return new Prop.Value(conf, owner);
      case 'one':   return new Prop.One(conf, owner);
      case 'many':  return new Prop.Many(conf, owner);
      default:      throw new Error("IMPL")
    }
  }

  constructor(config, owner) {
    this.owner = owner;
    this.phase = 'unresolved';
    if (config) {
      const parser = json.parser(this, config);
      parser.value('name', 'string!', {key:true});
      parser.value('code', 'string');
      parser.value('kind', 'string!', {default:'value'});
      parser.value('type', 'class', {implicit:true});
      parser.value('key', 'boolean');
      parser.value('enum', 'string*');
      parser.value('parent', 'boolean');
      parser.value('unique', 'any');
      parser.value('index', 'int');
      parser.value('impls', '[string]:class');
      parser.value('default', 'string');
      parser.value('nullable', 'string');
      parser.value('editable', 'string');
      parser.value('derived', 'string');
      parser.value('source', 'string');
      parser.value('implicit', 'boolean');
      parser.value('validation', 'string');
      parser.value('class', 'string');
      parser.value('aggregate', 'string');
      parser.value('join', 'string');
      parser.value('json', 'string');
      parser.value('help', 'string');
      parser.done();
    }
  }

  toString() {
    return `${this.constructor.name}(${this.owner && this.owner.name || '-'}.${this.name})`;
  }

  get model() {
    return this.owner && this.owner.model
  }

  validate() {
    const validator = json.validator(this, {}, this.owner);
    validator.value('name', 'string!', {key:true});
    validator.value('code', 'string');
    validator.value('kind', 'string!', {default:'value'});
    validator.value('type', 'class', {implicit:true});
    validator.value('key', 'boolean');
    validator.value('enum', 'string*');
    validator.value('parent', 'boolean');
    validator.value('unique', 'any');
    validator.value('index', 'int');
    validator.value('impls', '[string]:class');
    validator.value('default', 'string');
    validator.value('nullable', 'string');
    validator.value('editable', 'string');
    validator.value('derived', 'string');
    validator.value('source', 'string');
    validator.value('implicit', 'boolean');
    validator.value('validation', 'string');
    validator.value('class', 'string');
    validator.value('aggregate', 'string');
    validator.value('join', 'string');
    validator.value('json', 'string');
    validator.value('help', 'string');
    return validator.done();
  }

  toJSON(owner=null) {
    const formatter = json.formatter(this, {}, owner);
    formatter.value('name', 'string!', {key:true});
    formatter.value('code', 'string');
    formatter.value('kind', 'string!', {default:'value'});
    formatter.value('type', 'class');
    formatter.value('key', 'boolean');
    formatter.value('enum', 'string*');
    formatter.value('parent', 'boolean');
    formatter.value('unique', 'any');
    formatter.value('index', 'int');
    formatter.value('impls', '[string]:class');
    formatter.value('default', 'string');
    formatter.value('nullable', 'string');
    formatter.value('editable', 'string');
    formatter.value('derived', 'string');
    formatter.value('source', 'string');
    formatter.value('implicit', 'boolean');
    formatter.value('validation', 'string');
    formatter.value('class', 'string');
    formatter.value('aggregate', 'string');
    formatter.value('join', 'string');
    formatter.value('json', 'string');
    formatter.value('help', 'string');
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
        switch (this.kind) {
          case 'value':
            const type = json.types[this.type];
            if (!type) throw new Error("Unsupported type: " + this.type)
            break;
  
          case 'one':
          case 'many':
            switch (_typeof(this.type)) {
              case 'string':
                this.targetType = this.model.type(this.type);
                if (!this.targetType)
                  throw new Error("Can't find target type: " + this.type);
                break;
  
              case 'class': /* Look for the type in the model, otherwise, create
                the type */
                this.targetType = this.model.type(this.type);
                if (!this.targetType)
                  this.targetType = Type.type(this.type, {model:this.owner.model});              
                if (!this.targetType)
                  throw new Error("Can't find target type: " + this.type);
                break;
  
              default:
                throw new Error(`Type ${this.type}, must valid type`);
            }
            break;
        }
        break;
      case 'types':
        switch (this.kind) {
          case 'value':
            /* Resolve implementations for polymorphpic relationships */
            if (this.impls) {
              for (let key in this.impls) {
                let impl = this.impls[key];
                switch (_typeof(impl)) {
                  case 'class': 
                    break;
                  case 'string':
                    const type = this.model.type(impl);
                    if (!type) throw new Error(`Can't find impl type named '${this.impls[key]}' for property, ${this}`);
                    if (!type.impl) throw new Error(`Type named '${this.impls[key]}' does not have an implementation class for property ${this}`);
                    this.impls[key] = type.impl;
                    break;
                  default:
                    throw new Error("IMPL");
                }
            }
            }
          case 'one':
          case 'many':
            break;
        }
        break;
      case 'resolved':
        break;
    }
    // try {

   

    //   this.phase = 'resolved';
    // } catch (error) {
    //   this.phase = 'partial';
    //   throw error
    // }
  }

}
module.exports = Prop;

Prop.Value = require('./prop.value');
Prop.One = require('./prop.one');
Prop.Many = require('./prop.many');

const Type = require('./type');

// static get props() {
//   return {
//     owner:      {owner:'Type'},
//     name:       {type:'string', unique:'owner'},
//     code:       {type:'string', unique:'owner'},
//     kind:       {enum:['value','one','many']},
//     type:       {type:'any'},
//     unique:     {type:'string'},
//     index:      {type:'uint', unique:'owner', sort:'owner'},
//     key:        {type:'any'},
//     default:    {type:'string'},
//     sortable:   {type:'string'},
//     nullable:   {type:'string'},
//     editable:   {type:'string'},
//     derived:    {type:'string'},
//     source:     {type:'string'},
//     implicit:   {type:'string'},
//     validation: {type:'string'},
//     aliases:    {type:'string'},
//     class:      {enum:['unknown','categorical','discrete','continuous']},
//     aggregate:  {type:'string'},
//     join:       {type:'string'},
//     json:       {type:'string'},
//     help:       {type:'string'},
//   }
// }


// parse(config) {
//   if (!config) return this;
//   this.name = config.name;
//   this.code = config.code;
//   this.kind = config.kind;
//   this.type = config.type;
//   this.unique = config.unique;
//   this.index = config.index;
//   this.key = config.key;
//   this.enum = config.enum;
//   this.default = config.default;
//   this.sortable = config.sortable;
//   this.nullable = config.nullable;
//   this.editable = config.editable;
//   this.derived = config.derived;
//   this.source = config.source;
//   this.implicit = config.implicit;
//   this.validation = config.validation;
//   this.aliases = config.aliases;
//   this.class = config.class;
//   this.aggregate = config.aggregate;
//   this.join = config.join;
//   this.json = config.json;
//   this.help = config.help;
//   return this
// }

