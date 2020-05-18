global.baseCreep = require('creeps_baseCreep');

var roleMiner = require('creeps_role.miner');
var roleUpgrader = require('creeps_role.upgrader');
var roleBuilder = require('creeps_role.builder');
var roleRenewSelf = require('creeps_role.renewSelf');
var roleHauler = require('creeps_role.hauler');
var roleScout = require('creeps_role.scout');

var moduleStats = require('module.stats');
var moduleSpawn = require('module.spawn');
var moduleAutobuilder = require('module.autobuilder');
var moduleDefense = require('module.defense');
var moduleLogistics = require('module.logistics');
var moduleStrategy = require('module.strategy');


module.exports.loop = function () {
    for (var sname in Game.spawns)
    {
        var spawn = Game.spawns[sname];
        moduleStats.run(spawn.room);
        moduleSpawn.run(spawn);
        moduleAutobuilder.run(spawn.room);
        moduleDefense.run(spawn.room);
        moduleStrategy.run(spawn.room);
        moduleLogistics.run(spawn.room);
    }

    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        
        //try {
            if (creep.memory.renewSelf) {
    	        roleRenewSelf.run(creep);
            } else if(creep.memory.role == 'miner') {
                roleMiner.run(creep);
            } else if(creep.memory.role == 'upgrader') {
                roleUpgrader.run(creep);
            } else if(creep.memory.role == 'builder') {
                roleBuilder.run(creep);
            } else if(creep.memory.role == 'hauler') {
    	        roleHauler.run(creep);
            } else if (creep.memory.role == 'scout') {
                roleScout.run(creep);
            }
        /*}
        catch(err)
        {
            console.log(err.message);
        }*/
        
        if (creep.ticksToLive <= 100)
        {
	        creep.memory.renewSelf = true;
        }
    }
};
