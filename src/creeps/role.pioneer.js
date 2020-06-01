/*
Memory Layout
role = 'builder'
home = home room name

troom = target room
harvesting = true / false

*/

module.exports = {
    name: 'pioneer', 
    run: function(creep)
    {
        baseCreep.init(creep);
        
        //wait for target
        if (!creep.memory.troom)
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
        
        //collect intel        
        baseCreep.collectIntel(creep, creep.room);
        
        //move to target room
        if (creep.room.name != creep.memory.troom)
        {
            baseCreep.moveToRoom(creep, creep.memory.troom);
            return;
        }
        
        //wait for controller to be captured
        if (!creep.room.controller.my) {
            if (creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                this.harvest(creep);
            }
        } else {
            //harvest and build spawn
            if (!creep.memory.harvesting && creep.store[RESOURCE_ENERGY] == 0) {
                creep.memory.harvesting = true;
            } else if (creep.memory.harvesting && creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
                creep.memory.harvesting = false;
            }
            
            
            if (creep.memory.harvesting)
            {
        		this.harvest(creep);
            } else {
                this.build(creep);
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
                creep.memory.harvesting = false;
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
                creep.moveTo(creep.room.controller, {range: 3, visualizePathStyle: {stroke: '#00ff00'}});
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
                    creep.moveTo(consite, {range: 3, visualizePathStyle: {stroke: '#00ff00'}});
                }
            } else {
                //transfer energy to spawn
                var spawn = creep.pos.findClosestByPath(FIND_STRUCTURES, 
                    {
                        filter: (s) => s.structureType == STRUCTURE_SPAWN && 
                            s.store.getFreeCapacity(RESOURCE_ENERGY) > 0});
                if (spawn) {
                    if (creep.transfer(spawn, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(spawn, {range: 1, visualizePathStyle: {stroke: '#00ff00'}});
                    }
                    //switch renew back on
                    if (creep.memory.noRenew) delete creep.memory.noRenew;
                } else {
                    //upgrade controller
                    if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE)
                    {
                        creep.moveTo(creep.room.controller, 
                            {range: 3, visualizePathStyle: {stroke: '#00ff00'}});
                    }
                }
                
            }
        }
    }
};