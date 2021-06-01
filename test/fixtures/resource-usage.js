
const Type = require('../../lib/model/type')
const log = require('logsync')
const os = require('os');

/**
 * Represents resource usage
 * @since  1.0
 * @author Lo Shih <kloshih@gmail.com>
 * @copyright Copyright 2021 Lo Shih 
 */
class ResourceUsage {

  static get props() {
    return {
      time:             {type:'time'},
      processUptime:    {type:'float', unit:"s"},
      userCPUTime:      {type:'int', unit:"ms"}, 
      systemCPUTime:    {type:'int', unit:"ms"},
      rss:              {type:'int'},
      maxRSS:           {type:'int', unit:"kB"},
      heapTotal:        {type:'int', unit:"B"},
      heapUsed:         {type:'int', unit:"B"},
      external:         {type:'int', unit:"B"},
      arrayBuffers:     {type:'int', unit:"B"},
      majorPageFault:   {type:'int', unit:"#"},
      minorPageFault:   {type:'int', unit:"#"},
      systemUptime:     {type:'int', unit:"B"},
      freemem:          {type:'int', unit:"B"},
      totalmem:         {type:'int', unit:"B"},
      cpus:             {many:ResourceUsage.CPU},
      loadavg1m:        {type:'float'},
      loadavg5m:        {type:'float'},
      loadavg15m:       {type:'float'},
    }
  }

  constructor(config, owner) {
    Type.initialize(this, config, owner)
    this.owner = owner;
    // super(config, owner);
  }

  toJSON(owner) {
    return Type.formatJson(this, {}, owner);
  }

  static capture() {
    let processUptime = process.uptime()
    let { userCPUTime, systemCPUTime, maxRSS, majorPageFault, minorPageFault } = process.resourceUsage();
    let { rss, heapTotal, heapUsed, external, arrayBuffers } = process.memoryUsage();

    let cpus = os.cpus();
    let freemem = os.freemem();
    let [ loadavg1m, loadavg5m, loadavg15m ] = os.loadavg();
    let totalmem = os.totalmem();
    let systemUptime = os.uptime();

    return {
      time: Date.now(),

      processUptime,
      userCPUTime,
      systemCPUTime,
      rss,
      maxRSS,
      heapUsed,
      heapTotal,
      external,
      arrayBuffers,
      majorPageFault,
      minorPageFault,

      cpus,
      systemUptime,
      freemem,
      totalmem,
      loadavg1m,
      loadavg5m,
      loadavg15m,
    }
  }
  
}
module.exports = ResourceUsage;


ResourceUsage.CPU = class ResourceUsageCPU {

  static get props() {
    return {
      model:            {type:'string'},
      speed:            {type:'float', unit:"s"},
      userTime:         {type:'int', unit:"ms", json:'times.user'}, 
      niceTime:         {type:'int', unit:"ms", json:'times.nice'}, 
      sysTime:          {type:'int', unit:"ms", json:'times.sys'}, 
      idleTime:         {type:'int', unit:"ms", json:'times.idle'}, 
      irqTime:          {type:'int', unit:"ms", json:'times.irq'}, 
    }
  }

  constructor(config, owner) {
    Type.initialize(this, config, owner)
    this.owner = owner;
  }

  toJSON(owner) {
    return Type.formatJson(this, {}, owner);
  }

}