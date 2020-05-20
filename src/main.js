global.baseCreep = require('creeps_baseCreep');
global.moduleLogistics = require('module.logistics');
global.moduleSpawn = require('module.spawn');
global.moduleStrategy = require('module.strategy');

var roleMiner = require('creeps_role.miner');
var roleUpgrader = require('creeps_role.upgrader');
var roleBuilder = require('creeps_role.builder');
var roleRenewSelf = require('creeps_role.renewSelf');
var roleHauler = require('creeps_role.newhauler');
var roleScout = require('creeps_role.scout');
var rolePioneer = require('creeps_role.pioneer');
var roleClaimer = require('creeps_role.claimer');

var moduleStats = require('module.stats');
var moduleAutobuilder = require('module.autobuilder');
var moduleDefense = require('module.defense');



console.log("reset detected");

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
            } else if (creep.memory.role == 'pioneer') {
                rolePioneer.run(creep);
            } else if (creep.memory.role == 'claimer') {
               roleClaimer.run(creep);
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
