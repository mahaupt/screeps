var roleUpgrader = {

    /** @param {Creep} creep **/
    run: function(creep) {
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
		        commonFunctions.pickEnergySource(creep);
	        }
	        
	        commonFunctions.goGetEnergyFromSource(creep);
	        
        } else {
            if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#00ff00'}});
            }
        }
	}
};

module.exports = roleUpgrader;
