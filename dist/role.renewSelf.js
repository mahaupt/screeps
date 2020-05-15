var roleRenewSelf = {
	
	/** @param {Creep} creep **/
	run: function(creep) {		
		//go back to spawn
        var targets = creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_EXTENSION ||
                    structure.structureType == STRUCTURE_SPAWN ||
                    structure.structureType == STRUCTURE_TOWER) &&
                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            }
        });
        var spawns = creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_SPAWN;
            }
        });
        
        
        if (spawns.length > 0)
        {
	        //recycle self to build better creep
	        if (!creep.memory.killSelf)
	        {
		        roleRenewSelf.killSelfDecision(creep);
	        }
	        
	        if (creep.store[RESOURCE_ENERGY] > 0 && targets.length > 0) {
		        if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
	                creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#0000ff'}});
	            }
	        } else {
		        //renew self vs recycle self
		        if (creep.memory.killSelf)
		        {
			        if (spawns[0].recycleCreep(creep) == ERR_NOT_IN_RANGE)
			        {
				        creep.moveTo(spawns[0], {visualizePathStyle: {stroke: '#0000ff'}});
			        }
			        creep.say("RIP");
			        return;
		        } else {
			        if (spawns[0].renewCreep(creep) == ERR_NOT_IN_RANGE)
			        {
				        creep.moveTo(spawns[0], {visualizePathStyle: {stroke: '#0000ff'}});
			        }
		        }
		    }
        }
        
        
        //renew successful or energy empty
        if (creep.ticksToLive >= 1400)
        {
	        creep.memory.renewSelf = false;
        }
        if (targets.length > 0)
        {
	        if (creep.store[RESOURCE_ENERGY] == 0 && creep.room.energyAvailable < 10)
	        {
		        creep.memory.renewSelf = false;
	        }
        }
	}, 
	
	
	killSelfDecision: function(creep) 
	{
		var bodyIterations = Math.floor(creep.room.energyAvailable/400)-1;
        bodyIterations = Math.min(bodyIterations, 1);
        var possibleBodyParts = 3 + 3*bodyIterations;
		var freeEnergyCapacity = creep.room.energyCapacityAvailable - creep.room.energyAvailable;
		var recycleEnergy = creep.body.length*75 + creep.store[RESOURCE_ENERGY];
		
		//could produce better creep and has enough energy capacity to handle recycling
		if (freeEnergyCapacity >= recycleEnergy && possibleBodyParts > creep.body.length)
        {
	        creep.memory.killSelf = true;
        }
		
		//special kill decision: miner
		//upgrade to at least 2 works when having a container
		if (creep.memory.role == 'miner' && creep.memory.container)
		{
			if (_.sum(creep.body, (c) => c.type == WORK) == 1)
			{
				console.log(creep.name + " kills himself due special rule");
				creep.memory.killSelf = true;
			}
		}
	}
}

module.exports = roleRenewSelf;