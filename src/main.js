global.Traveler = require('creeps_traveler');
global.baseCreep = require('creeps_baseCreep');
global.baseGroup = require('creeps_baseGroup');
global.moduleLogistics = require('module.logistics');
global.moduleSpawn = require('module.spawn');
global.Ops = require('ops_ops');
global.Labs = require('labs_labs');
global.Terminal = require('module.terminal');
global.Logistics = global.moduleLogistics;
global.Intel = require('module.intel');
global.moduleAutobuilder = require('module.autobuilder');

var roleMiner = require('creeps_role.miner');
var roleHarvester = require('creeps_role.harvester');
var roleUpgrader = require('creeps_role.upgrader');
var roleBuilder = require('creeps_role.builder');
var roleHauler = require('creeps_role.hauler');
var roleScout = require('creeps_role.scout');
var rolePioneer = require('creeps_role.pioneer');
var roleClaimer = require('creeps_role.claimer');
var roleReserver = require('creeps_role.reserver');
var roleSoldier = require('creeps_role.soldier');
var roleDrainer = require('creeps_role.drainer');
var roleDismantler = require('creeps_role.dismantler');
var roleHealer = require('creeps_role.healer');
var roleRenewSelf = require('creeps_role.renewSelf');
var roleBoostSelf = require('creeps_role.boostSelf');

var moduleMemory = require('module.memory');
var moduleStats = require('module.stats');
var moduleDefense = require('module.defense');
var moduleEvents = require('module.events');
var moduleBasePosCalc = require('module.baseposcalc');

const profiler = require('screeps-profiler');
profiler.registerObject(baseCreep, 'baseCreep');
profiler.registerObject(moduleLogistics, 'moduleLogistics');
profiler.registerObject(moduleSpawn, 'moduleSpawn');
profiler.registerObject(Ops, 'Ops');
profiler.registerObject(Labs, 'Labs');
profiler.registerObject(Terminal, 'Terminal');
profiler.registerObject(Intel, 'Intel');
profiler.registerObject(moduleAutobuilder, 'moduleAutobuilder');
profiler.registerObject(roleMiner, 'roleMiner');
profiler.registerObject(roleHarvester, 'roleHarvester');
profiler.registerObject(roleUpgrader, 'roleUpgrader');
profiler.registerObject(roleBuilder, 'roleBuilder');
profiler.registerObject(roleHauler, 'roleHauler');
profiler.registerObject(roleScout, 'roleScout');
profiler.registerObject(rolePioneer, 'rolePioneer');
profiler.registerObject(roleClaimer, 'roleClaimer');
profiler.registerObject(roleReserver, 'roleReserver');
profiler.registerObject(roleSoldier, 'roleSoldier');
profiler.registerObject(roleDrainer, 'roleDrainer');
profiler.registerObject(roleDismantler, 'roleDismantler');
profiler.registerObject(roleHealer, 'roleHealer');
profiler.registerObject(roleRenewSelf, 'roleRenewSelf');
profiler.registerObject(roleBoostSelf, 'roleBoostSelf');
profiler.registerObject(moduleMemory, 'moduleMemory');
profiler.registerObject(moduleStats, 'moduleStats');
profiler.registerObject(moduleDefense, 'moduleDefense');
profiler.registerObject(moduleEvents, 'moduleEvents'); 
profiler.registerObject(moduleBasePosCalc, 'moduleBasePosCalc');

profiler.enable();
Intel.init();
console.log('Startup');

module.exports.loop = moduleMemory.wrapper(() => {
    profiler.wrap(() => {
        //MODULES per ROOM
        var i = 0;
        for (var r in Game.rooms) 
        {
            var room = Game.rooms[r];
            
            moduleEvents.run(room);
            
            // ONLY CONTINUE IF ROOM IS MINE
            if (!room.controller || !room.controller.my) continue;

            moduleStats.run(room);
            
            if (Game.time % 100 == i++)
                moduleAutobuilder.run(room);
            if (room.terminal && Game.time % 20 == i++) {
                Terminal.run(room);
            }
            
            Labs.run(room);
            moduleDefense.run(room);
            moduleLogistics.run(room);
        }

        //MODULES per Spawn
        for (var sname in Game.spawns)
        {
            var spawn = Game.spawns[sname];
            if (Game.time % 10 == 0)
                moduleSpawn.run(spawn);
        }
        
        //OPS
        Ops.run();
        
        //CREEPS
        let start = Game.cpu.getUsed();
        for(var name in Game.creeps) {
            var creep = Game.creeps[name];
            
            if (creep.memory.renewSelf) {
                roleRenewSelf.run(creep);
            } else if (creep.memory.boostSelf) {
                roleBoostSelf.run(creep);
            } else if(creep.memory.role == 'miner') {
                roleMiner.run(creep);
            } else if(creep.memory.role == 'harvester') {
                roleHarvester.run(creep);
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
            } else if (creep.memory.role == 'reserver') {
                roleReserver.run(creep);
            } else if (creep.memory.role == 'soldier') {
                roleSoldier.run(creep);
            } else if (creep.memory.role == 'drainer') {
                roleDrainer.run(creep);
            } else if (creep.memory.role == 'dismantler') {
                roleDismantler.run(creep);
            } else if (creep.memory.role == 'healer') {
                roleHealer.run(creep);
            }
            
            if (creep.ticksToLive <= 100 && !creep.memory.noRenew)
            {
                creep.memory.renewSelf = true;
            }
        }
        let elapsed = Game.cpu.getUsed() - start;

        // cpu stats
        if (!Memory.stat_cpu) Memory.stat_cpu = Game.cpu.getUsed();
        Memory.stat_cpu *= 999;
        Memory.stat_cpu += Game.cpu.getUsed();
        Memory.stat_cpu /= 1000;

        if (!Memory.stat_creep_cpu) Memory.stat_creep_cpu = elapsed;
        Memory.stat_creep_cpu *= 999;
        Memory.stat_creep_cpu += elapsed;
        Memory.stat_creep_cpu /= 1000;
    });
});
