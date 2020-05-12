var roleBuilder = {

    /** @param {Creep} creep **/
    run: function(creep) {
        if (!creep.memory.harvesting && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.harvesting = true;
        }
        if (creep.memory.harvesting && creep.store.getFreeCapacity() == 0) {
            creep.memory.harvesting = false;
        }
        
        if (creep.memory.harvesting)
        {
            var s = creep.pos.findClosestByPath(FIND_SOURCES);
            if(creep.harvest(s) == ERR_NOT_IN_RANGE) {
                creep.moveTo(s);
            }
        } else {
            var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
    		if(targets.length > 0) {
    			if(creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
    				creep.moveTo(targets[0]);
    			}
    		} else {
    		    //upgrade if no construction site
    		    if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.controller);
                }
    		}
        }
    }
}

module.exports = roleBuilder;
