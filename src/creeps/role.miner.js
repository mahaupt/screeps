/*
Memory Layout
.role = "miner"
.harvesting = true/false
.renewSelf = true/false
.source = source.id
.container = container.id
.link = link.id	
.containerLinkPurge - special mode pouring the container into the link
Priorities of dropoff
- Link
- Container if link full or not avbl
- Carry to base if Container full or no hauler avbl
*/

var roleMiner = {

    /** @param {Creep} creep **/
    run: function(creep) 
    {    
	    //first - pick own source
	    if (!creep.memory.source) {
		    if (!roleMiner.pickOwnSource(creep))
		    {
			    console.log("Creep " + creep.name + " didn't find any source");
				Game.notify("Creep " + creep.name + " didn't find any source");
		    }
	    }
        
        //Special mode
        if (creep.memory.containerLinkPurge) {
            roleMiner.containerLinkPurge(creep);
            return;
        }
        
	    //switching btn harvesting and dropping
        if (!creep.memory.harvesting && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.harvesting = true;
        }
        if (creep.memory.harvesting && creep.store.getFreeCapacity() == 0) {
            creep.memory.harvesting = false;
            
            //link harvesting
            if (!creep.memory.link)
            {
                roleMiner.pickOwnLink(creep);
            }
            
            //try to pick own container for container harvesting
            if (!creep.memory.container) {
                roleMiner.pickOwnContainer(creep);
            } else if (!roleMiner.containerHasHauler(creep, creep.memory.container)) 
            {
                //hauler died - go back to normal harvesting
                delete creep.memory.container;
            }
        }
        
        
	    if(creep.memory.harvesting) 
	    {
            var s = Game.getObjectById(creep.memory.source);
            if(creep.harvest(s) == ERR_NOT_IN_RANGE) {
                creep.moveTo(s, {visualizePathStyle: {stroke: '#ff0000'}});
            }
            
            //link in range - carry to link immediately
            if (creep.memory.link)
            {
                //maybe withdraw from container?
                var l = Game.getObjectById(creep.memory.link);
                if (!l) { delete creep.memory.link; return; }
                var xx = creep.transfer(l, RESOURCE_ENERGY);
                
                if (l.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
                    baseCreep.sendLinkToSpawn(l);
                }
                
                //switch to special mode if container storage full
                if (l.store.getFreeCapacity(RESOURCE_ENERGY) > 0 && creep.memory.container)
                {
                    var c = Game.getObjectById(creep.memory.container);
    	            if (!c) { delete creep.memory.container; return; }
                    if (c.store[RESOURCE_ENERGY] > LINK_CAPACITY) {
                        creep.memory.containerLinkPurge = true;
                    }
                }
                
                if (xx == OK) {
                    return;
                }
            }
            
            //container in range - carry to container immediately
            if (creep.memory.container)
            {
	            var c = Game.getObjectById(creep.memory.container);
	            if (!c) { delete creep.memory.container; return; }
                if (c.hits == c.hitsMax) 
                { // if damaged keep energy and repair later
                    creep.transfer(c, RESOURCE_ENERGY);
                }
            }
        }
        else 
        { //not harvesting  
            
            //Drop into Mining Container
            if (creep.memory.container)
            {
	            //carry to container
	            var c = Game.getObjectById(creep.memory.container);
	            if (!c) { delete creep.memory.container; return; }
	            
	            
	            if (c.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
	            
		            //repair vs transfer
		            if (c.hits < c.hitsMax) {
			            if (creep.repair(c) == ERR_NOT_IN_RANGE) {
				            creep.moveTo(c, {visualizePathStyle: {stroke: '#00ff00'}});
			            }
			        } else {
				        if (creep.transfer(c, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
				        {
					        creep.moveTo(c, {visualizePathStyle: {stroke: '#00ff00'}});
				        }
				    }
				    
				} else {
                    //stop container mining temp. and assist transport chain
                    delete creep.memory.container;
					creep.say("MC full!");
					roleMiner.carryEnergyBackToBase(creep);
				}
	            
            } else {
                //no mining container
	        	roleMiner.carryEnergyBackToBase(creep);
            }
        }
	},
    
    //special mode - picks up Energy from container
    //and drops into link
    containerLinkPurge: function(creep)
    {
        var c = Game.getObjectById(creep.memory.container);
        var l = Game.getObjectById(creep.memory.link);
        
        if (!c) { 
            delete creep.memory.container;
            delete creep.memory.containerLinkPurge;
            return;
        }
        if (!l) {
            delete creep.memory.link;
            delete creep.memory.containerLinkPurge;
            return;
        }
        
        creep.say("CL-TX");
        
        if (creep.store[RESOURCE_ENERGY] == 0) {
            //pickup
            if (creep.withdraw(c, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ff0000'}});
            }
        } else {
            //dropoff
            if (creep.transfer(l, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#00ff00'}});
            }
        }
        
        //terminating pouring
        if (c.store[RESOURCE_ENERGY] == 0 || l.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
            delete creep.memory.containerLinkPurge;
        }
    }, 
	
    //carry energy back to base into structures
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
				if (Memory.creeps[i].source == source.id &&
                     Memory.creeps[i].role == "miner")
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
		var container = roleMiner.getMiningStructure(s, STRUCTURE_CONTAINER);
        if (container) {
            if (roleMiner.containerHasHauler(creep, container.id))
            {
                creep.memory.container = container.id;
                return true;
            }
		}
		
		return false;
	},
    
    pickOwnLink: function(creep) {
        if (!creep.memory.source) return false;
		var s = Game.getObjectById(creep.memory.source);
        
        //check if there is a link around spawn
        var spawnlink = baseCreep.getSpawnLink(creep.room);
        if (!spawnlink) return false;
        
        var link = roleMiner.getMiningStructure(s, STRUCTURE_LINK);
        if (link) {
            creep.memory.link = link.id;
            return true;
        }
        return false;
    }, 
    
    getMiningStructure: function(source, type)
    {
        var structures = source.pos.findInRange(FIND_STRUCTURES, 2, {
	        filter: (structure) => {
	            return structure.structureType == type;
	        }});
        
        if (structures.length > 0)
		{
            return structures[0];
		}
        return false;
    },
	
	
	containerHasHauler: function(creep, containerid)
	{
        //link acts as hauler
        if (creep.memory.link) return true;
        
		for (var i in Memory.creeps)
		{
			if (Memory.creeps[i].container == containerid && 
				Memory.creeps[i].role == "hauler")
			{
				return true;
			}
		}
		return false;
	}
    
};

module.exports = roleMiner;
