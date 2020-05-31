/*
Harvester goes to a different room and harvests resources until full

Memory Layout
role = 'harvester'
home = home room name

harvesting = true/false
troom = target room
source = source id

*/
module.exports = {
    name: "harvester", 
    run: function(creep)
    {
        baseCreep.init(creep);
        
        if (!creep.memory.source || 
            creep.memory.harvesting && creep.store.getFreeCapacity() == 0) {
            creep.memory.harvesting = false;
        } else if (!creep.memory.harvesting && creep.store.getUsedCapacity() == 0) {
            creep.memory.harvesting = true;
        }
        
        //go home and offload
        if (!creep.memory.harvesting) {
            if (creep.room.name != creep.memory.home) {
                baseCreep.moveToRoom(creep, creep.memory.home);
            } else {
                var target = creep.room.storage;
                if (!target || target.store.getFreeCapacity() == 0) {
                    target = creep.room.findClosestByPath(FIND_STRUCTURES, {filter: (s) => s.structureType == STRUCTURE_CONTAINER && s.store.getFreeCapacity() > 0});
                }
                if (target) {
                    var res_types = baseCreep.getStoredResourceTypes(creep.store);
                    var resource = res_types[0];
                    
                    var ret = creep.transfer(target, resource);
                    if (ret == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, {range:1, visualizePathStyle: {stroke: '#00ff00'}});
                    }
                }
            }
        } 
        else 
        {
            if (creep.room.name != creep.memory.troom) {
                baseCreep.moveToRoom(creep, creep.memory.troom);
            } else {
                var source = Game.getObjectById(creep.memory.source);
                if (!source) 
                {
                    //no source - no longer needed
                    delete creep.memory.source; 
                    creep.memory.killSelf = true;
                    return;
                    
                }
                
                if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, {range:1, visualizePathStyle: {stroke: '#ff0000'}});
                }
            
            }
        }
    }
};