/*
Memory Layout
.role = "hauler"
.harvesting = true/false
.renewSelf = true/false
.container = container.id // link.id
.target = target.id
*/

var roleHauler = {
	run: function(creep) {
		if (!creep.memory.container)
		{
			roleHauler.pickOwnContainer(creep);
		}
		
		if (!creep.memory.harvesting && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.harvesting = true;
			delete creep.memory.target;
			
			//check container - if its linked go in to link mode
			if (roleHauler.checkContainerIsLinked(creep)) {
				roleHauler.pickSpawnLink(creep);
			}
        }
        if (creep.memory.harvesting && creep.store.getFreeCapacity() == 0) {
            creep.memory.harvesting = false;
			delete creep.memory.target;
        }
        
		//dropped energy
		if (baseCreep.pickupDroppedEnergy(creep, 4)) return;
        
        if (creep.memory.harvesting)
        {
	        var c = Game.getObjectById(creep.memory.container);
	        if (!c) { delete creep.memory.container; return; }
			
	        if (creep.withdraw(c, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
		    	creep.moveTo(c, {visualizePathStyle: {stroke: '#ff0000'}});
	        }
	        
	        //no more energy in container - stop and carry to base
	        if (c.store[RESOURCE_ENERGY] == 0)
	        {
		        creep.memory.harvesting = false;
	        }
        } 
        else 
        {
			//pick energy receiver
	        if (!creep.memory.target) {
				roleHauler.pickEnergyReceiver(creep);
			}
			
	        
	        var target = Game.getObjectById(creep.memory.target);
	        if (target) 
			{
				//target valid - go to target and transfer
				var ret = creep.transfer(target, RESOURCE_ENERGY);
				if(ret == ERR_NOT_IN_RANGE) {
					creep.moveTo(target, {visualizePathStyle: {stroke: '#00ff00'}});
				}
				//target full - search new target
				if (target.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
					delete creep.memory.target;
				}
				//target will be full i next tick
				if (ret == OK) {
					if (target.store.getFreeCapacity(RESOURCE_ENERGY) <= creep.store[RESOURCE_ENERGY]) {
						delete creep.memory.target;
					}
				}
			}
	        else 
	        {
				//delete just in case
				delete creep.memory.target;
				
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
			var links = c.pos.findInRange(FIND_STRUCTURES, 2, {
		        filter: (structure) => {
		            return structure.structureType == STRUCTURE_LINK;
		        }});
				
		    if (sources.length == 0) continue;
			if (links.length != 0) continue;
		    
		    
		    var contPicked = false;
			
			for (var i in Memory.creeps)
			{
				if (Memory.creeps[i].container == c.id && 
					Memory.creeps[i].role == "hauler")
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
	    
		//no container found - pick spawn link if possible
		roleHauler.pickSpawnLink(creep);
		
	    return false;
	}, 
	
	pickSpawnLink: function(creep) {
		var spawnlink = baseCreep.getSpawnLink(creep.room);
		if (spawnlink)
		{
			creep.memory.container = spawnlink.id;
		}
	}, 
	
	checkContainerIsLinked: function(creep) {
		var c = Game.getObjectById(creep.memory.container);
		if (!c) { delete creep.memory.container; return false; }
		
		var links = c.pos.findInRange(FIND_STRUCTURES, 2, {
			filter: (structure) => {
				return structure.structureType == STRUCTURE_LINK;
			}});
		if (links.length > 0)
		{
			return true;
		}
		return false;
	}, 
	
	pickEnergyReceiver: function(creep) {
		// Prio 1: SPAWNS, Extensions
		var prio1 = creep.pos.findClosestByPath(FIND_STRUCTURES, {
			filter: (structure) => {
				return (structure.structureType == STRUCTURE_EXTENSION ||
					structure.structureType == STRUCTURE_SPAWN) &&
					structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
			}
		});
		
		//prio 2: towers
		var prio2 = creep.pos.findClosestByPath(FIND_STRUCTURES, {
			filter: (structure) => {
				return (structure.structureType == STRUCTURE_TOWER && 
					structure.store.getFreeCapacity(RESOURCE_ENERGY) > 10);
			}
		});
		
		// Prio 3: Containers, Storage
		var prio3 = creep.pos.findClosestByPath(FIND_STRUCTURES, {
			filter: (structure) => {
				return (structure.structureType == STRUCTURE_STORAGE || 
					(structure.structureType == STRUCTURE_CONTAINER && structure.pos.findInRange(FIND_SOURCES, 2).length == 0)) &&
					structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
			}
		});
		
		var targets = [];
		if (prio1)
			targets.push(prio1);
		if (prio2)
			targets.push(prio2);
		if (prio3)
			targets.push(prio3);
		
		if(targets.length > 0) {
			creep.memory.target = targets[0].id
		}
	}
	
	
	
};


module.exports = roleHauler;