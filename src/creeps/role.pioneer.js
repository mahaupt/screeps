// Game.spawns.Spawn1.spawnCreep([WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], "Pioneer", {memory: {role: 'pioneer', target: 'W7N3'}})
// [WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE]

var rolePioneer = {
    run: function(creep)
    {
        baseCreep.init(creep);
        
        //wait for target
        if (!creep.memory.target)
        {
            //idle around controller
            creep.say("😴");
            creep.moveTo(creep.room.controller);
            return;
        }
        
        //prepare creep for embarkation
        if (!creep.memory.embark)
        {
            baseCreep.prepareCreep(creep);
            creep.memory.noRenew = true;
            return;
        }
        
        //move to target room
        if (creep.room.name != creep.memory.target)
        {
            baseCreep.moveToRoom(creep, creep.memory.target);
            return;
        }
        
        //wait for controller to be captured
        if (!creep.room.controller.my) {
            if (creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                rolePioneer.harvest(creep);
            }
        } else {
            //harvest and build spawn
            if (!creep.memory.harvest && creep.store[RESOURCE_ENERGY] == 0) {
                creep.memory.harvest = true;
            } else if (creep.memory.harvest && creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
                creep.memory.harvest = false;
            }
            
            
            if (creep.memory.harvest)
            {
        		rolePioneer.harvest(creep);
            } else {
                rolePioneer.build(creep);
            }
            
            
        }
        
        
    },
    
    harvest: function(creep)
    {
        if (baseCreep.pickupDroppedEnergy(creep, 4)) { return; }
        
        var source = creep.pos.findClosestByPath(FIND_SOURCES);
        if (source)
        {
            if (creep.harvest(source) != OK) {
                creep.moveTo(source, {visualizePathStyle: {stroke: '#ff0000'}});
            }
        
            //source empty
            if (source.energy == 0) {
                creep.memory.harvest = false;
            }
        }
    }, 
    
    
    build: function(creep)
    {
        //upgrade controller if low ticks
        if (creep.room.controller.ticksToDowngrade <= 2000) {
            creep.memory.upgradeController = true;
        }
        if (creep.room.controller.ticksToDowngrade >= 10000) {
            creep.memory.upgradeController = false;
        }
        
        
        //upgrade controller
        if (creep.memory.upgradeController)
        {
            if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE)
            {
                creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#00ff00'}});
            }
        } 
        else 
        {
            //kill switch
            if (creep.room.controller.level >= 3) {
                creep.memory.killSelf = true;
            }
            
            //build spawn
            var consite = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES);
            if (consite) {
                if (creep.build(consite) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(consite, {visualizePathStyle: {stroke: '#00ff00'}});
                }
            } else {
                //transfer energy to spawn
                var spawn = creep.pos.findClosestByPath(FIND_STRUCTURES, 
                    {
                        filter: (s) => s.structureType == STRUCTURE_SPAWN && 
                            s.store.getFreeCapacity(RESOURCE_ENERGY) > 0});
                if (spawn) {
                    if (creep.transfer(spawn, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(spawn, {visualizePathStyle: {stroke: '#00ff00'}});
                    }
                    //switch renew back on
                    if (creep.memory.noRenew) delete creep.memory.noRenew;
                } else {
                    //upgrade controller
                    if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE)
                    {
                        creep.moveTo(creep.room.controller, 
                            {visualizePathStyle: {stroke: '#00ff00'}});
                    }
                }
                
            }
        }
    }
};


module.exports = rolePioneer;