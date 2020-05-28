module.exports = {
	name: 'renewSelf', 
	run: function(creep) {		
		//go back to spawn
        var targets = creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_EXTENSION ||
                    structure.structureType == STRUCTURE_SPAWN) &&
                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            }
        });
        var spawns = creep.room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_SPAWN;
            }
        });
        
        
        if (spawns.length == 0)
		{
			//no spawn in room - try to go home
			if (creep.memory.home) {
				baseCreep.moveToRoom(creep, creep.memory.home);
			}
		} 
		else
        {
			//spawn in room
	        //recycle self to build better creep
	        if (!creep.memory.killSelf)
	        {
		        this.killSelfDecision(creep);
	        }
	        
			//carry energy to base
	        if (creep.store[RESOURCE_ENERGY] > 0 && targets.length > 0) {
		        if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
	                creep.moveTo(targets[0], {range: 1, visualizePathStyle: {stroke: '#0000ff'}});
	            }
	        } 
			else 
			{
		        //renew self vs recycle self
		        if (creep.memory.killSelf)
		        {
			        if (spawns[0].recycleCreep(creep) == ERR_NOT_IN_RANGE)
			        {
				        creep.moveTo(spawns[0], {range: 1, visualizePathStyle: {stroke: '#0000ff'}});
			        }
			        creep.say("RIP");
			        return;
		        } else {
					var ret = spawns[0].renewCreep(creep);
			        if (ret == ERR_NOT_IN_RANGE)
			        {
				        creep.moveTo(spawns[0], {range: 1, visualizePathStyle: {stroke: '#0000ff'}});
			        } else if (ret == ERR_FULL)
					{
						//renew successful
						creep.memory.renewSelf = false;
					}
		        }
		    }
        }
        
        
        //energy empty
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
		//never kill self creeps
		if (creep.memory.rome == 'soldier') return;
		
		var bodySize = baseCreep.getSuitableBodySize(creep.memory.role, creep.room.energyAvailable);
        var possibleBodyParts = baseCreep.buildBody(creep.room, creep.memory.role, bodySize).length;

		if (possibleBodyParts > creep.body.length)
        {
	        creep.memory.killSelf = true;
			
			//bugfix hauler didn't drop task
			if (creep.memory.role == "hauler" && creep.memory.task) {
				moduleLogistics.dropTask(creep.room, creep.memory.task, creep.store.getCapacity());
				creep.memory.task.s = null;
			}
        }
	}
};