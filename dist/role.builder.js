var roleBuilder = {

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
	        //repairs needed - except mining containers
	        var repairs = creep.room.find(FIND_STRUCTURES, {
	            filter: (structure) => {
	                return (structure.hits < structure.hitsMax && structure.pos.findInRange(FIND_SOURCES, 2).length == 0);
	            }
	        });
	        if (repairs.length > 0)
	        {
		        if(creep.repair(repairs[0]) == ERR_NOT_IN_RANGE) {
    				creep.moveTo(repairs[0], {visualizePathStyle: {stroke: '#00ff00'}});
    			}
	        } else {
	        
	        
		        //construction sites
	            var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
	    		if(targets.length > 0) {
	    			if(creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
	    				creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#00ff00'}});
	    			}
	    		} else {
	    		    //upgrade if no construction site
	    		    if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
	                    creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#00ff00'}});
	                }
	    		}
	    		
	    	}
        }
    }
}

module.exports = roleBuilder;
