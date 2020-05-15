var roleHauler = {
	run: function(creep) {
		if (!creep.memory.container)
		{
			roleHauler.pickOwnContainer(creep);
		}
		
		if (!creep.memory.harvesting && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.harvesting = true;
        }
        if (creep.memory.harvesting && creep.store.getFreeCapacity() == 0) {
            creep.memory.harvesting = false;
        }
        
        
        if (creep.memory.harvesting)
        {
	        var c = Game.getObjectById(creep.memory.container);
	        if (!c) { delete creep.memory.container; return; }
	        
	        if (creep.withdraw(c, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
		    	creep.moveTo(c, {visualizePathStyle: {stroke: '#ff0000'}});
	        }
	        
	        //no more energy - stop and carry to base
	        if (c.store[RESOURCE_ENERGY] == 0)
	        {
		        creep.memory.harvesting = false;
	        }
        } 
        else 
        {
	        
	        // Prio 1: SPAWNS, Extensions
	        var prio1 = creep.room.find(FIND_STRUCTURES, {
	            filter: (structure) => {
	                return (structure.structureType == STRUCTURE_EXTENSION ||
	                    structure.structureType == STRUCTURE_SPAWN ||
	                    structure.structureType == STRUCTURE_TOWER) &&
	                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
	            }
	        });
	        
	        // Prio 2: Containers, Storage
	        var prio2 = creep.room.find(FIND_STRUCTURES, {
	            filter: (structure) => {
	                return (structure.structureType == STRUCTURE_STORAGE || 
	                    (structure.structureType == STRUCTURE_CONTAINER && structure.pos.findInRange(FIND_SOURCES, 2).length == 0)) &&
	                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
	            }
	        });
			
			var targets = prio1.concat(prio2);
	        
	        
	        //drop stuff
	        if(targets.length > 0) {
	            if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
	                creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#00ff00'}});
	            }
	        } 
	        else 
	        {
		    	//no free capacity - just walk to spawn and wait
		    	var spawn = creep.room.find(FIND_STRUCTURES, {
	            	filter: (structure) => {
		                return (structure.structureType == STRUCTURE_SPAWN);
		            }
		        });
		        if (spawn.length > 0)
		        {
			        creep.moveTo(spawn[0], {visualizePathStyle: {stroke: '#00ff00'}});
		        }
		        
	        }
	    }
	}, 
	
	pickOwnContainer: function(creep) {
		var containers = creep.room.find(FIND_STRUCTURES, {
	        filter: (structure) => {
	            return structure.structureType == STRUCTURE_CONTAINER;
	        }});
	        
	    for (var c of containers)
	    {
		    //check mining container
		    var sources = c.pos.findInRange(FIND_SOURCES, 2);
		    if (sources.length == 0) continue;
		    
		    
		    var contPicked = false;
			
			for (var i in Memory.creeps)
			{
				if (Memory.creeps[i].container == c.id && Memory.creeps[i].role == "hauler")
				{
					contPicked = true;
				}
			}
			
			if (!contPicked)
			{
				creep.memory.container = c.id;
				return true;
			}
	    }
	    
	    return false;
	}
	
	
	
}


module.exports = roleHauler;