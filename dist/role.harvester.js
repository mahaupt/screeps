/*
Memory Layout
.role = "harvester"
.harvesting = true/false
.renewSelf = true/false
.source = source.id
.container = container.id	
*/

var roleHarvester = {

    /** @param {Creep} creep **/
    run: function(creep) 
    {
	    //first - pick own source
	    if (!creep.memory.source) {
		    creep.say("picking own source");
		    if (!roleHarvester.pickOwnSource(creep))
		    {
			    console.log("Creep " + creep.name + " didn't find any source");
				Game.notity("Creep " + creep.name + " didn't find any source");
		    }
	    }
	    
        if (!creep.memory.harvesting && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.harvesting = true;
        }
        if (creep.memory.harvesting && creep.store.getFreeCapacity() == 0) {
            creep.memory.harvesting = false;
        }
        
	    if(creep.memory.harvesting) 
	    {
            var s = Game.getObjectById(creep.memory.source);
            if(creep.harvest(s) == ERR_NOT_IN_RANGE) {
                creep.moveTo(s);
            }
        }
        else 
        {   
            //carry energy to Containers
            if (creep.memory.container)
            {
	            //carry to container
	            var c = Game.getObjectById(creep.memory.container);
	            if (!c) { delete creep.memory.container; return; }
	            
	            if (c.pos.isEqualTo(creep.pos)) {
	                creep.drop(RESOURCE_ENERGY);
	                creep.say("dropping");
	            } else {
		            creep.moveTo(c);
		        }
	            
            } else {
	            roleHarvester.pickOwnContainer(creep);
	        	roleHarvester.carryEnergyBackToBase(creep);
            }
        }
	},
	
	carryEnergyBackToBase: function(creep) 
	{
		var targets = creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_EXTENSION ||
                    structure.structureType == STRUCTURE_SPAWN ||
                    structure.structureType == STRUCTURE_TOWER) &&
                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            }
        });
        if(targets.length > 0) {
            if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(targets[0]);
            }
        } else {
            //maybe build construction sites
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
	
	pickOwnSource: function(creep) {
		var sources = creep.room.find(FIND_SOURCES);
		
		//find new unoccupied source
		for (var source of sources)
		{
			var alreadyPicked = false;
			
			for (var i in Memory.creeps)
			{
				if (Memory.creeps[i].source == source.id)
				{
					alreadyPicked = true;
				}
			}
			
			//source is not yet occupied by creep
			if (!alreadyPicked)
			{
				creep.memory.source = source.id;
				return true;
			}
		}
		
		return false;
	}, 
	
	pickOwnContainer: function(creep) {
		//search containers
		if (!creep.memory.source) return false;
		var s = Game.getObjectById(creep.memory.source);
		var containers = s.pos.findInRange(FIND_MY_STRUCTURES, 1, {
	        filter: (structure) => {
	            return structure.structureType == STRUCTURE_CONTAINER;
	        }});
	    console.log(containers.length);
		
		if (containers.length > 0)
		{
			creep.memory.container = containers[0].id;
			return true;
		}
		
		return false;
	}
};

module.exports = roleHarvester;
