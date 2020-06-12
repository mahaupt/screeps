/*
Memory Layout
role = 'upgrader'
home = home room name

harvesting = true/false
source = source id / container id
*/

module.exports = {
    name: 'claimer', 
    run: function(creep) {
        baseCreep.init(creep);
        
        
        //go home if lost
        if (creep.room.name != creep.memory.home) {
            baseCreep.moveToRoom(creep, creep.memory.home);
            return;
        }
        
        //flee
        if (creep.room.memory.attacked_time + 30 > Game.time) {
            var tower = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter: (s) => s.structureType == STRUCTURE_TOWER});
            if (tower) {
                creep.moveTo(tower, {range: 2, visualizePathStyle: {stroke: '#00ff00'}});
                return;
            }
        }
        
        if (!creep.memory.harvesting && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.harvesting = true;
            delete creep.memory.source;
        }
        if (creep.memory.harvesting && creep.store.getFreeCapacity() == 0) {
            creep.memory.harvesting = false;
            delete creep.memory.source;
        }
        
        if (creep.memory.harvesting)
        {
            if (!creep.memory.source)
	        {
		        baseCreep.pickEnergySource(creep);
	        }
	        
	        baseCreep.goGetEnergyFromSource(creep);
	        
        } else {
            if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, {range: 3, visualizePathStyle: {stroke: '#00ff00'}});
            }
        }
	}
};
