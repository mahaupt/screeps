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
		        roleBuilder.pickEnergySource(creep);
	        }
	        
	        
	        var source = Game.getObjectById(creep.memory.source);
	        if (!source) { delete creep.memory.source; return; }
	        
	        if (source instanceof Source) {
		        if(creep.harvest(s) == ERR_NOT_IN_RANGE) {
	                creep.moveTo(s);
	            }
	        }
	        else
	        {
		        if(creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
	                creep.moveTo(source);
	            }
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
    }, 
    
    
    pickEnergySource: function(creep) 
    {
	    //try to find half full containers
	    var c = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_CONTAINER) &&
                    structure.store.getUsedCapacity(RESOURCE_ENERGY)/structure.store.getCapacity(RESOURCE_ENERGY) > 0.3 || 
                    (structure.structureType == STRUCTURE_CONTAINER) && structure.pos.findInRange(FIND_SOURCES, 2).length == 0;
            }
        });
        if (c)
        {
	        creep.memory.source = c.id;
	    } else {
		    var s = creep.pos.findClosestByPath(FIND_SOURCES);
		    creep.memory.source = s.id;
	    }
    }
}

module.exports = roleBuilder;
