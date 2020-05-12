var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var moduleSpawn = require('module.spawn');
var moduleAutobuilder = require('module.autobuilder');

module.exports.loop = function () {
    moduleSpawn.run(Game.spawns['Spawn1']);
    moduleAutobuilder.run(Game.spawns['Spawn1'].room);

    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        
        if(creep.memory.role == 'harvester') {
            roleHarvester.run(creep);
        }
        if(creep.memory.role == 'upgrader') {
            roleUpgrader.run(creep);
        }
        if(creep.memory.role == 'builder') {
            roleBuilder.run(creep);
        }
    }
}
