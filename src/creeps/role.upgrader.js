/*
Memory Layout
role = 'upgrader'
home = home room name

harvesting = true/false
source = source id / container id
*/

module.exports = {
    name: 'upgrader', 
    run: function(creep) {
        baseCreep.init(creep);
        
        
        //go home if lost
        if (!creep.isAtHome) {
            baseCreep.moveToRoom(creep, creep.memory.home);
            return;
        }
        
        //flee
        if (creep.room.memory.attacked_time + 30 > Game.time) {
            var tower = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter: (s) => s.structureType == STRUCTURE_TOWER});
            if (tower) {
                baseCreep.moveTo(creep, tower, {range: 2});
                return;
            }
        }
        
        if (!creep.memory.harvesting && creep.store[RESOURCE_ENERGY] == 0) {
            if (creep.ticksToLive < 100) { 
                // not enough ticks for building, recycle
                creep.memory.renewSelf = true;
                creep.memory.killSelf = true;
                //TODO: spawn replacement
                return;
            }
            creep.memory.harvesting = true;
            baseCreep.deleteSource(creep);
        }
        if (creep.memory.harvesting && creep.store.getFreeCapacity() == 0) {
            creep.memory.harvesting = false;
            baseCreep.deleteSource(creep);
        }
        
        if (creep.memory.harvesting)
        {
            if (!creep.memory.source)
	        {
		        baseCreep.pickEnergySource(creep);
	        }
	        
	        baseCreep.goGetEnergyFromSource(creep);
	        
        } else {
            if (!creep.pos.inRangeTo(creep.room.controller, 3)) {
                baseCreep.moveTo(creep, creep.room.controller, {range: 3});
            } else {
                creep.upgradeController(creep.room.controller)
            }
        }
	}
};
