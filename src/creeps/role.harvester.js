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
            creep.memory.startTravel = Game.time;
            delete creep.memory.travelTime;
            
            //prepare before embarking
            if (creep.ticksToLive <= 800) {
                creep.memory.renewSelf = true;
            }
        }
        
        //go home and offload
        if (!creep.memory.harvesting) {
            if (creep.room.name != creep.memory.home) {
                baseCreep.moveToRoom(creep, creep.memory.home);
            } else {
                var target = creep.room.terminal || creep.room.storage;
                if (!target || target.store.getFreeCapacity() == 0) {
                    target = creep.room.findClosestByPath(FIND_STRUCTURES, {filter: (s) => s.structureType == STRUCTURE_CONTAINER && s.store.getFreeCapacity() > 0});
                }
                if (target) {
                    var res_types = baseCreep.getStoredResourceTypes(creep.store);
                    var resource = res_types[0];
                    
                    let ret = creep.transfer(target, resource);
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
                
                // ABORT CONDITIONS
                if (source instanceof Deposit) {
                    if (source.lastCooldown > 30) {
                        creep.memory.killSelf = true; //kill on next renew
                    }
                } else 
                if (source instanceof Mineral) {
                    if (source.mineralAmount == 0) {
                        creep.memory.killSelf = true;
                        creep.memory.harvesting = false;
                        return;
                    }
                } else 
                if (source instanceof Source) {
                    if (source.energy == 0) {
                        creep.memory.harvesting = false;
                        return;
                    }
                }
                
                // HARVEST
                let ret = creep.harvest(source);
                if (ret == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, {range:1, visualizePathStyle: {stroke: '#ff0000'}});
                } else if (ret == OK) {
                    //calc travel time
                    if (!creep.memory.travelTime) {
                        creep.memory.travelTime = Game.time - creep.memory.startTravel;
                        creep.memory.travelTime *= 1.25; //full cargo travel time
                        creep.memory.travelTime += 50; //final reserve
                        creep.memory.travelTime = Math.round(creep.memory.travelTime);
                        creep.memory.travelTime = Math.max(creep.memory.travelTime, 200);
                    }
                }
            }
            
            //abort to have time to travel home
            if (creep.ticksToLive <= creep.memory.travelTime) {
                creep.memory.harvesting = false;
            }
        }
    }
};