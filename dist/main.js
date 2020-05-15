global.commonFunctions = require('common.functions');

var roleMiner = require('role.miner');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleRenewSelf = require('role.renewSelf');
var roleHauler = require('role.hauler');

var moduleSpawn = require('module.spawn');
var moduleAutobuilder = require('module.autobuilder');
var moduleDefense = require('module.defense');


module.exports.loop = function () {
    moduleSpawn.run(Game.spawns['Spawn1']);
    moduleAutobuilder.run(Game.spawns['Spawn1'].room);
    moduleDefense.run(Game.spawns['Spawn1'].room);

    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        
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
        } else if (creep.memory.role == 'harvester') {
            creep.memory.role = 'miner';
        }
        
        if (creep.ticksToLive <= 100)
        {
	        creep.memory.renewSelf = true;
        }
    }
}
