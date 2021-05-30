
const Model = require('./lib/model')

Model.Dependency = require('./lib/dependency')
Model.Typedef = require('./lib/typedef')
Model.Indexdef = require('./lib/indexdef')
Model.Propdef = require('./lib/propdef')
Model.Propdef.Value = require('./lib/propdef.value')
Model.Propdef.One = require('./lib/propdef.one')
Model.Propdef.Many = require('./lib/propdef.many')

module.exports = Model;