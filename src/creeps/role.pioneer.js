// Game.spawns.Spawn1.spawnCreep([WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], "Pioneer", {memory: {role: 'pioneer', target: 'W7N3'}})
// [WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE]

var rolePioneer = {
    run: function(creep)
    {
        //set home
        if (!creep.memory.home)
        {
            creep.memory.home = creep.room.name;
        }
        
        //wait for target
        if (!creep.memory.target)
        {
            creep.moveTo(creep.room.controller);
            return;
        }
        
        //prepare creep for embarkation
        if (!creep.memory.embark)
        {
            rolePioneer.prepareCreep(creep);
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
            
            creep.moveTo(creep.room.controller);
            
        } else {
            //harvest and build spawn
            if (!creep.memory.harvest && creep.store[RESOURCE_ENERGY] == 0) {
                creep.memory.harvest = true;
            } else if (creep.memory.harvest && creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
                creep.memory.harvest = false;
            }
            
            
            if (creep.memory.harvest)
            {
                //dropped energy
        		if (baseCreep.pickupDroppedEnergy(creep, 4)) { return; }
                
                var source = creep.pos.findClosestByPath(FIND_SOURCES);
                if (source)
                {
                    if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(source);
                    }
                }
            } else {
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
                        creep.moveTo(creep.room.controller);
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
                            creep.moveTo(consite);
                        }
                    } else {
                        //transfer energy to spawn
                        var spawn = creep.pos.findClosestByPath(FIND_STRUCTURES, 
                            {
                                filter: (s) => s.structureType == STRUCTURE_SPAWN && 
                                    s.store.getFreeCapacity(RESOURCE_ENERGY) > 0});
                        if (spawn) {
                            if (creep.transfer(spawn, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                                creep.moveTo(spawn);
                            }
                        } else {
                            //upgrade controller
                            if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE)
                            {
                                creep.moveTo(creep.room.controller);
                            }
                        }
                        
                    }
                }
            }
            
            
        }
        
        
    },
    
    
    prepareCreep: function(creep)
    {
        //renew creeps
        var spawns = creep.room.find(FIND_STRUCTURES, {filter: (s) => s.structureType == STRUCTURE_SPAWN});

        if (spawns.length > 0)
        {
            var xx = spawns[0].renewCreep(creep);
            if (xx == ERR_NOT_IN_RANGE) {
                creep.moveTo(spawns[0]);
            }
        }
        
        if (creep.ticksToLive >= 1400) {
            creep.memory.embark = true;
        }
    }
};


module.exports = rolePioneer;