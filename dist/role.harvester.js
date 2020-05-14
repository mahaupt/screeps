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
				Game.notify("Creep " + creep.name + " didn't find any source");
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
                creep.moveTo(s, {visualizePathStyle: {stroke: '#ff0000'}});
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
	            
	            
	            if (c.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
	            
		            //repair vs drop
		            if (c.hits < c.hitsMax) {
			            creep.say("repairing");
			            if (creep.repair(c) == ERR_NOT_IN_RANGE) {
				            creep.moveTo(c, {visualizePathStyle: {stroke: '#00ff00'}});
			            }
			        } else {
				        creep.say("dropping");
				        if (creep.transfer(c, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
				        {
					        creep.moveTo(c, {visualizePathStyle: {stroke: '#00ff00'}});
				        }
				    }
				    
				} else {
					creep.say("MC full!");
					roleHarvester.carryEnergyBackToBase(creep);
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
                creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#00ff00'}});
            }
        } else {
            //maybe build construction sites
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
	}, 
	
	pickOwnSource: function(creep) {
		var sources = creep.room.find(FIND_SOURCES);
		
		//find new unoccupied source
		var sourcePicked = {};
		for (var source of sources)
		{
			sourcePicked[source.id] = 0;
			
			for (var i in Memory.creeps)
			{
				if (Memory.creeps[i].source == source.id)
				{
					sourcePicked[source.id]++;
				}
			}
		}
		
		var min_picked = 9999;
		var min_id = false;
		for(var sid in sourcePicked)
		{
			if (min_picked > sourcePicked[sid]) {
				min_id = sid;
				min_picked = sourcePicked[sid];
			}
		}
		
		if (min_id) {
			creep.memory.source = min_id;
			return true;
		}
		
		return false;
	}, 
	
	pickOwnContainer: function(creep) {
		//search containers
		if (!creep.memory.source) return false;
		var s = Game.getObjectById(creep.memory.source);
		var containers = s.pos.findInRange(FIND_STRUCTURES, 2, {
	        filter: (structure) => {
	            return structure.structureType == STRUCTURE_CONTAINER;
	        }});
		
		if (containers.length > 0)
		{
			creep.memory.container = containers[0].id;
			return true;
		}
		
		return false;
	}
};

module.exports = roleHarvester;
