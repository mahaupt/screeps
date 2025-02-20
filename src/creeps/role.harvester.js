/*
Harvester goes to a different room and harvests resources until full

Memory Layout
role = 'harvester'
home = home room name

harvesting = true/false
troom = target room
source = source id
source_type = source type / deposit / mineral / source

*/
module.exports = {
    name: "harvester", 
    run: function(creep)
    {
        baseCreep.init(creep);
        
        if (creep.memory.harvesting && creep.store.getFreeCapacity() == 0) {
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
        
        //collect intel        
        Intel.collectIntel(creep, creep.room);

        
        //go home and offload
        if (!creep.memory.harvesting) {
            if (!creep.isAtHome) {
                baseCreep.moveToRoom(creep, creep.memory.home);
            } else {
                var target = creep.room.storage;
                if (creep.store[RESOURCE_ENERGY] == 0) {
                    target = creep.room.terminal || creep.room.storage;
                }
                
                if (!target || target.store.getFreeCapacity() == 0) {
                    target = creep.pos.findClosestByPath(FIND_STRUCTURES, {filter: (s) => s.structureType == STRUCTURE_CONTAINER && s.store.getFreeCapacity() > 0});
                }
                if (target) {
                    var res_types = baseCreep.getStoredResourceTypes(creep.store);
                    var resource = res_types[0];

                    if (!creep.pos.inRangeTo(target, 1)) {
                        baseCreep.moveTo(creep, target, {range:1});
                    } else {
                        creep.transfer(target, resource);
                    }
                }
            }
        } 
        else 
        {
            if (creep.room.name != creep.memory.troom) {
                baseCreep.moveToRoom(creep, creep.memory.troom);
            } else {
                
                if (!creep.memory.source) {
                    this.pickSource(creep);
                }
                
                var source = Game.getObjectById(creep.memory.source);
                if (!source) 
                {
                    //no source avbl - no longer needed
                    delete creep.memory.source; 
                    delete creep.memory.source_type;
                    creep.memory.killSelf = true;
                    creep.memory.renewSelf = true;
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
                if (!creep.pos.inRangeTo(source, 1)) {
                    baseCreep.moveTo(creep, source, {range:1});
                } else {
                    creep.harvest(source);
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
    }, 
    
    
    pickSource: function(creep)
    {
        var colleagues = _.filter(
            Memory.creeps, 
            (s) => s.role == 'harvester' && s.troom == creep.room.name
        );
        
        if (creep.home.controller.level >= 6) {
            var deposits = creep.room.find(FIND_DEPOSITS);
            if (deposits.length > 0 && deposits[0].lastCooldown < 10) {
                if (_.findIndex(colleagues, (s) => s.source == deposits[0].id) < 0) {
                    creep.memory.source = deposits[0].id;
                    creep.memory.source_type = 'deposit';
                    return;
                }
            }
            
            if (creep.room.mineral && creep.room.mineral.mineralAmount > 2000) {
                var extractor = creep.room.mineral.pos.findInRange(FIND_STRUCTURES, 0, {filter: (s) => s.structureType == STRUCTURE_EXTRACTOR });
                
                if (extractor.length > 0) {
                    if (_.findIndex(colleagues, (s) => s.source == creep.room.mineral.id) < 0) {
                        creep.memory.source = creep.room.mineral.id;
                        creep.memory.source_type = 'mineral';
                        return;
                    }
                }
            }
        }
        
        var sources = creep.room.sources;
        for (var src of sources) {
            if (_.findIndex(colleagues, (s) => s.source == src.id) < 0) {
                creep.memory.source = src.id;
                creep.memory.source_type = 'source';
                return;
            }
        }
        
    }
};