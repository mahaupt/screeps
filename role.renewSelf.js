var roleRenewSelf = {
	
	/** @param {Creep} creep **/
	run: function(creep) {		
		//go back to spawn
        var targets = creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_SPAWN;
            }
        });
        
        if (targets.length > 0)
        {
	        if (creep.store[RESOURCE_ENERGY] > 0 && targets[0].store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
		        if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
	                creep.moveTo(targets[0]);
	            }
	        } else {
		        if (Game.spawn[targets[0]].renewCreep(creep) == ERR_NOT_IN_RANGE)
		        {
			        creep.moveTo(targets[0]);
		        }
	        }
            
        }
        
        //renew successful or energy empty
        if (creep.ticksToLive >= 1100 || (creep.store[RESOURCE_ENERGY] == 0 && targets[0].store[RESOURCE_ENERGY] == 0))
        {
	        creep.memory.renewSelf = false;
        }
	}
}

module.exports = roleRenewSelf;