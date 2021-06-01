
const Model = require('./lib/model')

Model.Dependency = require('./lib/dependency')
Model.Type = require('./lib/type')
Model.Indexdef = require('./lib/indexdef')
Model.Prop = require('./lib/prop')
Model.Prop.Value = require('./lib/prop.value')
Model.Prop.One = require('./lib/prop.one')
Model.Prop.Many = require('./lib/prop.many')

module.exports = Model;